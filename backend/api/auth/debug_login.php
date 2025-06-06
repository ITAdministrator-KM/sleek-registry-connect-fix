
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'dskalmun_appDSK';
$username = 'dskalmun_Admin';
$password = 'Itadmin@1993';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed'
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit();
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username']) || !isset($input['password']) || !isset($input['role'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing required fields: username, password, role'
    ]);
    exit();
}

$loginUsername = trim($input['username']);
$loginPassword = trim($input['password']);
$loginRole = trim($input['role']);

if (empty($loginUsername) || empty($loginPassword) || empty($loginRole)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'All fields are required'
    ]);
    exit();
}

try {
    // Query user from database
    $stmt = $pdo->prepare("
        SELECT u.id, u.user_id, u.username, u.name, u.email, u.password, u.role, u.status,
               u.department_id, u.division_id,
               d.name as department_name,
               div.name as division_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN divisions div ON u.division_id = div.id
        WHERE u.username = ? AND u.status = 'active'
    ");
    
    $stmt->execute([$loginUsername]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid credentials'
        ]);
        exit();
    }

    // Verify password
    $passwordValid = false;
    
    // Check if password is hashed
    if (password_verify($loginPassword, $user['password'])) {
        $passwordValid = true;
    } else if ($user['password'] === $loginPassword) {
        // Plain text password (for testing)
        $passwordValid = true;
    }

    if (!$passwordValid) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid credentials'
        ]);
        exit();
    }

    // Verify role matches
    if ($user['role'] !== $loginRole) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid role for this user'
        ]);
        exit();
    }

    // Generate JWT token
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ]);

    $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, 'your-secret-key', true);
    $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    $token = $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;

    // Prepare user data for response
    $userData = [
        'id' => (int)$user['id'],
        'user_id' => $user['user_id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'status' => $user['status'],
        'department_id' => $user['department_id'] ? (int)$user['department_id'] : null,
        'division_id' => $user['division_id'] ? (int)$user['division_id'] : null,
        'department_name' => $user['department_name'],
        'division_name' => $user['division_name']
    ];

    // Success response
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'data' => [
            'token' => $token,
            'user' => $userData
        ]
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred during login'
    ]);
}
?>
