
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/response_handler.php';

try {
    // Validate request method
    $allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
        sendError(405, "Method not allowed");
    }

    // Validate authentication
    if (!validateAuthToken()) {
        sendError(401, "Unauthorized access");
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError(500, "Database connection failed");
    }

    // Handle request based on method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetRequest($db);
            break;
        case 'POST':
            handlePostRequest($db);
            break;
        case 'PUT':
            handlePutRequest($db);
            break;
        case 'DELETE':
            handleDeleteRequest($db);
            break;
    }

} catch (Exception $e) {
    error_log("Token API Error: " . $e->getMessage());
    sendError(500, "Internal server error", $e->getMessage());
}

function handleGetRequest($db) {
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            getTokens($db);
            break;
        case 'next':
            getNextToken($db);
            break;
        case 'queue':
            getQueueStatus($db);
            break;
        case 'history':
            getTokenHistory($db);
            break;
        default:
            sendError(400, "Invalid action parameter");
    }
}

function getTokens($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;
        $date = $_GET['date'] ?? date('Y-m-d');
        $status = $_GET['status'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);

        $whereConditions = ["DATE(st.created_at) = :date"];
        $params = [":date" => $date];

        if ($departmentId) {
            $whereConditions[] = "st.department_id = :department_id";
            $params[":department_id"] = $departmentId;
        }

        if ($divisionId) {
            $whereConditions[] = "st.division_id = :division_id";
            $params[":division_id"] = $divisionId;
        }

        if ($status) {
            $whereConditions[] = "st.status = :status";
            $params[":status"] = $status;
        }

        $whereClause = implode(" AND ", $whereConditions);

        $query = "
            SELECT 
                st.*,
                pr.visitor_name,
                pr.visitor_nic,
                pr.purpose_of_visit,
                d.name as department_name,
                dv.name as division_name,
                u.name as staff_name,
                TIMESTAMPDIFF(MINUTE, st.created_at, NOW()) as total_wait_minutes
            FROM service_tokens st
            LEFT JOIN public_registry pr ON st.registry_id = pr.id
            LEFT JOIN departments d ON st.department_id = d.id
            LEFT JOIN divisions dv ON st.division_id = dv.id
            LEFT JOIN users u ON st.staff_id = u.id
            WHERE {$whereClause}
            ORDER BY 
                CASE st.priority_level 
                    WHEN 'urgent' THEN 1 
                    WHEN 'vip' THEN 2 
                    ELSE 3 
                END,
                st.created_at ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM service_tokens st
            WHERE {$whereClause}
        ";
        $countStmt = $db->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        sendResponse([
            'tokens' => $tokens,
            'meta' => [
                'total' => (int)$totalCount,
                'limit' => $limit,
                'offset' => $offset,
                'date' => $date
            ]
        ]);

    } catch (Exception $e) {
        sendError(500, "Failed to fetch tokens", $e->getMessage());
    }
}

function getNextToken($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;
        $staffId = $_GET['staff_id'] ?? null;

        if (!$departmentId || !$divisionId || !$staffId) {
            sendError(400, "Department ID, Division ID, and Staff ID are required");
        }

        $stmt = $db->prepare("CALL sp_call_next_token(?, ?, ?, @token_id, @token_number)");
        $stmt->execute([$departmentId, $divisionId, $staffId]);

        $result = $db->query("SELECT @token_id as token_id, @token_number as token_number")->fetch(PDO::FETCH_ASSOC);

        if ($result['token_id']) {
            sendResponse([
                'token_id' => $result['token_id'],
                'token_number' => $result['token_number'],
                'status' => 'called'
            ], "Next token called successfully");
        } else {
            sendResponse([
                'token_id' => null,
                'token_number' => null,
                'message' => 'No tokens waiting in queue'
            ], "No tokens in queue");
        }

    } catch (Exception $e) {
        sendError(500, "Failed to call next token", $e->getMessage());
    }
}

