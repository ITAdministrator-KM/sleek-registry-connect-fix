
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../config/response_handler.php';
include_once '../../utils/auth.php';

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
            getServiceHistory($db);
            break;
        case 'POST':
            addServiceHistory($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Service History API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getServiceHistory($db) {
    try {
        $publicUserId = $_GET['public_user_id'] ?? null;
        
        if (!$publicUserId) {
            sendError(400, "Public user ID is required");
            return;
        }

        $query = "SELECT sh.*, d.name as department_name, dv.name as division_name
                  FROM service_history sh
                  LEFT JOIN departments d ON sh.department_id = d.id
                  LEFT JOIN divisions dv ON sh.division_id = dv.id
                  WHERE sh.public_user_id = :public_user_id
                  ORDER BY sh.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(":public_user_id", $publicUserId, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse($history, "Service history retrieved successfully");
    } catch (Exception $e) {
        error_log("Get service history error: " . $e->getMessage());
        sendError(500, "Failed to fetch service history: " . $e->getMessage());
    }
}

function addServiceHistory($db) {
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
        
        // Validate required fields
        $requiredFields = ['public_user_id', 'service_type', 'purpose'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty(trim($data->$field))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        $query = "INSERT INTO service_history (public_user_id, service_type, purpose, department_id, division_id, status, created_at) 
                  VALUES (:public_user_id, :service_type, :purpose, :department_id, :division_id, 'pending', NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(":public_user_id", $data->public_user_id, PDO::PARAM_INT);
        $stmt->bindValue(":service_type", $data->service_type, PDO::PARAM_STR);
        $stmt->bindValue(":purpose", $data->purpose, PDO::PARAM_STR);
        $stmt->bindValue(":department_id", $data->department_id ?? null, PDO::PARAM_INT);
        $stmt->bindValue(":division_id", $data->division_id ?? null, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to add service history");
        }
        
        $historyId = $db->lastInsertId();
        
        sendResponse([
            "id" => $historyId,
            "status" => "pending"
        ], "Service history added successfully");
        
    } catch (Exception $e) {
        error_log("Add service history error: " . $e->getMessage());
        sendError(500, "Failed to add service history: " . $e->getMessage());
    }
}
?>
