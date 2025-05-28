<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Ensure clean output buffer
if (ob_get_level()) ob_end_clean();

try {
    // Log incoming request with headers
    error_log("Login attempt - Headers: " . json_encode(getallheaders()));
    error_log("Login attempt - Input: " . file_get_contents("php://input"));
    
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Method not allowed", 405);
    }

    // Check content type with detailed logging
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    error_log("Content-Type received: " . $contentType);
    
    // More lenient content type check
    $validContentTypes = ['application/json', 'application/json;charset=UTF-8'];
    $isValidContentType = false;
    foreach ($validContentTypes as $type) {
        if (stripos($contentType, $type) !== false) {
            $isValidContentType = true;
            break;
        }
    }
    
    if (!$isValidContentType) {
        throw new Exception("Invalid Content-Type. Expected application/json, got: " . $contentType, 400);
    }

    // Parse and validate input with enhanced logging
    $input = file_get_contents("php://input");
    if (empty($input)) {
        error_log("Login attempt failed: Empty request body");
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Empty request body"
        ]);
        exit;
    }

    $data = json_decode($input);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Login attempt failed: Invalid JSON - " . json_last_error_msg() . ". Input: " . substr($input, 0, 100));
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid JSON payload: " . json_last_error_msg()
        ]);
        exit;
    }

    // Log decoded data without sensitive information
    $logData = (array)$data;
    unset($logData['password']);
    error_log("Decoded input data: " . json_encode($logData));

    // Validate required fields with detailed logging
    $requiredFields = ['username', 'password', 'role'];
    $missingFields = array_filter($requiredFields, function($field) use ($data) {
        return !isset($data->$field) || (is_string($data->$field) && trim($data->$field) === '');
    });
    
    if (!empty($missingFields)) {
        $errorMsg = "Missing required fields: " . implode(', ', $missingFields);
        error_log("Login attempt failed: " . $errorMsg);
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => $errorMsg,
            "details" => "Required fields are: " . implode(', ', $requiredFields)
        ]);
        exit;
    }

    // Validate role
    $validRoles = ['admin', 'staff', 'public'];
    if (!in_array($data->role, $validRoles)) {
        throw new Exception("Invalid role. Must be one of: " . implode(', ', $validRoles), 400);
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    // Check if rate limiting is enabled (table exists)
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    $rateLimitingEnabled = false;
    
    try {
        $stmt = $db->query("SELECT 1 FROM login_attempts LIMIT 1");
        $rateLimitingEnabled = true;
    } catch (PDOException $e) {
        // Table doesn't exist - rate limiting disabled
        error_log("Rate limiting disabled - login_attempts table not found");
    }

    if ($rateLimitingEnabled) {
        $stmt = $db->prepare("SELECT COUNT(*) as attempts FROM login_attempts WHERE ip_address = ? AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
        $stmt->execute([$ipAddress]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['attempts'] > 5) {
            throw new Exception("Too many login attempts. Please try again later.", 429);
        }
    }

    // Query user
    $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
              FROM users 
              WHERE username = :username AND role = :role AND status = 'active'";
    
    $stmt = $db->prepare($query);
    if (!$stmt) {
        throw new Exception("Failed to prepare query", 500);
    }

    $stmt->bindParam(":username", $data->username);
    $stmt->bindParam(":role", $data->role);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query", 500);
    }
    if ($stmt->rowCount() === 0) {
        if ($rateLimitingEnabled) {
            try {
                $stmt = $db->prepare("INSERT INTO login_attempts (username, ip_address) VALUES (?, ?)");
                $stmt->execute([$data->username, $ipAddress]);
            } catch (PDOException $e) {
                error_log("Failed to log login attempt: " . $e->getMessage());
            }
        }
        
        throw new Exception("User not found or invalid role", 401);
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("Failed to fetch user data", 500);
    }

    if (!password_verify($data->password, $user['password'])) {
        if ($rateLimitingEnabled) {
            try {
                $stmt = $db->prepare("INSERT INTO login_attempts (username, ip_address) VALUES (?, ?)");
                $stmt->execute([$data->username, $ipAddress]);
            } catch (PDOException $e) {
                error_log("Failed to log login attempt: " . $e->getMessage());
            }
        }
        
        throw new Exception("Invalid credentials", 401);
    }

    // Clear login attempts on successful login
    if ($rateLimitingEnabled) {
        try {
            $stmt = $db->prepare("DELETE FROM login_attempts WHERE username = ? OR ip_address = ?");
            $stmt->execute([$data->username, $ipAddress]);
        } catch (PDOException $e) {
            error_log("Failed to clear login attempts: " . $e->getMessage());
        }
    }

    // Remove sensitive data
    unset($user['password']);

    // Modify JWT token generation
    $issuedAt = time();
    $expirationTime = $issuedAt + 3600; // Valid for 1 hour
    
    $payload = [
        'iat' => $issuedAt,
        'exp' => $expirationTime,
        'user_id' => $user['id'],
        'role' => $user['role']
    ];
    
    // Use proper JWT encoding
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode($payload));
    $secretKey = getenv('JWT_SECRET') ?: 'your-256-bit-secret';
    $signature = hash_hmac('sha256', "$header.$payload", $secretKey, true);
    $signature = base64_encode($signature);
    
    $token = "$header.$payload.$signature";

    // Log successful login if history table exists
    try {
        $stmt = $db->query("SELECT 1 FROM login_history LIMIT 1");
        // Table exists, log the login
        try {
            $stmt = $db->prepare("INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)");
            $stmt->execute([$user['id'], $ipAddress, $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown']);
        } catch (PDOException $e) {
            error_log("Failed to log login history: " . $e->getMessage());
        }
    } catch (PDOException $e) {
        // Table doesn't exist - logging disabled
        error_log("Login history disabled - login_history table not found");
    }

    // Make sure we're sending a clean response
    http_response_code(200);
    header('Content-Type: application/json; charset=UTF-8');
    
    // Send response
    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "data" => [
            "user" => $user,
            "token" => $token,
            "expires_at" => $expirationTime
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    error_log("Database error in login.php: " . $e->getMessage());
    error_log("PDO Error Code: " . $e->getCode() . ", SQL State: " . $e->errorInfo[0] ?? 'unknown');
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection error",
        "error_code" => $e->getCode(),
        "details" => DEBUG_MODE ? $e->getMessage() : "A database error occurred"
    ]);
    exit;
} catch (Exception $e) {
    error_log("Error in login.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
        "error_code" => $code,
        "details" => DEBUG_MODE ? $e->getTraceAsString() : null
    ]);
    exit;
}
?>
