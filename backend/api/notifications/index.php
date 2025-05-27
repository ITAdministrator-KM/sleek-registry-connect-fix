
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getNotifications($db);
        break;
    case 'POST':
        createNotification($db);
        break;
    case 'PUT':
        updateNotification($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getNotifications($db) {
    try {
        $recipient_id = $_GET['recipient_id'] ?? null;
        $recipient_type = $_GET['recipient_type'] ?? null;
        
        $query = "SELECT * FROM notifications WHERE 1=1";
        $params = array();
        
        if ($recipient_id) {
            $query .= " AND recipient_id = :recipient_id";
            $params[':recipient_id'] = $recipient_id;
        }
        
        if ($recipient_type) {
            $query .= " AND recipient_type = :recipient_type";
            $params[':recipient_type'] = $recipient_type;
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($notifications);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function createNotification($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->recipient_id) || !isset($data->title) || !isset($data->message)) {
        http_response_code(400);
        echo json_encode(array("message" => "Required fields missing"));
        return;
    }
    
    try {
        $query = "INSERT INTO notifications (recipient_id, recipient_type, title, message, type) 
                  VALUES (:recipient_id, :recipient_type, :title, :message, :type)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":recipient_id", $data->recipient_id);
        $stmt->bindParam(":recipient_type", $data->recipient_type ?? 'public');
        $stmt->bindParam(":title", $data->title);
        $stmt->bindParam(":message", $data->message);
        $stmt->bindParam(":type", $data->type ?? 'info');
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Notification created successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create notification"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function updateNotification($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(array("message" => "Notification ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE notifications SET is_read = :is_read WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":is_read", $data->is_read ?? true);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Notification updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update notification"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
