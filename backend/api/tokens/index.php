
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

        // Check if service_tokens table exists
        $tableCheck = $db->query("SHOW TABLES LIKE 'service_tokens'");
        if ($tableCheck->rowCount() == 0) {
            // Return empty result if table doesn't exist
            sendResponse([
                'tokens' => [],
                'meta' => [
                    'total' => 0,
                    'limit' => $limit,
                    'offset' => $offset,
                    'date' => $date
                ]
            ]);
            return;
        }

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
                TIMESTAMPDIFF(MINUTE, st.created_at, NOW()) as total_wait_minutes
            FROM service_tokens st
            LEFT JOIN public_registry pr ON st.registry_id = pr.id
            LEFT JOIN departments d ON st.department_id = d.id
            LEFT JOIN divisions dv ON st.division_id = dv.id
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
        error_log("Error in getTokens: " . $e->getMessage());
        sendResponse([
            'tokens' => [],
            'meta' => [
                'total' => 0,
                'limit' => 50,
                'offset' => 0,
                'date' => date('Y-m-d')
            ]
        ]);
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

        // Check if stored procedure exists
        $procCheck = $db->query("SHOW PROCEDURE STATUS LIKE 'sp_call_next_token'");
        if ($procCheck->rowCount() > 0) {
            // Use stored procedure
            $stmt = $db->prepare("CALL sp_call_next_token(?, ?, ?, @token_id, @token_number)");
            $stmt->execute([$departmentId, $divisionId, $staffId]);

            $result = $db->query("SELECT @token_id as token_id, @token_number as token_number")->fetch(PDO::FETCH_ASSOC);
        } else {
            // Fallback implementation
            $result = callNextTokenFallback($db, $departmentId, $divisionId, $staffId);
        }

        if ($result && $result['token_id']) {
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
        error_log("Error in getNextToken: " . $e->getMessage());
        sendResponse([
            'token_id' => null,
            'token_number' => null,
            'message' => 'No tokens waiting in queue'
        ], "No tokens in queue");
    }
}

function callNextTokenFallback($db, $departmentId, $divisionId, $staffId) {
    try {
        // Get next waiting token
        $stmt = $db->prepare("
            SELECT id, token_number 
            FROM service_tokens 
            WHERE department_id = ? AND division_id = ? AND status = 'waiting'
            ORDER BY priority_level DESC, created_at ASC 
            LIMIT 1
        ");
        $stmt->execute([$departmentId, $divisionId]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($token) {
            // Update token status to called
            $updateStmt = $db->prepare("
                UPDATE service_tokens 
                SET status = 'called', called_at = NOW(), staff_id = ?
                WHERE id = ?
            ");
            $updateStmt->execute([$staffId, $token['id']]);
            
            return [
                'token_id' => $token['id'],
                'token_number' => $token['token_number']
            ];
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Error in callNextTokenFallback: " . $e->getMessage());
        return null;
    }
}

function getQueueStatus($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;

        if (!$departmentId || !$divisionId) {
            sendError(400, "Department ID and Division ID are required");
        }

        // Check if stored procedure exists
        $procCheck = $db->query("SHOW PROCEDURE STATUS LIKE 'sp_get_queue_status'");
        if ($procCheck->rowCount() > 0) {
            $stmt = $db->prepare("CALL sp_get_queue_status(?, ?)");
            $stmt->execute([$departmentId, $divisionId]);
            $queueStatus = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $queueStatus = getQueueStatusFallback($db, $departmentId, $divisionId);
        }

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
        error_log("Error in getQueueStatus: " . $e->getMessage());
        sendResponse([
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
    }
}

function getQueueStatusFallback($db, $departmentId, $divisionId) {
    try {
        $today = date('Y-m-d');
        
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_tokens_issued,
                SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) as tokens_served,
                SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as tokens_waiting,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as tokens_cancelled,
                AVG(CASE WHEN actual_service_time IS NOT NULL THEN actual_service_time ELSE 15 END) as average_service_time
            FROM service_tokens 
            WHERE department_id = ? AND division_id = ? AND DATE(created_at) = ?
        ");
        $stmt->execute([$departmentId, $divisionId, $today]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error in getQueueStatusFallback: " . $e->getMessage());
        return null;
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

        // Check if stored procedure exists
        $procCheck = $db->query("SHOW PROCEDURE STATUS LIKE 'sp_generate_token'");
        if ($procCheck->rowCount() > 0) {
            $stmt = $db->prepare("CALL sp_generate_token(?, ?, ?, ?, ?, ?, @token_id, @token_number, @queue_position, @estimated_wait_time)");
            $stmt->execute([$registryId, $departmentId, $divisionId, $serviceType, $priorityLevel, $createdBy]);

            $result = $db->query("SELECT @token_id as token_id, @token_number as token_number, @queue_position as queue_position, @estimated_wait_time as estimated_wait_time")->fetch(PDO::FETCH_ASSOC);
        } else {
            $result = generateTokenFallback($db, $registryId, $departmentId, $divisionId, $serviceType, $priorityLevel, $createdBy);
        }

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
        error_log("Error in handlePostRequest: " . $e->getMessage());
        sendError(500, "Failed to generate token", $e->getMessage());
    }
}

function generateTokenFallback($db, $registryId, $departmentId, $divisionId, $serviceType, $priorityLevel, $createdBy) {
    try {
        // Generate token number
        $today = date('Y-m-d');
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM service_tokens WHERE DATE(created_at) = ? AND department_id = ? AND division_id = ?");
        $stmt->execute([$today, $departmentId, $divisionId]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $tokenNumber = sprintf("D%d-V%d-%04d", $departmentId, $divisionId, $count + 1);
        $tokenId = generateUUID();
        
        // Insert token
        $insertStmt = $db->prepare("
            INSERT INTO service_tokens (id, token_number, registry_id, department_id, division_id, service_type, priority_level, queue_position, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insertStmt->execute([$tokenId, $tokenNumber, $registryId, $departmentId, $divisionId, $serviceType, $priorityLevel, $count + 1, $createdBy]);
        
        return [
            'token_id' => $tokenId,
            'token_number' => $tokenNumber,
            'queue_position' => $count + 1,
            'estimated_wait_time' => ($count + 1) * 15 // 15 minutes per token
        ];
    } catch (Exception $e) {
        error_log("Error in generateTokenFallback: " . $e->getMessage());
        throw $e;
    }
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
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
