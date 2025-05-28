<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

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
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getQRScans($db) {
    try {
        $public_user_id = $_GET['public_user_id'] ?? null;
        
        if (!$public_user_id) {
            http_response_code(400);
            echo json_encode(array("message" => "Public user ID is required"));
            return;
        }

        $query = "SELECT qr.*, u.name as staff_name 
                  FROM qr_scans qr 
                  LEFT JOIN users u ON qr.staff_user_id = u.id 
                  WHERE qr.public_user_id = :public_user_id 
                  ORDER BY qr.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":public_user_id", $public_user_id);
        $stmt->execute();
        
        $scans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($scans);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function recordQRScan($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->public_user_id) || !isset($data->staff_user_id)) {
        http_response_code(400);
        echo json_encode(array("message" => "Public user ID and staff user ID are required"));
        return;
    }
    
    try {
        $query = "INSERT INTO qr_scans (public_user_id, staff_user_id, scan_location, scan_purpose) 
                  VALUES (:public_user_id, :staff_user_id, :scan_location, :scan_purpose)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":public_user_id", $data->public_user_id);
        $stmt->bindParam(":staff_user_id", $data->staff_user_id);
        $stmt->bindParam(":scan_location", $data->scan_location ?? null);
        $stmt->bindParam(":scan_purpose", $data->scan_purpose ?? null);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "QR scan recorded successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to record QR scan"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
