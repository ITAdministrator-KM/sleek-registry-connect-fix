<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

try {
    // Validate request method
    $allowedMethods = ['GET', 'POST', 'PUT'];
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

    // Verify authentication
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

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    // Handle request
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getServiceHistory($db);
            break;
        case 'POST':
            addServiceHistory($db);
            break;
        case 'PUT':
            updateServiceStatus($db);
            break;
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

function getServiceHistory($db) {
    try {
        // Get and validate parameters
        $public_user_id = filter_input(INPUT_GET, 'public_user_id', FILTER_SANITIZE_STRING);
        $page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?: 1;
        $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 10;
        $status = filter_input(INPUT_GET, 'status', FILTER_SANITIZE_STRING);
        $department_id = filter_input(INPUT_GET, 'department_id', FILTER_VALIDATE_INT);
        $from_date = filter_input(INPUT_GET, 'from_date', FILTER_SANITIZE_STRING);
        $to_date = filter_input(INPUT_GET, 'to_date', FILTER_SANITIZE_STRING);

        if (!$public_user_id) {
            throw new Exception("Public user ID is required", 400);
        }

        // Validate date format if provided
        if ($from_date && !strtotime($from_date)) {
            throw new Exception("Invalid from_date format. Use YYYY-MM-DD", 400);
        }
        if ($to_date && !strtotime($to_date)) {
            throw new Exception("Invalid to_date format. Use YYYY-MM-DD", 400);
        }

        // Build query
        $conditions = ["sh.public_user_id = :public_user_id"];
        $params = [":public_user_id" => $public_user_id];

        if ($status) {
            $conditions[] = "sh.status = :status";
            $params[":status"] = $status;
        }
        if ($department_id) {
            $conditions[] = "sh.department_id = :department_id";
            $params[":department_id"] = $department_id;
        }
        if ($from_date) {
            $conditions[] = "DATE(sh.created_at) >= :from_date";
            $params[":from_date"] = $from_date;
        }
        if ($to_date) {
            $conditions[] = "DATE(sh.created_at) <= :to_date";
            $params[":to_date"] = $to_date;
        }

        // Count total records
        $countQuery = "SELECT COUNT(*) FROM service_history sh WHERE " . implode(" AND ", $conditions);
        $stmt = $db->prepare($countQuery);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $total = $stmt->fetchColumn();

        // Calculate pagination
        $offset = ($page - 1) * $limit;
        $totalPages = ceil($total / $limit);

        // Get records
        $query = "SELECT sh.*, d.name as department_name, dv.name as division_name 
                  FROM service_history sh 
                  LEFT JOIN departments d ON sh.department_id = d.id 
                  LEFT JOIN divisions dv ON sh.division_id = dv.id 
                  WHERE " . implode(" AND ", $conditions) . " 
                  ORDER BY sh.created_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format response
        $response = [
            "status" => "success",
            "data" => $history,
            "meta" => [
                "current_page" => $page,
                "per_page" => $limit,
                "total_records" => $total,
                "total_pages" => $totalPages,
                "has_next" => $page < $totalPages,
                "has_previous" => $page > 1
            ]
        ];
        
        http_response_code(200);
        echo json_encode($response);
    } catch (Exception $e) {
        $code = $e->getCode() ?: 500;
        http_response_code($code);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}

function addServiceHistory($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON format", 400);
        }
        
        // Required field validation
        $required_fields = ['public_user_id', 'service_name', 'department_id', 'division_id'];
        $missing_fields = [];
        foreach ($required_fields as $field) {
            if (!isset($data->$field) || empty($data->$field)) {
                $missing_fields[] = $field;
            }
        }
        if (!empty($missing_fields)) {
            throw new Exception("Required fields missing: " . implode(', ', $missing_fields), 400);
        }

        // Validate IDs are integers
        if (!filter_var($data->department_id, FILTER_VALIDATE_INT)) {
            throw new Exception("Invalid department_id", 400);
        }
        if (!filter_var($data->division_id, FILTER_VALIDATE_INT)) {
            throw new Exception("Invalid division_id", 400);
        }

        // Validate string lengths
        if (strlen($data->service_name) > 255) {
            throw new Exception("Service name is too long (max 255 characters)", 400);
        }
        if (isset($data->details) && strlen($data->details) > 1000) {
            throw new Exception("Details are too long (max 1000 characters)", 400);
        }

        // Check if department exists
        $stmt = $db->prepare("SELECT id FROM departments WHERE id = ?");
        $stmt->execute([$data->department_id]);
        if (!$stmt->fetch()) {
            throw new Exception("Department not found", 404);
        }

        // Check if division exists
        $stmt = $db->prepare("SELECT id FROM divisions WHERE id = ?");
        $stmt->execute([$data->division_id]);
        if (!$stmt->fetch()) {
            throw new Exception("Division not found", 404);
        }

        // Insert record
        $query = "INSERT INTO service_history (
                    public_user_id, department_id, division_id, service_name, 
                    details, staff_user_id, status, created_at
                  ) VALUES (
                    :public_user_id, :department_id, :division_id, :service_name,
                    :details, :staff_user_id, :status, NOW()
                  )";
        
        $stmt = $db->prepare($query);
        $status = 'pending'; // Default status for new records
        
        $stmt->bindParam(":public_user_id", $data->public_user_id);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        $stmt->bindParam(":service_name", $data->service_name);
        $stmt->bindParam(":details", $data->details ?? null);
        $stmt->bindParam(":staff_user_id", $data->staff_user_id ?? null);
        $stmt->bindParam(":status", $status);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to add service history", 400);
        }

        $newId = $db->lastInsertId();
        
        // Fetch the created record
        $query = "SELECT sh.*, d.name as department_name, dv.name as division_name 
                 FROM service_history sh 
                 LEFT JOIN departments d ON sh.department_id = d.id 
                 LEFT JOIN divisions dv ON sh.division_id = dv.id 
                 WHERE sh.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $newId);
        $stmt->execute();
        $newRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Service history added successfully",
            "data" => $newRecord
        ]);
    } catch (Exception $e) {
        $code = $e->getCode() ?: 500;
        http_response_code($code);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}

