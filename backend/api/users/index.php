<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Set error handlers
set_error_handler('handleError');
set_exception_handler('handleException');

try {
    // Verify content type for POST/PUT requests
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
        $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
        if (strpos($contentType, 'application/json') === false) {
            sendError(415, "Content-Type must be application/json");
            exit;
        }
    }

    // Verify authentication
    $authHeader = getAuthorizationHeader();
    if (!$authHeader) {
        sendError(401, "No authorization header present");
        exit;
    }

    $token = validateToken($authHeader);
    if (!$token) {
        sendError(401, "Invalid or expired token");
        exit;
    }

    // Check if user has admin privileges
    if ($token['role'] !== 'admin') {
        sendError(403, "Insufficient privileges");
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getUsers($db);
            break;
        case 'POST':
            createUser($db);
            break;
        case 'PUT':
            updateUser($db);
            break;
        case 'DELETE':
            deleteUser($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Users API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getUsers($db) {
    try {
        $query = "SELECT u.*, d.name as department_name, `div`.name as division_name 
                 FROM users u 
                 LEFT JOIN departments d ON u.department_id = d.id 
                 LEFT JOIN divisions `div` ON u.division_id = `div`.id 
                 WHERE u.status = 'active' 
                 ORDER BY u.role, u.name";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }
        
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Remove sensitive data from response
        foreach ($users as &$user) {
            unset($user['password']);
            unset($user['password_reset_token']);
            unset($user['password_reset_expires']);
        }
        
        sendResponse(200, ["data" => $users]);
    } catch (Exception $e) {
        error_log("Get users error: " . $e->getMessage());
        sendError(500, "Failed to fetch users: " . $e->getMessage());
    }
}

function createUser($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input);
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        // Validate required fields
        $requiredFields = ['name', 'nic', 'email', 'username', 'password', 'role'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty(trim($data->$field))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Validate email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            sendError(400, "Invalid email format");
            return;
        }
        
        // Validate role
        $validRoles = ['admin', 'staff', 'user'];
        if (!in_array($data->role, $validRoles)) {
            sendError(400, "Invalid role. Must be one of: " . implode(', ', $validRoles));
            return;
        }
        
        // Check for existing username or email
        $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE username = :username OR email = :email");
        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":email", $data->email);
        $stmt->execute();
        
        if ($stmt->fetchColumn() > 0) {
            sendError(409, "Username or email already exists");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Generate user_id
        $user_id = generateUserId($data->role);
        
        // Hash password
        $hashed_password = password_hash($data->password, PASSWORD_ARGON2ID);
        
        $query = "INSERT INTO users (user_id, name, nic, email, username, password, role, department_id, division_id, status) 
                  VALUES (:user_id, :name, :nic, :email, :username, :password, :role, :department_id, :division_id, 'active')";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nic", $data->nic);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":role", $data->role);
        
        // Handle optional fields
        $stmt->bindValue(":department_id", 
            (isset($data->department_id) && !empty($data->department_id)) ? $data->department_id : null, 
            PDO::PARAM_INT);
        
        $stmt->bindValue(":division_id", 
            (isset($data->division_id) && !empty($data->division_id)) ? $data->division_id : null, 
            PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create user");
        }
        
        // Commit transaction
        $db->commit();
        
        sendResponse(201, [
            "message" => "User created successfully",
            "user_id" => $user_id
        ]);
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create user error: " . $e->getMessage());
        sendError(500, "Failed to create user: " . $e->getMessage());
    }
}

function generateUserId($role) {
    $prefix = substr(strtoupper($role), 0, 3);
    $timestamp = time();
    $random = rand(1000, 9999);
    return $prefix . $timestamp . $random;
}

function updateUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "User ID is required");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Check if user exists
        $stmt = $db->prepare("SELECT id, user_id FROM users WHERE id = :id AND status = 'active'");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "User not found");
            return;
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [];
        
        if (isset($data->name) && !empty(trim($data->name))) {
            $updateFields[] = "name = :name";
            $params[':name'] = $data->name;
        }
        
        if (isset($data->email)) {
            if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                sendError(400, "Invalid email format");
                return;
            }
            $updateFields[] = "email = :email";
            $params[':email'] = $data->email;
        }
        
        if (isset($data->role)) {
            $validRoles = ['admin', 'staff', 'user'];
            if (!in_array($data->role, $validRoles)) {
                sendError(400, "Invalid role");
                return;
            }
            $updateFields[] = "role = :role";
            $params[':role'] = $data->role;
        }
        
        if (isset($data->password)) {
            $updateFields[] = "password = :password";
            $params[':password'] = password_hash($data->password, PASSWORD_ARGON2ID);
        }
        
        $updateFields[] = "department_id = :department_id";
        $params[':department_id'] = (isset($data->department_id) && !empty($data->department_id)) ? 
            $data->department_id : null;
        
        $updateFields[] = "division_id = :division_id";
        $params[':division_id'] = (isset($data->division_id) && !empty($data->division_id)) ? 
            $data->division_id : null;
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE users SET " . implode(", ", $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $params[':id'] = $data->id;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $db->commit();
        sendResponse(200, ["message" => "User updated successfully"]);
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update user error: " . $e->getMessage());
        sendError(500, "Failed to update user: " . $e->getMessage());
    }
}

function deleteUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "User ID is required");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id AND status = 'active'");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "User not found or already deleted");
            return;
        }
        
        // Soft delete
        $query = "UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        // Invalidate sessions
        $query = "UPDATE user_sessions SET is_valid = 0 WHERE user_id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        $db->commit();
        sendResponse(200, ["message" => "User deleted successfully"]);
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete user error: " . $e->getMessage());
        sendError(500, "Failed to delete user: " . $e->getMessage());
    }
}
?>
