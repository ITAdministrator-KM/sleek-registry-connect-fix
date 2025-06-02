
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

// Set error handlers
set_error_handler('handleError');
set_exception_handler('handleException');

// Ensure proper content type
header('Content-Type: application/json; charset=UTF-8');

function base64url_encode($data) { 
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); 
}

function sendResponse($status, $data = null, $message = null) {
    http_response_code($status);
    echo json_encode([
        'status' => $status >= 200 && $status < 300 ? 'success' : 'error',
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(405, null, "Only POST method allowed");
    }

    $input = file_get_contents("php://input");
    if (empty($input)) {
        sendResponse(400, null, "Empty request body");
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(400, null, "Invalid JSON: " . json_last_error_msg());
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

    error_log("[Login] Attempting login for username: " . $data['username'] . " with role: " . $data['role']);

    // Check for admin/staff users in the users table
    if ($data['role'] === 'admin' || $data['role'] === 'staff') {
        $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
                  FROM users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$data['username']]);
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $passwordField = 'password';
            
            // Check if the role matches what was requested
            if ($user['role'] !== $data['role']) {
                error_log("[Login] Role mismatch for user {$data['username']}. Found: {$user['role']}, Expected: {$data['role']}");
                throw new Exception("Invalid credentials", 401);
            }
            
            error_log("[Login] Found {$user['role']} user: " . $data['username']);
        } else {
            error_log("[Login] No active user found with username: " . $data['username']);
            
            // If admin login fails, let's check if there's an admin user with different username
            if ($data['role'] === 'admin') {
                $adminQuery = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
                              FROM users 
                              WHERE role = 'admin' AND status = 'active'";
                $adminStmt = $db->prepare($adminQuery);
                $adminStmt->execute();
                $adminUsers = $adminStmt->fetchAll(PDO::FETCH_ASSOC);
                
                error_log("[Login] Found " . count($adminUsers) . " admin users in database");
                foreach ($adminUsers as $adminUser) {
                    error_log("[Login] Admin user found: " . $adminUser['username']);
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
        error_log("[Login] User {$data['username']} has no password set. Creating default password.");
        
        // For development/demo purposes, create a default password if none exists
        $defaultPassword = password_hash($data['password'], PASSWORD_ARGON2ID);
        
        if ($user['role'] === 'public') {
            $updateQuery = "UPDATE public_users SET password_hash = ? WHERE id = ?";
        } else {
            $updateQuery = "UPDATE users SET password = ? WHERE id = ?";
        }
        
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([$defaultPassword, $user['id']]);
        
        $storedPassword = $defaultPassword;
        error_log("[Login] Default password created for user: " . $data['username']);
    }
    
    $success = password_verify($data['password'], $storedPassword);
    
    if (!$success) {
        error_log("[Login] Failed password verification for user: {$data['username']}");
        error_log("[Login] Stored password exists: " . (!empty($storedPassword) ? 'Yes' : 'No'));
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
    sendResponse($code, null, $e->getMessage());
}
?>
