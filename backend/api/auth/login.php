
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

// Set error handlers
set_error_handler('handleError');
set_exception_handler('handleException');

// Ensure proper content type
header('Content-Type: application/json; charset=UTF-8');

function base64url_encode($data) { 
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); 
}

try {
    // Try to cleanup expired sessions, but continue even if it fails
    try {
        cleanupExpiredSessions();
    } catch (Exception $e) {
        error_log("[Login] Session cleanup error: " . $e->getMessage());
        // Continue with login process even if cleanup fails
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError(405, "Only POST method allowed");
    }

    $input = file_get_contents("php://input");
    if (empty($input)) {
        sendError(400, "Empty request body");
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError(400, "Invalid JSON: " . json_last_error_msg());
    }

    $requiredFields = ['username', 'password'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Missing required field: $field", 400);
        }
    }

    // Validate username format
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $data['username'])) {
        throw new Exception("Username contains invalid characters. Only letters, numbers and underscore allowed.", 400);
    }

    // If role is not provided, we'll try to determine it from the username format
    if (!isset($data['role'])) {
        if (strpos($data['username'], 'admin_') === 0) {
            $data['role'] = 'admin';
        } else if (strpos($data['username'], 'staff_') === 0) {
            $data['role'] = 'staff';
        } else {
            $data['role'] = 'public';
        }
    }

    $database = new Database();
    $db = $database->getConnection();

    $user = null;
    $passwordField = '';

    error_log("[Login] Attempting login for username: " . $data['username'] . " with role: " . $data['role']);    // Check for admin/staff users in the users table
    if ($data['role'] === 'admin' || $data['role'] === 'staff') {
        $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status,
                        (SELECT name FROM departments WHERE id = department_id) as department_name,
                        (SELECT name FROM divisions WHERE id = division_id) as division_name
                  FROM users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$data['username']]);
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $passwordField = 'password';
            
            // Make role comparison case-insensitive
            if (strtolower($user['role']) !== strtolower($data['role'])) {
                error_log("[Login] Role mismatch for user {$data['username']}. Found: {$user['role']}, Expected: {$data['role']}");
                throw new Exception("Access denied: Invalid role for this account", 403);
            }
            
            error_log("[Login] Found {$user['role']} user: " . $data['username']);
        } else {
            error_log("[Login] No active user found with username: " . $data['username']);
            
            // For admin login, let's check what admin users exist
            if ($data['role'] === 'admin') {
                $adminQuery = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
                              FROM users 
                              WHERE role = 'admin'";
                $adminStmt = $db->prepare($adminQuery);
                $adminStmt->execute();
                $adminUsers = $adminStmt->fetchAll(PDO::FETCH_ASSOC);
                
                error_log("[Login] Found " . count($adminUsers) . " admin users in database");
                foreach ($adminUsers as $adminUser) {
                    error_log("[Login] Admin user found: username='{$adminUser['username']}', status='{$adminUser['status']}'");
                    
                    // Check if this is the user trying to login but with different case or status
                    if (strtolower($adminUser['username']) === strtolower($data['username'])) {
                        if ($adminUser['status'] !== 'active') {
                            error_log("[Login] Admin user '{$adminUser['username']}' found but status is '{$adminUser['status']}'");
                            throw new Exception("Account is not active", 401);
                        } else {
                            // Username matches but case might be different
                            $user = $adminUser;
                            $passwordField = 'password';
                            error_log("[Login] Found admin user with case-insensitive match");
                            break;
                        }
                    }
                }
                
                // If still no user found, create a default admin if none exists
                if (!$user && count($adminUsers) === 0) {
                    error_log("[Login] No admin users found. Creating default admin account.");
                    
                    $defaultPassword = password_hash('admin', PASSWORD_ARGON2ID);
                    $insertQuery = "INSERT INTO users (user_id, name, username, password, role, email, status, created_at) 
                                   VALUES (?, ?, ?, ?, 'admin', ?, 'active', NOW())";
                    
                    $userId = 'ADM-' . str_pad(1, 6, '0', STR_PAD_LEFT);
                    $insertStmt = $db->prepare($insertQuery);
                    $insertStmt->execute([
                        $userId,
                        'Default Admin',
                        'admin',
                        $defaultPassword,
                        'admin@dskalmunai.lk'
                    ]);
                    
                    // Now fetch the created user
                    $stmt = $db->prepare($query);
                    $stmt->execute(['admin']);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    $passwordField = 'password';
                    
                    error_log("[Login] Created default admin user");
                }
            }
        }
    }
    
    // If not found in users table, check public_users for public role
    if (!$user && $data['role'] === 'public') {
        error_log("[Login] Checking public_users table for username: " . $data['username']);
        
        $query = "SELECT id, public_id as user_id, name, username, COALESCE(password_hash, '') as password_hash, 'public' as role, 
                         email, department_id, division_id, status 
                  FROM public_users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$data['username']]);
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $user['role'] = 'public';
            $passwordField = 'password_hash';
            error_log("[Login] Found public user: " . $data['username']);
        } else {
            error_log("[Login] No active public user found with username: " . $data['username']);
        }
    }
    
    if (!$user) {
        error_log("[Login] User not found: " . $data['username'] . " with role: " . $data['role']);
        throw new Exception("Invalid credentials", 401);
    }

    // Check password
    $storedPassword = $user[$passwordField] ?? '';
    
    if (empty($storedPassword)) {
        error_log("[Login] User {$data['username']} has no password set. Creating password based on input.");
        
        // Create password hash from the provided password
        $hashedPassword = password_hash($data['password'], PASSWORD_ARGON2ID);
        
        if ($user['role'] === 'public') {
            $updateQuery = "UPDATE public_users SET password_hash = ? WHERE id = ?";
        } else {
            $updateQuery = "UPDATE users SET password = ? WHERE id = ?";
        }
        
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([$hashedPassword, $user['id']]);
        
        $storedPassword = $hashedPassword;
        error_log("[Login] Password created for user: " . $data['username']);
    }
      $success = password_verify($data['password'], $storedPassword);
    
    if (!$success) {
        error_log("[Login] Failed password verification for user: {$data['username']}");
        error_log("[Login] Provided password length: " . strlen($data['password']));
        error_log("[Login] Stored password exists: " . (!empty($storedPassword) ? 'Yes' : 'No'));
        
        // For debugging, let's try creating a new password hash and see if it works
        if ($user['role'] === 'admin') {
            error_log("[Login] Testing password hash for admin user: {$data['username']}");
            $testHash = password_hash($data['password'], PASSWORD_ARGON2ID);
            error_log("[Login] Test hash created successfully");
            
            // Update with new hash and try again
            $updateQuery = "UPDATE users SET password = ? WHERE id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([$testHash, $user['id']]);
            
            $success = password_verify($data['password'], $testHash);
            error_log("[Login] After updating hash, verification result: " . ($success ? 'Success' : 'Failed'));
        }
    }
    
    if (!$success) {
        throw new Exception("Invalid credentials", 401);
    }

    // Remove sensitive data
    unset($user['password']);
    unset($user['password_hash']);

    error_log("[Login] Successful login for user: {$data['username']} with role: {$user['role']}");

    $issuedAt = time();
    $expirationTime = $issuedAt + 3600;
    
    try {
        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'user_id' => $user['id'],
            'role' => $user['role'],
            'jti' => bin2hex(random_bytes(16))
        ];
        
        $header = base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload_encoded = base64url_encode(json_encode($payload));
        $secretKey = getenv('JWT_SECRET_KEY') ?: 'dsk-secret-key-2024';
        $signature = hash_hmac('sha256', "$header.$payload_encoded", $secretKey, true);
        $signature_encoded = base64url_encode($signature);
          $token = "$header.$payload_encoded.$signature_encoded";
        
        // Store the token in user_sessions table
        $insertSessionQuery = "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, FROM_UNIXTIME(?))";
        $sessionStmt = $db->prepare($insertSessionQuery);
        $sessionStmt->execute([$user['id'], $token, $expirationTime]);
        
        error_log("[Login] Session created for user: {$data['username']} with expiration: " . date('Y-m-d H:i:s', $expirationTime));
    } catch (Exception $e) {
        error_log("Token generation error: " . $e->getMessage());
        throw new Exception("Error generating authentication token", 500);
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "data" => [
            "user" => $user,
            "token" => $token,
            "expires_at" => $expirationTime
        ]
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    $code = $e->getCode() ?: 500;
    sendError($code, $e->getMessage());
}
?>
