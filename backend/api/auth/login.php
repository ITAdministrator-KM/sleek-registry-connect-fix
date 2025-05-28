
<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set headers first
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
include_once '../../config/database.php';

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            "status" => "error",
            "message" => "Method not allowed"
        ]);
        exit;
    }

    // Get and validate input
    $input = file_get_contents("php://input");
    error_log("Raw input: " . $input);
    
    if (empty($input)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Empty request body"
        ]);
        exit;
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid JSON: " . json_last_error_msg()
        ]);
        exit;
    }

    // Validate required fields
    $requiredFields = ['username', 'password', 'role'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Missing required field: $field"
            ]);
            exit;
        }
    }

    // Validate role
    $validRoles = ['admin', 'staff', 'public'];
    if (!in_array($data['role'], $validRoles)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid role. Must be one of: " . implode(', ', $validRoles)
        ]);
        exit;
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    error_log("Database connected successfully");

    // Query user
    $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
              FROM users 
              WHERE username = ? AND role = ? AND status = 'active'";
    
    $stmt = $db->prepare($query);
    if (!$stmt) {
        throw new Exception("Failed to prepare query: " . implode(': ', $db->errorInfo()));
    }

    $stmt->execute([$data['username'], $data['role']]);
    error_log("Query executed for username: " . $data['username'] . ", role: " . $data['role']);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid credentials or user not found"
        ]);
        exit;
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("Failed to fetch user data");
    }

    error_log("User found: " . $user['username']);

    // Verify password
    if (!password_verify($data['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid credentials"
        ]);
        exit;
    }

    // Remove sensitive data
    unset($user['password']);

    // Generate simple token
    $issuedAt = time();
    $expirationTime = $issuedAt + 3600; // Valid for 1 hour
    
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

    error_log("Login successful for user: " . $user['username']);

    // Send success response
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

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error",
        "details" => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
