<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Verify content type for POST/PUT requests
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
    if ($_SERVER["CONTENT_TYPE"] !== "application/json") {
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

function getUsers($db) {
    try {
        $query = "SELECT u.*, d.name as department_name, `div`.name as division_name 
                 FROM users u 
                 LEFT JOIN departments d ON u.department_id = d.id 
                 LEFT JOIN divisions `div` ON u.division_id = `div`.id 
                 WHERE u.status = 'active' 
                 ORDER BY u.role, u.name";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Remove sensitive data from response
        foreach ($users as &$user) {
            unset($user['password']);
            unset($user['password_reset_token']);
            unset($user['password_reset_expires']);
        }
        
        sendResponse(200, ["data" => $users]);
    } catch (PDOException $e) {
        sendError(500, "Database error", $e);
    } catch (Exception $e) {
        sendError(500, "Internal server error", $e);
    }
}

function createUser($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
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
        
        // Hash password with strong algorithm
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
        
        $stmt->execute();
        
        // Commit transaction
        $db->commit();
        
        sendResponse(201, [
            "message" => "User created successfully",
            "user_id" => $user_id
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendError(500, "Database error", $e);
    } catch (Exception $e) {
        $db->rollBack();
        sendError(500, "Internal server error", $e);
    }
}

// Helper function to generate a unique user ID based on role
function generateUserId($role) {
    $prefix = substr(strtoupper($role), 0, 3);
    $timestamp = time();
    $random = rand(1000, 9999);
    return $prefix . $timestamp . $random;
}

function updateUser($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id)) {
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
        
        // Build update query dynamically based on provided fields
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
            
            // Check if email is already used by another user
            $stmt = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
            $stmt->bindParam(":email", $data->email);
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                sendError(409, "Email already in use");
                return;
            }
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
            if (strlen($data->password) < 8) {
                sendError(400, "Password must be at least 8 characters long");
                return;
            }
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
        
        // Commit transaction
        $db->commit();
        
        sendResponse(200, ["message" => "User updated successfully"]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendError(500, "Database error", $e);
    } catch (Exception $e) {
        $db->rollBack();
        sendError(500, "Internal server error", $e);
    }
}

function deleteUser($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id)) {
            sendError(400, "User ID is required");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Check if user exists and is not already deleted
        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id AND status = 'active'");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "User not found or already deleted");
            return;
        }
        
        // Soft delete by updating status
        $query = "UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        // Also invalidate any active sessions
        $query = "UPDATE user_sessions SET is_valid = 0 WHERE user_id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        // Commit transaction
        $db->commit();
        
        sendResponse(200, ["message" => "User deleted successfully"]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendError(500, "Database error", $e);
    } catch (Exception $e) {
        $db->rollBack();
        sendError(500, "Internal server error", $e);
    }
}
?>
