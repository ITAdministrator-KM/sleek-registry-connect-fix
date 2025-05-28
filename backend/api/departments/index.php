<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

try {
    // Validate request method
    $allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
        throw new Exception("Method not allowed", 405);
    }

    // Check content type for POST and PUT requests
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
        $contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "";
        if (!str_contains($contentType, 'application/json')) {
            throw new Exception("Invalid Content-Type. Expected application/json", 400);
        }
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    // Verify authentication except for public GET requests
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        throw new Exception("No authentication token provided", 401);
    }

    $token = $matches[1];
    list($payload, $signature) = explode('.', $token);
    $payload = json_decode(base64_decode($payload), true);
    
    if (!$payload || $payload['exp'] < time()) {
        throw new Exception("Token expired or invalid", 401);
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

function getDepartments($db) {
    try {
        $query = "SELECT d.*, COUNT(dv.id) as divisions_count 
                  FROM departments d 
                  LEFT JOIN divisions dv ON d.id = dv.department_id 
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

        $query = "INSERT INTO departments (name, description) VALUES (:name, :description)";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }

        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":description", $data->description ?? null);
        
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

        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":description", $data->description ?? null);
        
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
        $id = $_GET['id'] ?? null;
        if (!$id) {
            throw new Exception("Department ID is required", 400);
        }
        
        // Check if department exists and has no active divisions
        $checkQuery = "SELECT d.id, COUNT(dv.id) as divisions_count 
                      FROM departments d 
                      LEFT JOIN divisions dv ON d.id = dv.department_id AND dv.status = 'active'
                      WHERE d.id = :id AND d.status = 'active'
                      GROUP BY d.id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":id", $id);
        $checkStmt->execute();
        
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            throw new Exception("Department not found", 404);
        }
        
        if ($result['divisions_count'] > 0) {
            throw new Exception("Cannot delete department with active divisions", 409);
        }
        
        $query = "UPDATE departments SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query", 500);
        }

        $stmt->bindParam(":id", $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete department", 500);
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Department deleted successfully"
        ]);
    } catch (Exception $e) {
        throw $e;
    }
}
?>
