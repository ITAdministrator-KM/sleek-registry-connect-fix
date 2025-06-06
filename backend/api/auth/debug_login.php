
<?php
// Enable detailed error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Start output buffering to prevent any unexpected output
ob_start();

try {
    include_once '../../config/cors.php';
    include_once '../../config/database.php';
    include_once '../../config/error_handler.php';
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Configuration error: ' . $e->getMessage()
    ]);
    exit;
}

header('Content-Type: application/json');

// Simple JWT generation function
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    $secret = 'dsk_secret_key_2024'; // Use a secure secret in production
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        ob_clean();
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed'
        ]);
        exit;
    }

    // Get and validate input
    $input = file_get_contents("php://input");
    error_log("Raw input: " . $input);
    
    $data = json_decode($input);

    if (!$data) {
        error_log("Failed to decode JSON input");
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid JSON input'
        ]);
        exit;
    }

    if (!isset($data->username) || !isset($data->password)) {
        error_log("Missing username or password in request");
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Username and password are required'
        ]);
        exit;
    }

    $username = trim($data->username);
    $password = $data->password;
    $role = isset($data->role) ? strtolower(trim($data->role)) : null;

    error_log("Login attempt - Username: '$username', Role: '$role'");

    // First try admin/staff users table
    if (!$role || $role === 'admin' || $role === 'staff') {
        $query = "SELECT id, user_id, username, password, role, name, email, status, department_id 
                FROM users 
                WHERE username = ? AND status = 'active'";
        
        error_log("Checking users table with query: " . $query);
        
        $stmt = $db->prepare($query);
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            error_log("User found in users table: " . print_r($user, true));
            
            // Verify password
            $passwordMatch = password_verify($password, $user['password']);
            error_log("Password verification result: " . ($passwordMatch ? "MATCH" : "NO MATCH"));
            
            if ($passwordMatch) {
                // Get department info if exists
                $departmentName = null;
                if ($user['department_id']) {
                    $deptQuery = "SELECT name FROM departments WHERE id = ?";
                    $deptStmt = $db->prepare($deptQuery);
                    $deptStmt->execute([$user['department_id']]);
                    $dept = $deptStmt->fetch(PDO::FETCH_ASSOC);
                    $departmentName = $dept ? $dept['name'] : null;
                }
                
                $token = generateJWT([
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role'],
                    'exp' => time() + (24 * 60 * 60) // 24 hours
                ]);
                
                // Insert session record
                try {
                    $sessionQuery = "INSERT INTO user_sessions (user_id, token, expires_at, is_valid) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), 1)";
                    $sessionStmt = $db->prepare($sessionQuery);
                    $sessionStmt->execute([$user['id'], $token]);
                } catch (Exception $e) {
                    error_log("Session creation failed: " . $e->getMessage());
                }
                
                error_log("Login successful for user: " . $user['username'] . ", role: " . $user['role']);
                
                ob_clean();
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Login successful',
                    'data' => [
                        'token' => $token,
                        'user' => [
                            'id' => $user['id'],
                            'user_id' => $user['user_id'],
                            'username' => $user['username'],
                            'role' => $user['role'],
                            'name' => $user['name'],
                            'email' => $user['email'],
                            'department_id' => $user['department_id'],
                            'department_name' => $departmentName,
                            'status' => $user['status']
                        ]
                    ]
                ]);
                exit;
            }
        }
    }

    // Try public users table if not found in admin/staff or role is public
    if (!$role || $role === 'public') {
        $query = "SELECT id, public_user_id as user_id, username, password_hash as password, name, email, status 
                  FROM public_users 
                  WHERE username = ? AND status = 'active'";
        
        error_log("Checking public_users table");
        
        $stmt = $db->prepare($query);
        $stmt->execute([$username]);
        $publicUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($publicUser) {
            error_log("User found in public_users table: " . print_r($publicUser, true));
            
            $passwordMatch = password_verify($password, $publicUser['password']);
            error_log("Password verification result for public user: " . ($passwordMatch ? "MATCH" : "NO MATCH"));
            
            if ($passwordMatch) {
                $token = generateJWT([
                    'user_id' => $publicUser['id'],
                    'username' => $publicUser['username'],
                    'role' => 'public',
                    'exp' => time() + (24 * 60 * 60) // 24 hours
                ]);
                
                // Insert session record
                try {
                    $sessionQuery = "INSERT INTO user_sessions (user_id, token, expires_at, is_valid) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), 1)";
                    $sessionStmt = $db->prepare($sessionQuery);
                    $sessionStmt->execute([$publicUser['id'], $token]);
                } catch (Exception $e) {
                    error_log("Session creation failed: " . $e->getMessage());
                }
                
                error_log("Login successful for public user: " . $publicUser['username']);
                
                ob_clean();
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Login successful',
                    'data' => [
                        'token' => $token,
                        'user' => [
                            'id' => $publicUser['id'],
                            'user_id' => $publicUser['user_id'],
                            'username' => $publicUser['username'],
                            'role' => 'public',
                            'name' => $publicUser['name'],
                            'email' => $publicUser['email'],
                            'status' => $publicUser['status']
                        ]
                    ]
                ]);
                exit;
            }
        }
    }

    // If we got here, login failed
    error_log("Login failed - Invalid credentials for username: " . $username);
    ob_clean();
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid credentials. Please check your username and password.'
    ]);
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred during login. Please try again later.',
        'debug' => $e->getMessage()
    ]);
}
?>
