
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

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
            getTokens($db);
            break;
        case 'POST':
            createToken($db);
            break;
        case 'PUT':
            updateToken($db);
            break;
        case 'DELETE':
            deleteToken($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Tokens API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getTokens($db) {
    try {
        $query = "SELECT t.*, 
                         d.name as department_name, 
                         div.name as division_name,
                         pu.name as public_user_name,
                         pu.public_user_id
                  FROM tokens t 
                  LEFT JOIN departments d ON t.department_id = d.id 
                  LEFT JOIN divisions div ON t.division_id = div.id 
                  LEFT JOIN public_users pu ON t.public_user_id = pu.id
                  ORDER BY t.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse($tokens, "Tokens retrieved successfully");
    } catch (Exception $e) {
        error_log("Get tokens error: " . $e->getMessage());
        sendError(500, "Failed to fetch tokens: " . $e->getMessage());
    }
}

function createToken($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['department_id'])) {
            sendError(400, "Department ID is required");
            return;
        }
        
        // Generate token number
        $tokenNumber = generateTokenNumber($db, $data['department_id']);
        
        // Calculate queue position
        $queuePosition = getQueuePosition($db, $data['department_id'], $data['division_id'] ?? null);
        
        $query = "INSERT INTO tokens (token_number, registry_id, department_id, division_id, 
                                    public_user_id, service_type, priority_level, queue_position, 
                                    estimated_wait_time) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            $tokenNumber,
            $data['registry_id'] ?? null,
            $data['department_id'],
            $data['division_id'] ?? null,
            $data['public_user_id'] ?? null,
            $data['service_type'] ?? 'General Service',
            $data['priority_level'] ?? 'normal',
            $queuePosition,
            calculateWaitTime($queuePosition)
        ]);
        
        $tokenId = $db->lastInsertId();
        
        sendResponse([
            "id" => $tokenId,
            "token_number" => $tokenNumber,
            "queue_position" => $queuePosition,
            "estimated_wait_time" => calculateWaitTime($queuePosition)
        ], "Token created successfully");
        
    } catch (Exception $e) {
        error_log("Create token error: " . $e->getMessage());
        sendError(500, "Failed to create token: " . $e->getMessage());
    }
}

function generateTokenNumber($db, $departmentId) {
    $today = date('Y-m-d');
    $stmt = $db->prepare("SELECT COUNT(*) FROM tokens WHERE department_id = ? AND DATE(created_at) = ?");
    $stmt->execute([$departmentId, $today]);
    $count = $stmt->fetchColumn() + 1;
    
    return sprintf("D%d-%03d", $departmentId, $count);
}

function getQueuePosition($db, $departmentId, $divisionId = null) {
    $query = "SELECT COUNT(*) FROM tokens WHERE department_id = ? AND status IN ('waiting', 'called', 'serving')";
    $params = [$departmentId];
    
    if ($divisionId) {
        $query .= " AND division_id = ?";
        $params[] = $divisionId;
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    return $stmt->fetchColumn() + 1;
}

function calculateWaitTime($queuePosition) {
    return max(5, $queuePosition * 8); // 8 minutes per person minimum 5 minutes
}

function updateToken($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Token ID is required");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['status', 'staff_id', 'called_at', 'served_at', 'completed_at'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE tokens SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $params[] = $data['id'];
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        sendResponse(["id" => $data['id']], "Token updated successfully");
        
    } catch (Exception $e) {
        error_log("Update token error: " . $e->getMessage());
        sendError(500, "Failed to update token: " . $e->getMessage());
    }
}

function deleteToken($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Token ID is required");
            return;
        }
        
        $query = "UPDATE tokens SET status = 'cancelled' WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data['id']]);
        
        sendResponse(["id" => $data['id']], "Token cancelled successfully");
        
    } catch (Exception $e) {
        error_log("Delete token error: " . $e->getMessage());
        sendError(500, "Failed to cancel token: " . $e->getMessage());
    }
}
?>
