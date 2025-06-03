<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

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
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Divisions API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
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
            throw new Exception("Failed to prepare query");
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $divisions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, ["data" => $divisions]);
    } catch (Exception $e) {
        error_log("Get divisions error: " . $e->getMessage());
        sendError(500, "Failed to fetch divisions: " . $e->getMessage());
    }
}

function createDivision($db) {
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
        
        if (!isset($data->name) || !isset($data->department_id)) {
            sendError(400, "Division name and department are required");
            return;
        }
        
        // Check if department exists and is active
        $checkQuery = "SELECT id FROM departments WHERE id = :id AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $data->department_id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            sendError(400, "Invalid or inactive department");
            return;
        }

        // Check for duplicate division name
        $duplicateQuery = "SELECT id FROM divisions WHERE name = :name AND department_id = :dept_id AND status = 'active'";
        $dupStmt = $db->prepare($duplicateQuery);
        $dupStmt->bindParam(":name", $data->name);
        $dupStmt->bindParam(":dept_id", $data->department_id);
        $dupStmt->execute();
        
        if ($dupStmt->rowCount() > 0) {
            sendError(409, "A division with this name already exists in the selected department");
            return;
        }

        $query = "INSERT INTO divisions (name, department_id, description) VALUES (:name, :department_id, :description)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":description", $data->description ?? '');
        
        if ($stmt->execute()) {
            sendResponse(201, [
                "message" => "Division created successfully",
                "data" => [
                    "id" => $db->lastInsertId(),
                    "name" => $data->name
                ]
            ]);
        } else {
            throw new Exception("Failed to create division");
        }
    } catch (Exception $e) {
        error_log("Create division error: " . $e->getMessage());
        sendError(500, "Failed to create division: " . $e->getMessage());
    }
}

function updateDivision($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id) || !isset($data->name) || !isset($data->department_id)) {
            sendError(400, "ID, name and department are required");
            return;
        }
        
        $db->beginTransaction();

        // Check if division exists
        $checkDivQuery = "SELECT id FROM divisions WHERE id = :id AND status = 'active'";
        $checkDivStmt = $db->prepare($checkDivQuery);
        $checkDivStmt->bindParam(":id", $data->id);
        $checkDivStmt->execute();
        
        if ($checkDivStmt->rowCount() === 0) {
            sendError(404, "Division not found or is inactive");
            return;
        }

        // Check if department exists
        $checkDeptQuery = "SELECT id FROM departments WHERE id = :id AND status = 'active'";
        $checkDeptStmt = $db->prepare($checkDeptQuery);
        $checkDeptStmt->bindParam(":id", $data->department_id);
        $checkDeptStmt->execute();
        
        if ($checkDeptStmt->rowCount() === 0) {
            sendError(400, "Invalid or inactive department");
            return;
        }

        // Check for duplicate name
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
            sendError(409, "A division with this name already exists in the selected department");
            return;
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
        $stmt->bindParam(":description", $data->description ?? '');
        
        if ($stmt->execute()) {
            $db->commit();
            sendResponse(200, ["message" => "Division updated successfully"]);
        } else {
            throw new Exception("Failed to update division");
        }
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update division error: " . $e->getMessage());
        sendError(500, "Failed to update division: " . $e->getMessage());
    }
}

function deleteDivision($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError(400, "Division ID is required");
            return;
        }
        
        $db->beginTransaction();

        // Check if division exists
        $checkQuery = "SELECT d.*, dept.status as dept_status 
                    FROM divisions d 
                    INNER JOIN departments dept ON d.department_id = dept.id 
                    WHERE d.id = :id AND d.status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $id);
        $checkStmt->execute();
        $division = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$division) {
            sendError(404, "Division not found or is already inactive");
            return;
        }

        // Check for active users
        $usersQuery = "SELECT COUNT(*) as user_count FROM users WHERE division_id = :id AND status = 'active'
                      UNION ALL
                      SELECT COUNT(*) as user_count FROM public_users WHERE division_id = :id AND status = 'active'";
        $usersStmt = $db->prepare($usersQuery);
        $usersStmt->bindParam(":id", $id);
        $usersStmt->execute();
        $userCounts = $usersStmt->fetchAll(PDO::FETCH_COLUMN);
        $totalUsers = array_sum($userCounts);

        if ($totalUsers > 0) {
            sendError(409, "Cannot delete division with active users. Please reassign users first.");
            return;
        }

        // Deactivate the division
        $query = "UPDATE divisions SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            $db->commit();
            sendResponse(200, ["message" => "Division deleted successfully"]);
        } else {
            throw new Exception("Failed to delete division");
        }
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete division error: " . $e->getMessage());
        sendError(500, "Failed to delete division: " . $e->getMessage());
    }
}
?>
