
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

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
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getUsers($db) {
    try {
        $query = "SELECT u.*, d.name as department_name, div.name as division_name 
                  FROM users u 
                  LEFT JOIN departments d ON u.department_id = d.id 
                  LEFT JOIN divisions div ON u.division_id = div.id 
                  WHERE u.status = 'active' 
                  ORDER BY u.role, u.name";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Remove passwords from response
        foreach ($users as &$user) {
            unset($user['password']);
        }
        
        http_response_code(200);
        echo json_encode($users);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function createUser($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name) || !isset($data->nic) || !isset($data->email) || !isset($data->username) || !isset($data->password) || !isset($data->role)) {
        http_response_code(400);
        echo json_encode(array("message" => "All required fields must be provided"));
        return;
    }
    
    try {
        // Generate user_id
        $user_id = generateUserId($data->role);
        
        // Hash password
        $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (user_id, name, nic, email, username, password, role, department_id, division_id) 
                  VALUES (:user_id, :name, :nic, :email, :username, :password, :role, :department_id, :division_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nic", $data->nic);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":role", $data->role);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "User created successfully", "user_id" => $user_id));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create user"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function generateUserId($role) {
    $prefix = strtoupper(substr($role, 0, 3));
    $timestamp = time();
    $random = rand(100, 999);
    return $prefix . substr($timestamp, -4) . $random;
}

function updateUser($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(array("message" => "User ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE users SET name = :name, nic = :nic, email = :email, username = :username, role = :role, department_id = :department_id, division_id = :division_id WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nic", $data->nic);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":role", $data->role);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "User updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update user"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function deleteUser($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "User ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE users SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "User deleted successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to delete user"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
