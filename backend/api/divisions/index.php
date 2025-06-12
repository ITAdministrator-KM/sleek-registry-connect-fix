
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

function generateDivisionId($db) {
    try {
        // Get the last division ID
        $stmt = $db->prepare("SELECT div_id FROM divisions WHERE div_id LIKE 'DIV%' ORDER BY CAST(SUBSTRING(div_id, 4) AS UNSIGNED) DESC LIMIT 1");
        $stmt->execute();
        $lastId = $stmt->fetchColumn();
        
        if ($lastId) {
            $lastNumber = intval(substr($lastId, 3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return 'DIV' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        error_log("Error generating division ID: " . $e->getMessage());
        return 'DIV001'; // fallback
    }
}

function getDivisions($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        
        if ($departmentId) {
            $query = "SELECT d.*, dept.name as department_name 
                      FROM divisions d 
                      INNER JOIN departments dept ON d.department_id = dept.id 
                      WHERE d.status = 'active' 
                      AND dept.status = 'active'
                      AND d.department_id = ?
                      ORDER BY d.name";
            $stmt = $db->prepare($query);
            $stmt->execute([$departmentId]);
        } else {
            $query = "SELECT d.*, dept.name as department_name 
                      FROM divisions d 
                      INNER JOIN departments dept ON d.department_id = dept.id 
                      WHERE d.status = 'active' 
                      AND dept.status = 'active'
                      ORDER BY dept.name, d.name";
            $stmt = $db->prepare($query);
            $stmt->execute();
        }
        
        $divisions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensure div_id is set for all divisions
        foreach ($divisions as &$division) {
            if (empty($division['div_id'])) {
                $division['div_id'] = 'DIV' . str_pad($division['id'], 3, '0', STR_PAD_LEFT);
            }
        }
        
        sendResponse($divisions, "Divisions retrieved successfully");
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
        $checkQuery = "SELECT id FROM departments WHERE id = ? AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$data->department_id]);
        
        if ($checkStmt->rowCount() === 0) {
            sendError(400, "Invalid or inactive department");
            return;
        }

        // Check for duplicate division name
        $duplicateQuery = "SELECT id FROM divisions WHERE name = ? AND department_id = ? AND status = 'active'";
        $dupStmt = $db->prepare($duplicateQuery);
        $dupStmt->execute([trim($data->name), $data->department_id]);
        
        if ($dupStmt->rowCount() > 0) {
            sendError(409, "A division with this name already exists in the selected department");
            return;
        }

        // Generate unique division ID
        $divId = generateDivisionId($db);

        $query = "INSERT INTO divisions (div_id, name, department_id, description) VALUES (?, ?, ?, ?)";
        $stmt = $db->prepare($query);
        $description = isset($data->description) ? trim($data->description) : '';
        
        if ($stmt->execute([$divId, trim($data->name), $data->department_id, $description])) {
            sendResponse([
                "id" => $db->lastInsertId(),
                "div_id" => $divId,
                "name" => $data->name
            ], "Division created successfully");
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
        $checkDivQuery = "SELECT id FROM divisions WHERE id = ? AND status = 'active'";
        $checkDivStmt = $db->prepare($checkDivQuery);
        $checkDivStmt->execute([$data->id]);
        
        if ($checkDivStmt->rowCount() === 0) {
            $db->rollBack();
            sendError(404, "Division not found or is inactive");
            return;
        }

        // Check if department exists
        $checkDeptQuery = "SELECT id FROM departments WHERE id = ? AND status = 'active'";
        $checkDeptStmt = $db->prepare($checkDeptQuery);
        $checkDeptStmt->execute([$data->department_id]);
        
        if ($checkDeptStmt->rowCount() === 0) {
            $db->rollBack();
            sendError(400, "Invalid or inactive department");
            return;
        }

        // Check for duplicate name
        $duplicateQuery = "SELECT id FROM divisions 
                        WHERE name = ? 
                        AND department_id = ? 
                        AND id != ? 
                        AND status = 'active'";
        $dupStmt = $db->prepare($duplicateQuery);
        $dupStmt->execute([trim($data->name), $data->department_id, $data->id]);
        
        if ($dupStmt->rowCount() > 0) {
            $db->rollBack();
            sendError(409, "A division with this name already exists in the selected department");
            return;
        }

        $query = "UPDATE divisions 
                SET name = ?, 
                    department_id = ?, 
                    description = ? 
                WHERE id = ?";
        $stmt = $db->prepare($query);
        $description = isset($data->description) ? trim($data->description) : '';
        
        if ($stmt->execute([trim($data->name), $data->department_id, $description, $data->id])) {
            $db->commit();
            sendResponse([], "Division updated successfully");
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
        // Handle both query parameter and request body
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $input = file_get_contents("php://input");
            if (!empty($input)) {
                $data = json_decode($input);
                $id = $data->id ?? null;
            }
        }
        
        if (!$id) {
            sendError(400, "Division ID is required");
            return;
        }
        
        $db->beginTransaction();

        // Check if division exists
        $checkQuery = "SELECT d.*, dept.status as dept_status 
                    FROM divisions d 
                    INNER JOIN departments dept ON d.department_id = dept.id 
                    WHERE d.id = ? AND d.status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$id]);
        $division = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$division) {
            $db->rollBack();
            sendError(404, "Division not found or is already inactive");
            return;
        }

        // Check for active users
        $usersQuery = "SELECT COUNT(*) as user_count FROM users WHERE division_id = ? AND status = 'active'";
        $usersStmt = $db->prepare($usersQuery);
        $usersStmt->execute([$id]);
        $userCount = $usersStmt->fetchColumn();

        if ($userCount > 0) {
            $db->rollBack();
            sendError(409, "Cannot delete division with active users. Please reassign users first.");
            return;
        }

        // Deactivate the division
        $query = "UPDATE divisions SET status = 'inactive' WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([$id])) {
            $db->commit();
            sendResponse([], "Division deleted successfully");
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
