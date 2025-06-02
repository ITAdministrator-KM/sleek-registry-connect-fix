
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Verify authentication
$authHeader = getAuthorizationHeader();
if (!$authHeader) {
    sendError(401, "No authorization header present");
    exit;
}

$token = validateToken($authHeader);
if (!$token) {
    sendError(401, "Invalid or expired token");
    exit;
}

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getQRScans($db);
        break;
    case 'POST':
        recordQRScan($db);
        break;
    default:
        sendError(405, "Method not allowed");
        break;
}

function getQRScans($db) {
    try {
        $query = "SELECT qs.*, pu.name as public_user_name, pu.nic as public_user_nic, 
                         u.name as staff_user_name
                  FROM qr_scans qs 
                  LEFT JOIN public_users pu ON qs.public_user_id = pu.id 
                  LEFT JOIN users u ON qs.staff_user_id = u.id 
                  ORDER BY qs.created_at DESC LIMIT 100";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $scans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, ["data" => $scans]);
    } catch (PDOException $e) {
        sendError(500, "Database error", $e);
    } catch (Exception $e) {
        sendError(500, "Internal server error", $e);
    }
}

function recordQRScan($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        // Validate required fields
        if (!isset($data->staff_user_id) || !isset($data->scan_purpose) || !isset($data->scan_location)) {
            sendError(400, "Missing required fields: staff_user_id, scan_purpose, scan_location");
            return;
        }
        
        $query = "INSERT INTO qr_scans (public_user_id, staff_user_id, scan_purpose, scan_location, scan_data) 
                  VALUES (:public_user_id, :staff_user_id, :scan_purpose, :scan_location, :scan_data)";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(":public_user_id", $data->public_user_id ?? null, PDO::PARAM_INT);
        $stmt->bindParam(":staff_user_id", $data->staff_user_id);
        $stmt->bindParam(":scan_purpose", $data->scan_purpose);
        $stmt->bindParam(":scan_location", $data->scan_location);
        $stmt->bindParam(":scan_data", $data->scan_data ?? '');
        
        $stmt->execute();
        
        sendResponse(201, [
            "message" => "QR scan recorded successfully",
            "scan_id" => $db->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        sendError(500, "Database error", $e);
    } catch (Exception $e) {
        sendError(500, "Internal server error", $e);
    }
}
?>
