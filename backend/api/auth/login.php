
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST method allowed", 405);
    }

    $input = file_get_contents("php://input");
    if (empty($input)) {
        throw new Exception("Empty request body", 400);
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON: " . json_last_error_msg(), 400);
    }

    $requiredFields = ['username', 'password', 'role'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Missing required field: $field", 400);
        }
    }

    $validRoles = ['admin', 'staff', 'public'];
    if (!in_array($data['role'], $validRoles)) {
        throw new Exception("Invalid role", 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
              FROM users 
              WHERE username = ? AND role = ? AND status = 'active'";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$data['username'], $data['role']]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Invalid credentials", 401);
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!password_verify($data['password'], $user['password'])) {
        throw new Exception("Invalid credentials", 401);
    }

    unset($user['password']);

    $issuedAt = time();
    $expirationTime = $issuedAt + 3600;
    
    $payload = [
        'iat' => $issuedAt,
        'exp' => $expirationTime,
        'user_id' => $user['id'],
        'role' => $user['role']
    ];
    
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload_encoded = base64_encode(json_encode($payload));
    $secretKey = 'dsk-secret-key-2024';
    $signature = hash_hmac('sha256', "$header.$payload_encoded", $secretKey, true);
    $signature_encoded = base64_encode($signature);
    
    $token = "$header.$payload_encoded.$signature_encoded";

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
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
