
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

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    // Verify authentication except for public notifications
    if (!isset($_GET['recipient_type']) || $_GET['recipient_type'] !== 'public') {
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
    }

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

function getNotifications($db) {
    try {
        // Validate required parameters
        $recipient_id = $_GET['recipient_id'] ?? null;
        $recipient_type = $_GET['recipient_type'] ?? null;
        
        if (!$recipient_id) {
            throw new Exception("recipient_id is required", 400);
        }

        // Validate recipient_type if provided
        if ($recipient_type && !in_array($recipient_type, ['public', 'staff'])) {
            throw new Exception("Invalid recipient_type. Must be 'public' or 'staff'", 400);
        }

        // Optional filters
        $type = $_GET['type'] ?? null;
        $isRead = isset($_GET['is_read']) ? filter_var($_GET['is_read'], FILTER_VALIDATE_BOOLEAN) : null;
        $limit = min((int)($_GET['limit'] ?? 50), 100); // Max 100 notifications per request
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        // Build query
        $query = "SELECT n.*, 
                         CASE 
                             WHEN n.recipient_type = 'public' THEN pu.name
                             WHEN n.recipient_type = 'staff' THEN u.name
                         END as recipient_name
                  FROM notifications n
                  LEFT JOIN public_users pu ON n.recipient_type = 'public' AND n.recipient_id = pu.id
                  LEFT JOIN users u ON n.recipient_type = 'staff' AND n.recipient_id = u.id
                  WHERE 1=1";
        
        $params = array();
        
        // Add filters
        $query .= " AND n.recipient_id = :recipient_id";
        $params[':recipient_id'] = $recipient_id;
        
        if ($recipient_type) {
            $query .= " AND n.recipient_type = :recipient_type";
            $params[':recipient_type'] = $recipient_type;
        }

        if ($type) {
            $query .= " AND n.type = :type";
            $params[':type'] = $type;
        }

        if (isset($isRead)) {
            $query .= " AND n.is_read = :is_read";
            $params[':is_read'] = $isRead;
        }

        // Get total count for pagination
        $countQuery = str_replace("SELECT n.*,", "SELECT COUNT(*) as total", $query);
        $stmt = $db->prepare($countQuery);
        if (!$stmt) {
            throw new Exception("Failed to prepare count query");
        }

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        if (!$stmt->execute()) {
            throw new Exception("Failed to execute count query");
        }

        $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Add sorting and pagination
        $query .= " ORDER BY n.created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($notifications === false) {
            throw new Exception("Failed to fetch notifications");
        }

        // Get unread count
        $unreadQuery = $query = "SELECT COUNT(*) as unread FROM notifications WHERE recipient_id = :recipient_id AND is_read = 0";
        $params = [':recipient_id' => $recipient_id];
        
        if ($recipient_type) {
            $unreadQuery .= " AND recipient_type = :recipient_type";
            $params[':recipient_type'] = $recipient_type;
        }

        $stmt = $db->prepare($unreadQuery);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
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
                "offset" => $offset,
                "filters" => [
                    "recipient_id" => $recipient_id,
                    "recipient_type" => $recipient_type,
                    "type" => $type,
                    "is_read" => $isRead
                ]
            ]
        ]);
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
}

function createNotification($db) {
    try {
        // Parse and validate input
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload: " . json_last_error_msg(), 400);
        }

        // Validate required fields
        $requiredFields = ['recipient_id', 'title', 'message'];
        $missingFields = array_filter($requiredFields, fn($field) => !isset($data->$field));
        if (!empty($missingFields)) {
            throw new Exception("Missing required fields: " . implode(', ', $missingFields), 400);
        }

        // Validate recipient_type if provided
        $recipientType = $data->recipient_type ?? 'public';
        if (!in_array($recipientType, ['public', 'staff'])) {
            throw new Exception("Invalid recipient_type. Must be 'public' or 'staff'", 400);
        }

        // Validate notification type if provided
        $notificationType = $data->type ?? 'info';
        $validTypes = ['info', 'success', 'warning', 'error'];
        if (!in_array($notificationType, $validTypes)) {
            throw new Exception("Invalid notification type. Must be one of: " . implode(', ', $validTypes), 400);
        }

        // Validate title and message length
        if (strlen($data->title) > 255) {
            throw new Exception("Title is too long. Maximum 255 characters.", 400);
        }
        if (strlen($data->message) > 1000) {
            throw new Exception("Message is too long. Maximum 1000 characters.", 400);
        }

        // Verify recipient exists
        $recipientTable = $recipientType === 'public' ? 'public_users' : 'users';
        $stmt = $db->prepare("SELECT id FROM {$recipientTable} WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->recipient_id]);
        if ($stmt->rowCount() === 0) {
            throw new Exception("Invalid recipient_id or recipient not active", 400);
        }

        // Begin transaction
        $db->beginTransaction();

        try {
            // Insert notification
            $query = "INSERT INTO notifications (recipient_id, recipient_type, title, message, type, created_at) 
                      VALUES (:recipient_id, :recipient_type, :title, :message, :type, NOW())";
            
            $stmt = $db->prepare($query);
            if (!$stmt) {
                throw new Exception("Failed to prepare query");
            }

            $stmt->bindValue(":recipient_id", $data->recipient_id);
            $stmt->bindValue(":recipient_type", $recipientType);
            $stmt->bindValue(":title", $data->title);
            $stmt->bindValue(":message", $data->message);
            $stmt->bindValue(":type", $notificationType);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to create notification");
            }

            $notificationId = $db->lastInsertId();

            // Commit transaction
            $db->commit();

            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "message" => "Notification created successfully",
                "data" => [
                    "id" => $notificationId,
                    "recipient_id" => $data->recipient_id,
                    "recipient_type" => $recipientType,
                    "title" => $data->title,
                    "type" => $notificationType,
                    "created_at" => date('Y-m-d H:i:s')
                ]
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
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
