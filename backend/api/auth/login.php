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

    // First check if we need to update the public_users table
    $checkColumnsQuery = "SELECT 
        SUM(CASE WHEN COLUMN_NAME IN ('username', 'password_hash') THEN 1 ELSE 0 END) as required_columns,
        GROUP_CONCAT(COLUMN_NAME) as existing_columns
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'public_users'";
    
    $checkStmt = $db->query($checkColumnsQuery);
    $columnInfo = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($columnInfo['required_columns'] < 2) {
        error_log("Public users table missing required columns. Found: " . $columnInfo['existing_columns']);
        
        // Add missing columns one by one to avoid errors if some already exist
        $alterQueries = [];
        if (strpos($columnInfo['existing_columns'], 'username') === false) {
            $alterQueries[] = "ADD COLUMN username VARCHAR(50) NULL";
        }
        if (strpos($columnInfo['existing_columns'], 'password_hash') === false) {
            $alterQueries[] = "ADD COLUMN password_hash VARCHAR(255) NULL";
        }
        
        if (!empty($alterQueries)) {
            try {
                $updateQuery = "ALTER TABLE public_users " . implode(", ", $alterQueries);
                $db->exec($updateQuery);
                error_log("Successfully added missing columns to public_users table");
                
                // Update any existing rows to have valid usernames based on their ID
                $db->exec("UPDATE public_users SET username = CONCAT('public_', id) WHERE username IS NULL OR username = ''");
            } catch (PDOException $e) {
                error_log("Error updating public_users schema: " . $e->getMessage());
                // Continue anyway as columns might have been added by another process
            }
        }
    }

    // First check if it's a staff/admin user
    if ($data['role'] === 'admin' || $data['role'] === 'staff') {
        $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
                  FROM users 
                  WHERE username = ? AND role = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$data['username'], $data['role']]);
    } 
    // Then check if it's a public user
    else if ($data['role'] === 'public') {
        error_log("[Login] Attempting public user login for username: " . $data['username']);
        $query = "SELECT id, public_id as user_id, name, username, COALESCE(password_hash, '') as password_hash, 'public' as role, 
                         email, department_id, division_id, status 
                  FROM public_users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$data['username']]);
        
        if ($stmt->rowCount() === 0) {
            error_log("[Login] No active public user found with username: " . $data['username']);
        }
    } else {
        throw new Exception("Invalid role specified", 400);
    }
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Invalid credentials", 401);
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // For public users, use password_hash field directly
    if ($data['role'] === 'public') {
        if (!isset($user['password_hash']) || empty(trim($user['password_hash']))) {
            error_log("[Login] Public user {$data['username']} has no password set. User data: " . json_encode($user));
            throw new Exception("Account not properly configured. Please contact staff to set up your password.", 400);
        }
        $success = password_verify($data['password'], $user['password_hash']);
        if (!$success) {
            error_log("[Login] Failed password verification for public user: {$data['username']}");
        }
    } else {
        // For admin/staff users, use password field
        if (!isset($user['password']) || empty(trim($user['password']))) {
            error_log("[Login] User {$data['username']} has no password set");
            throw new Exception("Invalid account configuration", 500);
        }
        $success = password_verify($data['password'], $user['password']);
    }
    
    if (!$success) {
        throw new Exception("Invalid credentials", 401);
    }

    // Remove sensitive data
    unset($user['password']);
    unset($user['password_hash']);

    $issuedAt = time();
    $expirationTime = $issuedAt + 3600;
    
    try {
        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'user_id' => $user['id'],
            'role' => $user['role'],
            'jti' => bin2hex(random_bytes(16)) // Add unique token ID
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
