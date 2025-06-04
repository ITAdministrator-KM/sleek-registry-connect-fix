
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

function generateJWT($userId, $username, $role, $departmentId = null, $divisionId = null) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'username' => $username,
        'role' => $role,
        'department_id' => $departmentId,
        'division_id' => $divisionId,
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, 'your-secret-key', true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

function createUserSession($db, $userId, $token) {
    try {
        $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
        
        // First, invalidate existing sessions
        $stmt = $db->prepare("UPDATE user_sessions SET is_valid = 0 WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        // Create new session
        $stmt = $db->prepare("INSERT INTO user_sessions (user_id, token, expires_at, is_valid) VALUES (?, ?, ?, 1)");
        return $stmt->execute([$userId, $token, $expiresAt]);
    } catch (Exception $e) {
        error_log("Session creation error: " . $e->getMessage());
        return false;
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError(405, "Method not allowed");
        exit;
    }

    $input = file_get_contents("php://input");
    if (empty($input)) {
        sendError(400, "Empty request body");
        exit;
    }

    $data = json_decode($input);
    if (!$data) {
        sendError(400, "Invalid JSON data");
        exit;
    }

    if (!isset($data->username) || !isset($data->password)) {
        sendError(400, "Username and password are required");
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    $username = trim($data->username);
    $password = trim($data->password);

    // Check admin/staff users first
    $stmt = $db->prepare("SELECT id, username, password, role, name, department_id, division_id FROM users WHERE username = ? AND status = 'active'");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $token = generateJWT($user['id'], $user['username'], $user['role'], $user['department_id'], $user['division_id']);
        
        if (createUserSession($db, $user['id'], $token)) {
            sendResponse([
                "token" => $token,
                "user" => [
                    "id" => $user['id'],
                    "username" => $user['username'],
                    "role" => $user['role'],
                    "name" => $user['name'],
                    "department_id" => $user['department_id'],
                    "division_id" => $user['division_id']
                ]
            ], "Login successful");
            exit;
        }
    }

    // Check public users
    $stmt = $db->prepare("SELECT id, username, password_hash, name, department_id, division_id FROM public_users WHERE username = ? AND status = 'active'");
    $stmt->execute([$username]);
    $publicUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($publicUser && password_verify($password, $publicUser['password_hash'])) {
        $token = generateJWT($publicUser['id'], $publicUser['username'], 'public', $publicUser['department_id'], $publicUser['division_id']);
        
        if (createUserSession($db, $publicUser['id'], $token)) {
            sendResponse([
                "token" => $token,
                "user" => [
                    "id" => $publicUser['id'],
                    "username" => $publicUser['username'],
                    "role" => "public",
                    "name" => $publicUser['name'],
                    "department_id" => $publicUser['department_id'],
                    "division_id" => $publicUser['division_id']
                ]
            ], "Login successful");
            exit;
        }
    }

    sendError(401, "Invalid credentials");

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}
?>
