<?php
// Enable detailed error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

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
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError(405, "Method not allowed");
        exit;
    }

    // Log raw input for debugging
    $input = file_get_contents("php://input");
    error_log("Raw input: " . $input);
    
    $data = json_decode($input);

    if (!$data) {
        error_log("Failed to decode JSON input");
        sendError(400, "Invalid JSON input");
        exit;
    }

    error_log("Decoded data: " . print_r($data, true));

    if (!isset($data->username) || !isset($data->password)) {
        error_log("Missing username or password in request");
        sendError(400, "Username and password are required");
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
                WHERE username = ?";
        
        error_log("Checking users table with query: " . $query . " and username: " . $username);
        
        $stmt = $db->prepare($query);
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            error_log("User found in users table: " . print_r($user, true));
            
            // Log the password verification attempt
            $passwordMatch = password_verify($password, $user['password']);
            error_log("Password verification result: " . ($passwordMatch ? "MATCH" : "NO MATCH"));
            error_log("Provided password: '$password'");
            error_log("Stored hash: " . $user['password']);
            
            if ($passwordMatch) {
                if ($user['status'] !== 'active') {
                    error_log("User account is not active. Status: " . $user['status']);
                    sendError(401, "Account is not active. Please contact administrator.");
                    exit;
                }
                
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
                
                sendResponse([
                    'success' => true,
                    'message' => 'Login successful',
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
                ]);
                exit;
            } else {
                error_log("Password verification failed for user: " . $user['username']);
            }
        } else {
            error_log("No user found with username: " . $username);
        }
    }

    // If we got here, login failed
    error_log("Login failed - Invalid credentials for username: " . $username);
    sendError(401, "Invalid credentials");
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    sendError(500, "An error occurred during login. Please try again later.");
}
