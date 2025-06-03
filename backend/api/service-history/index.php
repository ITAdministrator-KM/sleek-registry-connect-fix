
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../config/response_handler.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
    }

    // For write operations, validate authentication
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
        if (!validateAuthToken()) {
            sendError(401, "Authentication required");
        }
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getServiceHistory($db);
            break;
        case 'POST':
            createServiceHistory($db);
            break;
        case 'PUT':
            updateServiceHistory($db);
            break;
        case 'DELETE':
            deleteServiceHistory($db);
            break;
        default:
            sendError(405, "Method not allowed");
    }
} catch (Exception $e) {
    sendError($e->getCode() ?: 500, $e->getMessage());
}

function getServiceHistory($db) {
    try {
        $public_user_id = filter_input(INPUT_GET, 'public_user_id', FILTER_VALIDATE_INT);
        
        if (!$public_user_id) {
            sendError(400, "Public user ID is required");
        }

        $query = "SELECT sh.*, d.name as department_name, dv.name as division_name 
                  FROM service_history sh 
                  LEFT JOIN departments d ON sh.department_id = d.id 
                  LEFT JOIN divisions dv ON sh.division_id = dv.id 
                  WHERE sh.public_user_id = :public_user_id 
                  ORDER BY sh.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':public_user_id', $public_user_id, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to fetch service history", 500);
        }
        
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse($history, "Service history retrieved successfully");
    } catch (Exception $e) {
        sendError($e->getCode() ?: 500, $e->getMessage());
    }
}

function createServiceHistory($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data) {
            sendError(400, "Invalid JSON data");
        }
        
        if (!isset($data->public_user_id) || !isset($data->service_name) || 
            !isset($data->department_id) || !isset($data->division_id)) {
            sendError(400, "Required fields: public_user_id, service_name, department_id, division_id");
        }
        
        $query = "INSERT INTO service_history (
                    public_user_id, department_id, division_id, service_name, 
                    details, status, created_at
                  ) VALUES (
                    :public_user_id, :department_id, :division_id, :service_name,
                    :details, 'pending', NOW()
                  )";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':public_user_id', $data->public_user_id);
        $stmt->bindValue(':department_id', $data->department_id);
        $stmt->bindValue(':division_id', $data->division_id);
        $stmt->bindValue(':service_name', $data->service_name);
        $stmt->bindValue(':details', $data->details ?? null);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create service history", 500);
        }
        
        $newId = $db->lastInsertId();
        
        // Fetch the created record
        $query = "SELECT sh.*, d.name as department_name, dv.name as division_name 
                 FROM service_history sh 
                 LEFT JOIN departments d ON sh.department_id = d.id 
                 LEFT JOIN divisions dv ON sh.division_id = dv.id 
                 WHERE sh.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $newId);
        $stmt->execute();
        
        $newRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        sendResponse($newRecord, "Service history created successfully", 201);
    } catch (Exception $e) {
        sendError($e->getCode() ?: 500, $e->getMessage());
    }
}

function updateServiceHistory($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->id)) {
            sendError(400, "ID is required");
        }
        
        $updates = [];
        $params = [':id' => $data->id];
        
        if (isset($data->status)) {
            $updates[] = "status = :status";
            $params[':status'] = $data->status;
        }
        if (isset($data->details)) {
            $updates[] = "details = :details";
            $params[':details'] = $data->details;
        }
        
        if (empty($updates)) {
            sendError(400, "No fields to update");
        }
        
        $query = "UPDATE service_history SET " . implode(", ", $updates) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to update service history", 500);
        }
        
        sendResponse(null, "Service history updated successfully");
    } catch (Exception $e) {
        sendError($e->getCode() ?: 500, $e->getMessage());
    }
}

function deleteServiceHistory($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->id)) {
            sendError(400, "ID is required");
        }
        
        $query = "DELETE FROM service_history WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $data->id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete service history", 500);
        }
        
        sendResponse(null, "Service history deleted successfully");
    } catch (Exception $e) {
        sendError($e->getCode() ?: 500, $e->getMessage());
    }
}
?>
