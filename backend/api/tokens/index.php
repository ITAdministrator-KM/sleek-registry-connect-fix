
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

function generateTokenNumber($departmentId, $db) {
    try {
        $today = date('Y-m-d');
        
        // Get count of tokens for this department today
        $stmt = $db->prepare("SELECT COUNT(*) FROM tokens WHERE department_id = ? AND DATE(created_at) = ?");
        $stmt->execute([$departmentId, $today]);
        $count = $stmt->fetchColumn();
        
        // Generate token number: DEPT-DATE-SEQ (e.g., D1-20231201-001)
        $tokenNumber = 'D' . $departmentId . '-' . date('Ymd') . '-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        
        return $tokenNumber;
    } catch (Exception $e) {
        error_log("Generate token number error: " . $e->getMessage());
        return 'TKN-' . time() . '-' . rand(100, 999);
    }
}

function getTokens($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;
        $date = $_GET['date'] ?? null;
        $limit = $_GET['limit'] ?? null;
        
        $query = "SELECT t.*, 
                         d.name as department_name, 
                         div.name as division_name,
                         pu.name as visitor_name,
                         pu.nic as visitor_nic,
                         pr.purpose_of_visit
                  FROM tokens t 
                  LEFT JOIN departments d ON t.department_id = d.id 
                  LEFT JOIN divisions div ON t.division_id = div.id 
                  LEFT JOIN public_users pu ON t.public_user_id = pu.id
                  LEFT JOIN public_registry pr ON t.registry_id = pr.id
                  WHERE 1=1";
        
        $params = [];
        
        if ($departmentId) {
            $query .= " AND t.department_id = ?";
            $params[] = $departmentId;
        }
        
        if ($divisionId) {
            $query .= " AND t.division_id = ?";
            $params[] = $divisionId;
        }
        
        if ($date) {
            $query .= " AND DATE(t.created_at) = ?";
            $params[] = $date;
        }
        
        $query .= " ORDER BY t.created_at DESC";
        
        if ($limit) {
            $query .= " LIMIT ?";
            $params[] = intval($limit);
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate wait times and add additional fields
        foreach ($tokens as &$token) {
            if ($token['created_at'] && $token['served_at']) {
                $created = new DateTime($token['created_at']);
                $served = new DateTime($token['served_at']);
                $token['total_wait_minutes'] = $served->diff($created)->i;
            } else {
                $token['total_wait_minutes'] = null;
            }
        }
        
        sendResponse($tokens, "Tokens retrieved successfully");
        
    } catch (Exception $e) {
        error_log("Get tokens error: " . $e->getMessage());
        sendError(500, "Failed to fetch tokens: " . $e->getMessage());
    }
}

function createToken($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input, true);
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        // Validate required fields
        if (!isset($data['department_id']) || empty($data['department_id'])) {
            sendError(400, "Department ID is required");
            return;
        }
        
        $db->beginTransaction();
        
        // Generate token number
        $tokenNumber = generateTokenNumber($data['department_id'], $db);
        
        // Calculate queue position
        $stmt = $db->prepare("SELECT COUNT(*) FROM tokens WHERE department_id = ? AND status IN ('waiting', 'called') AND DATE(created_at) = CURDATE()");
        $stmt->execute([$data['department_id']]);
        $queuePosition = $stmt->fetchColumn() + 1;
        
        $query = "INSERT INTO tokens (token_number, registry_id, department_id, division_id, public_user_id, service_type, priority_level, status, queue_position, estimated_wait_time, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?, ?, NOW())";
        
        $params = [
            $tokenNumber,
            !empty($data['registry_id']) ? intval($data['registry_id']) : null,
            intval($data['department_id']),
            !empty($data['division_id']) ? intval($data['division_id']) : null,
            !empty($data['public_user_id']) ? intval($data['public_user_id']) : null,
            $data['service_type'] ?? 'General Service',
            $data['priority_level'] ?? 'normal',
            $queuePosition,
            max(5, $queuePosition * 8) // Estimate 8 minutes per person
        ];
        
        $stmt = $db->prepare($query);
        if (!$stmt->execute($params)) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Failed to create token: " . $errorInfo[2]);
        }
        
        $tokenId = $db->lastInsertId();
        $db->commit();
        
        sendResponse([
            "id" => intval($tokenId),
            "token_number" => $tokenNumber,
            "department_id" => intval($data['department_id']),
            "division_id" => !empty($data['division_id']) ? intval($data['division_id']) : null,
            "queue_position" => $queuePosition,
            "estimated_wait_time" => max(5, $queuePosition * 8),
            "status" => "waiting",
            "created_at" => date('Y-m-d H:i:s')
        ], "Token created successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create token error: " . $e->getMessage());
        sendError(500, "Failed to create token: " . $e->getMessage());
    }
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
        if (!$stmt->execute($params)) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Update failed: " . $errorInfo[2]);
        }
        
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
        if (!$stmt->execute([$data['id']])) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Delete failed: " . $errorInfo[2]);
        }
        
        sendResponse(["id" => $data['id']], "Token cancelled successfully");
        
    } catch (Exception $e) {
        error_log("Delete token error: " . $e->getMessage());
        sendError(500, "Failed to cancel token: " . $e->getMessage());
    }
}
?>
