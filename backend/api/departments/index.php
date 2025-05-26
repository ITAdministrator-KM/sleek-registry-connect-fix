
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getDepartments($db);
        break;
    case 'POST':
        createDepartment($db);
        break;
    case 'PUT':
        updateDepartment($db);
        break;
    case 'DELETE':
        deleteDepartment($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getDepartments($db) {
    try {
        $query = "SELECT d.*, 
                         (SELECT COUNT(*) FROM divisions WHERE department_id = d.id AND status = 'active') as division_count
                  FROM departments d 
                  WHERE d.status = 'active' 
                  ORDER BY d.name";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($departments);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function createDepartment($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name)) {
        http_response_code(400);
        echo json_encode(array("message" => "Department name is required"));
        return;
    }
    
    try {
        $query = "INSERT INTO departments (name, description) VALUES (:name, :description)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":description", $data->description);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Department created successfully", "id" => $db->lastInsertId()));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create department"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function updateDepartment($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id) || !isset($data->name)) {
        http_response_code(400);
        echo json_encode(array("message" => "ID and name are required"));
        return;
    }
    
    try {
        $query = "UPDATE departments SET name = :name, description = :description WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":description", $data->description);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Department updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update department"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function deleteDepartment($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "Department ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE departments SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Department deleted successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to delete department"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
