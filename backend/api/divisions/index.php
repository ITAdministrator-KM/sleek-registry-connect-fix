
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
                  INNER JOIN departments dept ON d.department_id = dept.id 
                  WHERE d.status = 'active' 
                  AND dept.status = 'active'
                  ORDER BY dept.name, d.name";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query", 500);
        }
        
        $divisions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($divisions === false) {
            $divisions = [];
        }
        
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
        // Check if department exists and is active
        $checkQuery = "SELECT id FROM departments WHERE id = :id AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $data->department_id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            throw new Exception("Invalid or inactive department", 400);
        }

        // Check for duplicate division name in the same department
        $duplicateQuery = "SELECT id FROM divisions WHERE name = :name AND department_id = :dept_id AND status = 'active'";
        $dupStmt = $db->prepare($duplicateQuery);
        $dupStmt->bindParam(":name", $data->name);
        $dupStmt->bindParam(":dept_id", $data->department_id);
        $dupStmt->execute();
        
        if ($dupStmt->rowCount() > 0) {
            throw new Exception("A division with this name already exists in the selected department", 409);
        }

        $query = "INSERT INTO divisions (name, department_id, description) VALUES (:name, :department_id, :description)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":description", $data->description);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "status" => "success",
                "message" => "Division created successfully",
                "data" => array(
                    "id" => $db->lastInsertId(),
                    "name" => $data->name
                )
            ));
        } else {
            throw new Exception("Failed to create division", 400);
        }
    } catch (Exception $e) {
        http_response_code($e->getCode() ?: 500);
        echo json_encode(array(
            "status" => "error",
            "message" => $e->getMessage()
        ));
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
        $db->beginTransaction();

        // Check if division exists and is active
        $checkDivQuery = "SELECT id FROM divisions WHERE id = :id AND status = 'active'";
        $checkDivStmt = $db->prepare($checkDivQuery);
        $checkDivStmt->bindParam(":id", $data->id);
        $checkDivStmt->execute();
        
        if ($checkDivStmt->rowCount() === 0) {
            throw new Exception("Division not found or is inactive", 404);
        }

        // Check if department exists and is active
        $checkDeptQuery = "SELECT id FROM departments WHERE id = :id AND status = 'active'";
        $checkDeptStmt = $db->prepare($checkDeptQuery);
        $checkDeptStmt->bindParam(":id", $data->department_id);
        $checkDeptStmt->execute();
        
        if ($checkDeptStmt->rowCount() === 0) {
            throw new Exception("Invalid or inactive department", 400);
        }

        // Check if there are any active users in the division before allowing department change
        $usersQuery = "SELECT COUNT(*) as user_count FROM public_users WHERE division_id = :div_id AND status = 'active'";
        $usersStmt = $db->prepare($usersQuery);
        $usersStmt->bindParam(":div_id", $data->id);
        $usersStmt->execute();
        $userResult = $usersStmt->fetch(PDO::FETCH_ASSOC);

        if ($userResult['user_count'] > 0) {
            // Only check if department is being changed
            $currentDeptQuery = "SELECT department_id FROM divisions WHERE id = :id";
            $currentDeptStmt = $db->prepare($currentDeptQuery);
            $currentDeptStmt->bindParam(":id", $data->id);
            $currentDeptStmt->execute();
            $currentDept = $currentDeptStmt->fetch(PDO::FETCH_ASSOC);

            if ($currentDept['department_id'] != $data->department_id) {
                throw new Exception("Cannot change department of division with active users. Please reassign users first.", 409);
            }
        }

        // Check for duplicate name in the target department (excluding current division)
        $duplicateQuery = "SELECT id FROM divisions 
                        WHERE name = :name 
                        AND department_id = :dept_id 
                        AND id != :id 
                        AND status = 'active'";
        $dupStmt = $db->prepare($duplicateQuery);
        $dupStmt->bindParam(":name", $data->name);
        $dupStmt->bindParam(":dept_id", $data->department_id);
        $dupStmt->bindParam(":id", $data->id);
        $dupStmt->execute();
        
        if ($dupStmt->rowCount() > 0) {
            throw new Exception("A division with this name already exists in the selected department", 409);
        }

        $query = "UPDATE divisions 
                SET name = :name, 
                    department_id = :department_id, 
                    description = :description 
                WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":description", $data->description);
        
        if ($stmt->execute()) {
            $db->commit();
            http_response_code(200);
            echo json_encode(array(
                "status" => "success",
                "message" => "Division updated successfully"
            ));
        } else {
            throw new Exception("Failed to update division", 400);
        }
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code($e->getCode() ?: 500);
        echo json_encode(array(
            "status" => "error",
            "message" => $e->getMessage()
        ));
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
        $db->beginTransaction();

        // Check if division exists and is active
        $checkQuery = "SELECT d.*, dept.status as dept_status 
                    FROM divisions d 
                    INNER JOIN departments dept ON d.department_id = dept.id 
                    WHERE d.id = :id AND d.status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $id);
        $checkStmt->execute();
        $division = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$division) {
            throw new Exception("Division not found or is already inactive", 404);
        }

        if ($division['dept_status'] !== 'active') {
            throw new Exception("Cannot modify division: parent department is inactive", 400);
        }

        // Check for active users
        $usersQuery = "SELECT COUNT(*) as user_count FROM public_users WHERE division_id = :id AND status = 'active'";
        $usersStmt = $db->prepare($usersQuery);
        $usersStmt->bindParam(":id", $id);
        $usersStmt->execute();
        $userResult = $usersStmt->fetch(PDO::FETCH_ASSOC);

        if ($userResult['user_count'] > 0) {
            throw new Exception("Cannot delete division with active users. Please reassign users first.", 409);
        }

        // Deactivate the division
        $query = "UPDATE divisions SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            $db->commit();
            http_response_code(200);
            echo json_encode(array(
                "status" => "success",
                "message" => "Division deleted successfully"
            ));
        } else {
            throw new Exception("Failed to delete division", 500);
        }
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code($e->getCode() ?: 500);
        echo json_encode(array(
            "status" => "error",
            "message" => $e->getMessage()
        ));
    }
}
?>