function updateServiceStatus($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON format", 400);
        }
        
        // Validate required fields
        if (!isset($data->id) || !isset($data->status)) {
            throw new Exception("ID and status are required", 400);
        }

        // Validate ID is integer
        if (!filter_var($data->id, FILTER_VALIDATE_INT)) {
            throw new Exception("Invalid ID format", 400);
        }

        // Validate status
        $valid_statuses = ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'];
        if (!in_array($data->status, $valid_statuses)) {
            throw new Exception("Invalid status. Allowed values: " . implode(', ', $valid_statuses), 400);
        }

        // Check if record exists
        $stmt = $db->prepare("SELECT id FROM service_history WHERE id = ?");
        $stmt->execute([$data->id]);
        if (!$stmt->fetch()) {
            throw new Exception("Service history record not found", 404);
        }

        // Update record
        $query = "UPDATE service_history 
                 SET status = :status, 
                     details = CASE 
                         WHEN :new_details IS NOT NULL THEN :new_details 
                         ELSE details 
                     END,
                     updated_at = NOW() 
                 WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":new_details", $data->details ?? null);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update service status", 400);
        }

        // Fetch updated record
        $query = "SELECT sh.*, d.name as department_name, dv.name as division_name 
                 FROM service_history sh 
                 LEFT JOIN departments d ON sh.department_id = d.id 
                 LEFT JOIN divisions dv ON sh.division_id = dv.id 
                 WHERE sh.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        $updatedRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Service status updated successfully",
            "data" => $updatedRecord
        ]);
    } catch (Exception $e) {
        $code = $e->getCode() ?: 500;
        http_response_code($code);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}
?>
