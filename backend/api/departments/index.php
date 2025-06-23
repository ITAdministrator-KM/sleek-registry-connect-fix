
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../config/jwt_middleware.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    // Require authentication for all endpoints except OPTIONS
    if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        $auth = requireAuth(); // This will exit if not authenticated
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
    error_log("Database error in departments API: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error",
        "details" => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General error in departments API: " . $e->getMessage());
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

function generateDepartmentId($db) {
    try {
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
    } catch (Exception $e) {
        error_log("Error generating department ID: " . $e->getMessage());
        return 'DEP001'; // fallback
    }
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
            $departments = [];
        }
        
        // Ensure division_count is integer
        foreach ($departments as &$dept) {
            $dept['division_count'] = intval($dept['division_count'] ?? 0);
            // Ensure dept_id is set
            if (empty($dept['dept_id'])) {
                $dept['dept_id'] = 'DEP' . str_pad($dept['id'], 3, '0', STR_PAD_LEFT);
            }
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Departments retrieved successfully",
            "data" => $departments
        ]);
    } catch (Exception $e) {
        error_log("Error in getDepartments: " . $e->getMessage());
        throw $e;
    }
}

function createDepartment($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            throw new Exception("Empty request body", 400);
        }

        $data = json_decode($input);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload: " . json_last_error_msg(), 400);
        }
        
        if (!isset($data->name) || empty(trim($data->name))) {
            throw new Exception("Department name is required", 400);
        }
        
        // Check for duplicate name
        $checkQuery = "SELECT id FROM departments WHERE name = ? AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([trim($data->name)]);
        
        if ($checkStmt->rowCount() > 0) {
            throw new Exception("Department with this name already exists", 409);
        }

        // Generate unique department ID
        $deptId = generateDepartmentId($db);

        $query = "INSERT INTO departments (dept_id, name, description) VALUES (?, ?, ?)";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        $name = trim($data->name);
        $description = isset($data->description) ? trim($data->description) : null;
        
        if (!$stmt->execute([$deptId, $name, $description])) {
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
                "name" => $name
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error in createDepartment: " . $e->getMessage());
        throw $e;
    }
}

function updateDepartment($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            throw new Exception("Empty request body", 400);
        }

        $data = json_decode($input);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload: " . json_last_error_msg(), 400);
        }
        
        if (!isset($data->id) || !isset($data->name)) {
            throw new Exception("Department ID and name are required", 400);
        }
        
        // Check department exists
        $checkQuery = "SELECT id FROM departments WHERE id = ? AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$data->id]);
        
        if ($checkStmt->rowCount() === 0) {
            throw new Exception("Department not found", 404);
        }

        // Check for duplicate name
        $checkQuery = "SELECT id FROM departments WHERE name = ? AND id != ? AND status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([trim($data->name), $data->id]);
        
        if ($checkStmt->rowCount() > 0) {
            throw new Exception("Another department with this name already exists", 409);
        }

        $query = "UPDATE departments SET name = ?, description = ? WHERE id = ?";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }
        
        $name = trim($data->name);
        $description = isset($data->description) ? trim($data->description) : null;
        
        if (!$stmt->execute([$name, $description, $data->id])) {
            throw new Exception("Failed to update department", 500);
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Department updated successfully"
        ]);
    } catch (Exception $e) {
        error_log("Error in updateDepartment: " . $e->getMessage());
        throw $e;
    }
}

function deleteDepartment($db) {
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
            throw new Exception("Department ID is required", 400);
        }

        // Start transaction
        $db->beginTransaction();
        
        // Check if department exists and get counts
        $checkQuery = "SELECT d.id, 
                             (SELECT COUNT(*) FROM divisions dv WHERE dv.department_id = d.id AND dv.status = 'active') as divisions_count,
                             (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.status = 'active') as users_count
                      FROM departments d 
                      WHERE d.id = ? AND d.status = 'active'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$id]);
        
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            $db->rollBack();
            throw new Exception("Department not found", 404);
        }
        
        // Check for active users
        if ($result['users_count'] > 0) {
            $db->rollBack();
            throw new Exception("Cannot delete department with active users. Please reassign users first.", 409);
        }

        // If there are active divisions, check for users in those divisions and deactivate
        if ($result['divisions_count'] > 0) {
            // Check for active users in divisions
            $checkUsersQuery = "SELECT COUNT(*) as user_count 
                              FROM users u 
                              INNER JOIN divisions d ON u.division_id = d.id 
                              WHERE d.department_id = ? 
                              AND u.status = 'active'";
            $checkUsersStmt = $db->prepare($checkUsersQuery);
            $checkUsersStmt->execute([$id]);
            $userResult = $checkUsersStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($userResult['user_count'] > 0) {
                $db->rollBack();
                throw new Exception("Cannot delete department. Please reassign users from its divisions first.", 409);
            }
            
            // Deactivate all divisions in this department
            $deactivateDivsQuery = "UPDATE divisions SET status = 'inactive' WHERE department_id = ? AND status = 'active'";
            $deactivateDivsStmt = $db->prepare($deactivateDivsQuery);
            if (!$deactivateDivsStmt->execute([$id])) {
                $db->rollBack();
                throw new Exception("Failed to deactivate divisions", 500);
            }
        }
        
        // Finally, deactivate the department
        $query = "UPDATE departments SET status = 'inactive' WHERE id = ?";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare query", 500);
        }

        if (!$stmt->execute([$id])) {
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
        error_log("Error in deleteDepartment: " . $e->getMessage());
        throw $e;
    }
}
?>
