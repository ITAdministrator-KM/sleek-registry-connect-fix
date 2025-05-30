
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

    $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
              FROM users 
              WHERE username = ? AND role = ? AND status = 'active'";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->execute([$data['username'], $data['role']]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Invalid credentials", 401);
        }
    } catch (PDOException $e) {
        error_log("Database error during login: " . $e->getMessage());
        throw new Exception("Database error occurred", 500);
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!password_verify($data['password'], $user['password'])) {
        throw new Exception("Invalid credentials", 401);
    }

    unset($user['password']);

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