function getQueueStatus($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;

        if (!$departmentId || !$divisionId) {
            sendError(400, "Department ID and Division ID are required");
        }

        $stmt = $db->prepare("CALL sp_get_queue_status(?, ?)");
        $stmt->execute([$departmentId, $divisionId]);
        
        $queueStatus = $stmt->fetch(PDO::FETCH_ASSOC);

        sendResponse($queueStatus ?: [
            'total_tokens_issued' => 0,
            'tokens_served' => 0,
            'tokens_waiting' => 0,
            'tokens_cancelled' => 0,
            'average_service_time' => 15,
            'estimated_wait_time' => 0,
            'current_serving_token' => null,
            'last_called_token' => null,
            'active_tokens' => 0
        ]);

    } catch (Exception $e) {
        sendError(500, "Failed to get queue status", $e->getMessage());
    }
}

function handlePostRequest($db) {
    try {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            sendError(400, "Invalid JSON input");
        }

        $registryId = $input['registry_id'] ?? null;
        $departmentId = $input['department_id'] ?? null;
        $divisionId = $input['division_id'] ?? null;
        $serviceType = $input['service_type'] ?? 'General Service';
        $priorityLevel = $input['priority_level'] ?? 'normal';
        $createdBy = $input['created_by'] ?? null;

        if (!$registryId || !$departmentId || !$divisionId) {
            sendError(400, "Registry ID, Department ID, and Division ID are required");
        }

        // Validate priority level
        if (!in_array($priorityLevel, ['normal', 'urgent', 'vip'])) {
            sendError(400, "Invalid priority level");
        }

        $stmt = $db->prepare("CALL sp_generate_token(?, ?, ?, ?, ?, ?, @token_id, @token_number, @queue_position, @estimated_wait_time)");
        $stmt->execute([$registryId, $departmentId, $divisionId, $serviceType, $priorityLevel, $createdBy]);

        $result = $db->query("SELECT @token_id as token_id, @token_number as token_number, @queue_position as queue_position, @estimated_wait_time as estimated_wait_time")->fetch(PDO::FETCH_ASSOC);

        sendResponse([
            'token_id' => $result['token_id'],
            'token_number' => $result['token_number'],
            'queue_position' => (int)$result['queue_position'],
            'estimated_wait_time' => (int)$result['estimated_wait_time'],
            'status' => 'waiting',
            'priority_level' => $priorityLevel,
            'service_type' => $serviceType
        ], "Token generated successfully", 201);

    } catch (Exception $e) {
        sendError(500, "Failed to generate token", $e->getMessage());
    }
}

function handlePutRequest($db) {
    try {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            sendError(400, "Invalid JSON input");
        }

        $action = $input['action'] ?? 'update_status';
        $tokenId = $input['token_id'] ?? null;
        $staffId = $input['staff_id'] ?? null;

        if (!$tokenId) {
            sendError(400, "Token ID is required");
        }

        switch ($action) {
            case 'complete':
                $notes = $input['notes'] ?? '';
                $stmt = $db->prepare("CALL sp_complete_token(?, ?, ?)");
                $stmt->execute([$tokenId, $staffId, $notes]);
                sendResponse(['status' => 'served'], "Token completed successfully");
                break;

            case 'cancel':
                $reason = $input['reason'] ?? 'Cancelled by staff';
                $stmt = $db->prepare("CALL sp_cancel_token(?, ?, ?)");
                $stmt->execute([$tokenId, $staffId, $reason]);
                sendResponse(['status' => 'cancelled'], "Token cancelled successfully");
                break;

            case 'start_serving':
                $stmt = $db->prepare("
                    UPDATE service_tokens 
                    SET status = 'serving', 
                        serving_started_at = NOW(),
                        staff_id = ?,
                        updated_by = ?
                    WHERE id = ? AND status = 'called'
                ");
                $stmt->execute([$staffId, $staffId, $tokenId]);
                
                if ($stmt->rowCount() > 0) {
                    sendResponse(['status' => 'serving'], "Token service started");
                } else {
                    sendError(400, "Token not found or not in callable status");
                }
                break;

            default:
                sendError(400, "Invalid action");
        }

    } catch (Exception $e) {
        sendError(500, "Failed to update token", $e->getMessage());
    }
}

function handleDeleteRequest($db) {
    sendError(405, "Delete operation not supported for tokens");
}
?>
