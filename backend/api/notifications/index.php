
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

function verifyToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return false;
    }

    $token = $matches[1];
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    $payload = json_decode(base64_decode($parts[1]), true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

try {
    $allowedMethods = ['GET', 'POST', 'PUT'];
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
        throw new Exception("Method not allowed", 405);
    }

    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getNotifications($db);
            break;
        case 'POST':
            if (!verifyToken()) {
                throw new Exception("Unauthorized", 401);
            }
            createNotification($db);
            break;
        case 'PUT':
            if (!verifyToken()) {
                throw new Exception("Unauthorized", 401);
            }
            updateNotification($db);
            break;
    }

} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

function getNotifications($db) {
    try {
        $recipient_id = $_GET['recipient_id'] ?? null;
        $recipient_type = $_GET['recipient_type'] ?? 'public';
        
        if (!$recipient_id) {
            throw new Exception("recipient_id is required", 400);
        }

        if (!in_array($recipient_type, ['public', 'staff'])) {
            throw new Exception("Invalid recipient_type", 400);
        }

        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $query = "SELECT n.*
                  FROM notifications n
                  WHERE n.recipient_id = :recipient_id 
                  AND n.recipient_type = :recipient_type
                  ORDER BY n.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':recipient_id', $recipient_id, PDO::PARAM_INT);
        $stmt->bindValue(':recipient_type', $recipient_type, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countQuery = "SELECT COUNT(*) as total FROM notifications 
                       WHERE recipient_id = :recipient_id 
                       AND recipient_type = :recipient_type";
        $stmt = $db->prepare($countQuery);
        $stmt->bindValue(':recipient_id', $recipient_id, PDO::PARAM_INT);
        $stmt->bindValue(':recipient_type', $recipient_type, PDO::PARAM_STR);
        $stmt->execute();
        $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $unreadQuery = "SELECT COUNT(*) as unread FROM notifications 
                        WHERE recipient_id = :recipient_id 
                        AND recipient_type = :recipient_type 
                        AND is_read = 0";
        $stmt = $db->prepare($unreadQuery);
        $stmt->bindValue(':recipient_id', $recipient_id, PDO::PARAM_INT);
        $stmt->bindValue(':recipient_type', $recipient_type, PDO::PARAM_STR);
        $stmt->execute();
        $unreadCount = $stmt->fetch(PDO::FETCH_ASSOC)['unread'];
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => $notifications,
            "meta" => [
                "total" => (int)$totalCount,
                "unread" => (int)$unreadCount,
                "limit" => $limit,
                "offset" => $offset
            ]
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

function createNotification($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload", 400);
        }

        $requiredFields = ['recipient_id', 'title', 'message'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field)) {
                throw new Exception("Missing required field: $field", 400);
            }
        }

        $recipientType = $data->recipient_type ?? 'public';
        if (!in_array($recipientType, ['public', 'staff'])) {
            throw new Exception("Invalid recipient_type", 400);
        }

        $notificationType = $data->type ?? 'info';
        if (!in_array($notificationType, ['info', 'success', 'warning', 'error'])) {
            throw new Exception("Invalid notification type", 400);
        }

        $query = "INSERT INTO notifications (recipient_id, recipient_type, title, message, type, created_at) 
                  VALUES (:recipient_id, :recipient_type, :title, :message, :type, NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(":recipient_id", $data->recipient_id);
        $stmt->bindValue(":recipient_type", $recipientType);
        $stmt->bindValue(":title", $data->title);
        $stmt->bindValue(":message", $data->message);
        $stmt->bindValue(":type", $notificationType);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create notification");
        }

        $notificationId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Notification created successfully",
            "data" => [
                "id" => $notificationId
            ]
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

function updateNotification($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id)) {
            throw new Exception("Notification ID is required", 400);
        }
        
        $query = "UPDATE notifications SET is_read = :is_read WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":is_read", $data->is_read ?? true);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Notification updated successfully"
            ]);
        } else {
            throw new Exception("Failed to update notification");
        }
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
