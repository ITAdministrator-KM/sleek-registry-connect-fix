
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

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
            throw new Exception("Method not allowed", 405);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error",
        "details" => $e->getMessage()
    ]);
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

function generateDepartmentId($db) {
    // Get the last department ID
    $stmt = $db->prepare("SELECT dept_id FROM departments WHERE dept_id LIKE 'DEP%' ORDER BY CAST(SUBSTRING(dept_id, 4) AS UNSIGNED) DESC LIMIT 1");
    $stmt->execute();
    $lastId = $stmt->fetchColumn();
    
    if ($lastId) {
        $lastNumber = intval(substr($lastId, 3));
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return 'DEP' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
}

function getDepartments($db) {
    try {
        $query = "SELECT d.*, COUNT(dv.id) as division_count 
                  FROM departments d 
                  LEFT JOIN divisions dv ON d.id = dv.department_id AND dv.status = 'active'
                  WHERE d.status = 'active' 
                  GROUP BY d.id 
                  ORDER BY d.name";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query", 500);
        }
        
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($departments === false) {
            throw new Exception("Failed to fetch departments", 500);
        }
        
        foreach ($departments as &$dept) {
            $dept['division_count'] = intval($dept['division_count']);
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Departments retrieved successfully",
            "data" => $departments
        ]);
    } catch (Exception $e) {
        throw $e;
    }
}

function createDepartment($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload: " . json_last_error_msg(), 400);
        }
        
        if (!isset($data->name) || empty(trim($data->name))) {
            throw new Exception("Department name is required", 400);
        }
        
        // Check for duplicate name
        $checkQuery = "SELECT id FROM departments WHERE name = :name AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":name", $data->name);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            throw new Exception("Department with this name already exists", 409);
        }

        // Generate unique department ID
        $deptId = generateDepartmentId($db);

        $query = "INSERT INTO departments (dept_id, name, description) VALUES (:dept_id, :name, :description)";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        $name = $data->name;
        $description = isset($data->description) ? $data->description : null;
        
        $stmt->bindParam(":dept_id", $deptId);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description, PDO::PARAM_STR);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create department", 500);
        }

        $id = $db->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Department created successfully",
            "data" => [
                "id" => $id,
                "dept_id" => $deptId,
                "name" => $data->name
            ]
        ]);
    } catch (Exception $e) {
        throw $e;
    }
}

function updateDepartment($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload: " . json_last_error_msg(), 400);
        }
        
        if (!isset($data->id) || !isset($data->name)) {
            throw new Exception("Department ID and name are required", 400);
        }
        
        // Check department exists
        $checkQuery = "SELECT id FROM departments WHERE id = :id AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $data->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            throw new Exception("Department not found", 404);
        }

        // Check for duplicate name
        $checkQuery = "SELECT id FROM departments WHERE name = :name AND id != :id AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":name", $data->name);
        $checkStmt->bindParam(":id", $data->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            throw new Exception("Another department with this name already exists", 409);
        }

        $query = "UPDATE departments SET name = :name, description = :description WHERE id = :id";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        $stmt->bindValue(":id", $data->id);
        $stmt->bindValue(":name", $data->name);
        $stmt->bindValue(":description", $data->description ?? null, PDO::PARAM_STR);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update department", 500);
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Department updated successfully"
        ]);
    } catch (Exception $e) {
        throw $e;
    }
}

function deleteDepartment($db) {
    try {
        // Handle both query parameter and request body
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $data = json_decode(file_get_contents("php://input"));
            $id = $data->id ?? null;
        }
        
        if (!$id) {
            throw new Exception("Department ID is required", 400);
        }

        // Start transaction
        $db->beginTransaction();
        
        // Check if department exists and get active divisions count
        $checkQuery = "SELECT d.id, COUNT(dv.id) as divisions_count, 
                             (SELECT COUNT(*) FROM public_users pu WHERE pu.department_id = d.id AND pu.status = 'active') as users_count 
                      FROM departments d 
                      LEFT JOIN divisions dv ON d.id = dv.department_id AND dv.status = 'active'
                      WHERE d.id = :id AND d.status = 'active'
                      GROUP BY d.id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $id);
        $checkStmt->execute();
        
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            $db->rollBack();
            throw new Exception("Department not found", 404);
        }
        
        // Check for active users or divisions
        if ($result['users_count'] > 0) {
            $db->rollBack();
            throw new Exception("Cannot delete department with active users. Please reassign users first.", 409);
        }

        // If there are active divisions, deactivate them first
        if ($result['divisions_count'] > 0) {
            // First check for active users in divisions
            $checkUsersQuery = "SELECT COUNT(*) as user_count 
                              FROM public_users pu 
                              INNER JOIN divisions d ON pu.division_id = d.id 
                              WHERE d.department_id = :dept_id 
                              AND pu.status = 'active'";
            $checkUsersStmt = $db->prepare($checkUsersQuery);
            $checkUsersStmt->bindParam(":dept_id", $id);
            $checkUsersStmt->execute();
            $userResult = $checkUsersStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($userResult['user_count'] > 0) {
                $db->rollBack();
                throw new Exception("Cannot delete department. Please reassign users from its divisions first.", 409);
            }
            
            // Deactivate all divisions in this department
            $deactivateDivsQuery = "UPDATE divisions SET status = 'inactive' WHERE department_id = :dept_id AND status = 'active'";
            $deactivateDivsStmt = $db->prepare($deactivateDivsQuery);
            $deactivateDivsStmt->bindParam(":dept_id", $id);
            if (!$deactivateDivsStmt->execute()) {
                $db->rollBack();
                throw new Exception("Failed to deactivate divisions", 500);
            }
        }
        
        // Finally, deactivate the department
        $query = "UPDATE departments SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare query", 500);
        }

        $stmt->bindParam(":id", $id);
        
        if (!$stmt->execute()) {
            $db->rollBack();
            throw new Exception("Failed to delete department", 500);
        }
        
        // Commit all changes
        $db->commit();
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Department and associated divisions deactivated successfully"
        ]);
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
}

function updateDepartment($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload: " . json_last_error_msg(), 400);
        }
        
        if (!isset($data->id) || !isset($data->name)) {
            throw new Exception("Department ID and name are required", 400);
        }
        
        // Check department exists
        $checkQuery = "SELECT id FROM departments WHERE id = :id AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $data->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            throw new Exception("Department not found", 404);
        }

        // Check for duplicate name
        $checkQuery = "SELECT id FROM departments WHERE name = :name AND id != :id AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":name", $data->name);
        $checkStmt->bindParam(":id", $data->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            throw new Exception("Another department with this name already exists", 409);
        }

        $query = "UPDATE departments SET name = :name, description = :description WHERE id = :id";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        $stmt->bindValue(":id", $data->id);
        $stmt->bindValue(":name", $data->name);
        $stmt->bindValue(":description", $data->description ?? null, PDO::PARAM_STR);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update department", 500);
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Department updated successfully"
        ]);
    } catch (Exception $e) {
        throw $e;
    }
}
?>
