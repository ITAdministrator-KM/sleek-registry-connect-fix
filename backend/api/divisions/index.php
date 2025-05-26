
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getDivisions($db);
        break;
    case 'POST':
        createDivision($db);
        break;
    case 'PUT':
        updateDivision($db);
        break;
    case 'DELETE':
        deleteDivision($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getDivisions($db) {
    try {
        $query = "SELECT d.*, dept.name as department_name 
                  FROM divisions d 
                  LEFT JOIN departments dept ON d.department_id = dept.id 
                  WHERE d.status = 'active' 
                  ORDER BY dept.name, d.name";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $divisions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($divisions);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function createDivision($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name) || !isset($data->department_id)) {
        http_response_code(400);
        echo json_encode(array("message" => "Division name and department are required"));
        return;
    }
    
    try {
        $query = "INSERT INTO divisions (name, department_id, description) VALUES (:name, :department_id, :description)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":description", $data->description);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Division created successfully", "id" => $db->lastInsertId()));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create division"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function updateDivision($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id) || !isset($data->name) || !isset($data->department_id)) {
        http_response_code(400);
        echo json_encode(array("message" => "ID, name and department are required"));
        return;
    }
    
    try {
        $query = "UPDATE divisions SET name = :name, department_id = :department_id, description = :description WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":description", $data->description);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Division updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update division"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function deleteDivision($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "Division ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE divisions SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Division deleted successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to delete division"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
