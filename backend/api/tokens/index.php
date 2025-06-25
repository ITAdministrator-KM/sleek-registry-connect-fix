
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once '../config/database.php';

// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception('Database connection failed');
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Get action from query params or input
    $action = $_GET['action'] ?? $input['action'] ?? '';

    switch ($method) {
        case 'GET':
            handleGetRequest($db, $action);
            break;
        case 'POST':
            handlePostRequest($db, $input);
            break;
        case 'PUT':
            handlePutRequest($db, $input, $action);
            break;
        case 'DELETE':
            handleDeleteRequest($db);
            break;
        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    error_log("Token API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'action' => $action ?? 'none',
            'input' => $input ?? 'none'
        ]
    ]);
}

function handleGetRequest($db, $action) {
    switch ($action) {
        case 'list':
            getTokensList($db);
            break;
        case 'next':
            getNextToken($db);
            break;
        case 'queue':
            getQueueStatus($db);
            break;
        default:
            getAllTokens($db);
    }
}

function getAllTokens($db) {
    try {
        $query = "SELECT t.*, r.visitor_name, r.visitor_nic, r.purpose_of_visit,
                         d.name as department_name, div.name as division_name
                  FROM service_tokens t
                  LEFT JOIN public_registry r ON t.registry_id = r.id
                  LEFT JOIN departments d ON t.department_id = d.id
                  LEFT JOIN divisions div ON t.division_id = div.id
                  ORDER BY t.created_at DESC
                  LIMIT 100";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'data' => [
                'tokens' => $tokens,
                'meta' => [
                    'total' => count($tokens),
                    'limit' => 100,
                    'offset' => 0,
                    'date' => date('Y-m-d')
                ]
            ]
        ]);
    } catch (Exception $e) {
        throw new Exception('Failed to fetch tokens: ' . $e->getMessage());
    }
}

function getTokensList($db) {
    try {
        $department_id = $_GET['department_id'] ?? null;
        $division_id = $_GET['division_id'] ?? null;
        $date = $_GET['date'] ?? date('Y-m-d');
        $status = $_GET['status'] ?? null;
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);

        $whereConditions = ["DATE(t.created_at) = :date"];
        $params = ['date' => $date];

        if ($department_id) {
            $whereConditions[] = "t.department_id = :department_id";
            $params['department_id'] = $department_id;
        }

        if ($division_id) {
            $whereConditions[] = "t.division_id = :division_id";
            $params['division_id'] = $division_id;
        }

        if ($status) {
            $whereConditions[] = "t.status = :status";
            $params['status'] = $status;
        }

        $whereClause = implode(' AND ', $whereConditions);

        $query = "SELECT t.*, r.visitor_name, r.visitor_nic, r.purpose_of_visit,
                         d.name as department_name, div.name as division_name
                  FROM service_tokens t
                  LEFT JOIN public_registry r ON t.registry_id = r.id
                  LEFT JOIN departments d ON t.department_id = d.id
                  LEFT JOIN divisions div ON t.division_id = div.id
                  WHERE $whereClause
                  ORDER BY t.created_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM service_tokens t WHERE $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(":$key", $value);
        }
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        echo json_encode([
            'status' => 'success',
            'data' => [
                'tokens' => $tokens,
                'meta' => [
                    'total' => intval($totalCount),
                    'limit' => $limit,
                    'offset' => $offset,
                    'date' => $date
                ]
            ]
        ]);
    } catch (Exception $e) {
        throw new Exception('Failed to fetch tokens list: ' . $e->getMessage());
    }
}

function getNextToken($db) {
    try {
        $department_id = $_GET['department_id'] ?? null;
        $division_id = $_GET['division_id'] ?? null;
        $staff_id = $_GET['staff_id'] ?? null;

        if (!$department_id || !$division_id || !$staff_id) {
            throw new Exception('Missing required parameters: department_id, division_id, staff_id');
        }

        // Get next waiting token
        $query = "SELECT t.*, r.visitor_name, r.visitor_nic, r.purpose_of_visit
                  FROM service_tokens t
                  LEFT JOIN public_registry r ON t.registry_id = r.id
                  WHERE t.department_id = :department_id 
                  AND t.division_id = :division_id 
                  AND t.status = 'waiting'
                  AND DATE(t.created_at) = CURDATE()
                  ORDER BY t.queue_position ASC, t.created_at ASC
                  LIMIT 1";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':department_id', $department_id);
        $stmt->bindParam(':division_id', $division_id);
        $stmt->execute();

        $token = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($token) {
            // Update token status to 'called'
            $updateQuery = "UPDATE service_tokens 
                           SET status = 'called', 
                               called_at = NOW(), 
                               staff_id = :staff_id
                           WHERE id = :token_id";
            
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':staff_id', $staff_id);
            $updateStmt->bindParam(':token_id', $token['id']);
            $updateStmt->execute();

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'token_id' => $token['id'],
                    'token_number' => $token['token_number'],
                    'status' => 'called',
                    'visitor_name' => $token['visitor_name'],
                    'message' => 'Token called successfully'
                ]
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'token_id' => null,
                    'token_number' => null,
                    'status' => 'no_tokens',
                    'message' => 'No waiting tokens found'
                ]
            ]);
        }
    } catch (Exception $e) {
        throw new Exception('Failed to get next token: ' . $e->getMessage());
    }
}

function getQueueStatus($db) {
    try {
        $department_id = $_GET['department_id'] ?? null;
        $division_id = $_GET['division_id'] ?? null;

        if (!$department_id || !$division_id) {
            throw new Exception('Missing required parameters: department_id, division_id');
        }

        $today = date('Y-m-d');

        // Get queue statistics
        $query = "SELECT 
                    COUNT(*) as total_tokens_issued,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tokens_served,
                    SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as tokens_waiting,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as tokens_cancelled,
                    SUM(CASE WHEN status IN ('waiting', 'called', 'serving') THEN 1 ELSE 0 END) as active_tokens,
                    AVG(CASE WHEN status = 'completed' AND actual_service_time > 0 
                        THEN actual_service_time ELSE NULL END) as average_service_time
                  FROM service_tokens 
                  WHERE department_id = :department_id 
                  AND division_id = :division_id 
                  AND DATE(created_at) = :today";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':department_id', $department_id);
        $stmt->bindParam(':division_id', $division_id);
        $stmt->bindParam(':today', $today);
        $stmt->execute();

        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get current serving token
        $servingQuery = "SELECT token_number FROM service_tokens 
                        WHERE department_id = :department_id 
                        AND division_id = :division_id 
                        AND status = 'serving'
                        AND DATE(created_at) = :today
                        ORDER BY serving_started_at DESC LIMIT 1";
        
        $servingStmt = $db->prepare($servingQuery);
        $servingStmt->bindParam(':department_id', $department_id);
        $servingStmt->bindParam(':division_id', $division_id);
        $servingStmt->bindParam(':today', $today);
        $servingStmt->execute();
        $currentServing = $servingStmt->fetch(PDO::FETCH_ASSOC);

        // Calculate estimated wait time
        $avgServiceTime = floatval($stats['average_service_time'] ?: 15); // Default 15 minutes
        $waitingTokens = intval($stats['tokens_waiting']);
        $estimatedWaitTime = $waitingTokens * $avgServiceTime;

        echo json_encode([
            'status' => 'success',
            'data' => [
                'total_tokens_issued' => intval($stats['total_tokens_issued']),
                'tokens_served' => intval($stats['tokens_served']),
                'tokens_waiting' => intval($stats['tokens_waiting']),
                'tokens_cancelled' => intval($stats['tokens_cancelled']),
                'active_tokens' => intval($stats['active_tokens']),
                'average_service_time' => round($avgServiceTime, 1),
                'estimated_wait_time' => round($estimatedWaitTime, 0),
                'current_serving_token' => $currentServing['token_number'] ?? null
            ]
        ]);
    } catch (Exception $e) {
        throw new Exception('Failed to get queue status: ' . $e->getMessage());
    }
}

function handlePostRequest($db, $input) {
    try {
        if (!$input) {
            throw new Exception('No input data provided');
        }

        $registry_id = $input['registry_id'] ?? null;
        $department_id = $input['department_id'] ?? null;
        $division_id = $input['division_id'] ?? null;
        $service_type = $input['service_type'] ?? 'General Service';
        $priority_level = $input['priority_level'] ?? 'normal';
        $created_by = $input['created_by'] ?? null;

        if (!$registry_id || !$department_id || !$division_id) {
            throw new Exception('Missing required fields: registry_id, department_id, division_id');
        }

        // Generate token number
        $tokenNumber = generateTokenNumber($db, $department_id, $division_id);
        
        // Get queue position
        $queuePosition = getNextQueuePosition($db, $department_id, $division_id);
        
        // Calculate estimated wait time
        $estimatedWaitTime = calculateWaitTime($db, $department_id, $division_id, $queuePosition);

        // Insert new token
        $insertQuery = "INSERT INTO service_tokens (
                            id, registry_id, token_number, department_id, division_id,
                            service_type, queue_position, status, priority_level,
                            estimated_service_time, wait_time_minutes, created_by, created_at
                        ) VALUES (
                            UUID(), :registry_id, :token_number, :department_id, :division_id,
                            :service_type, :queue_position, 'waiting', :priority_level,
                            15, :wait_time_minutes, :created_by, NOW()
                        )";

        $stmt = $db->prepare($insertQuery);
        $stmt->bindParam(':registry_id', $registry_id);
        $stmt->bindParam(':token_number', $tokenNumber);
        $stmt->bindParam(':department_id', $department_id);
        $stmt->bindParam(':division_id', $division_id);
        $stmt->bindParam(':service_type', $service_type);
        $stmt->bindParam(':queue_position', $queuePosition);
        $stmt->bindParam(':priority_level', $priority_level);
        $stmt->bindParam(':wait_time_minutes', $estimatedWaitTime);
        $stmt->bindParam(':created_by', $created_by);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to create token');
        }

        echo json_encode([
            'status' => 'success',
            'data' => [
                'token_id' => $db->lastInsertId(),
                'token_number' => $tokenNumber,
                'queue_position' => $queuePosition,
                'estimated_wait_time' => $estimatedWaitTime,
                'status' => 'waiting',
                'priority_level' => $priority_level,
                'service_type' => $service_type
            ]
        ]);
    } catch (Exception $e) {
        throw new Exception('Failed to generate token: ' . $e->getMessage());
    }
}

function handlePutRequest($db, $input, $action) {
    try {
        switch ($action) {
            case 'complete':
                completeToken($db, $input);
                break;
            case 'cancel':
                cancelToken($db, $input);
                break;
            case 'start_serving':
                startServingToken($db, $input);
                break;
            default:
                throw new Exception('Invalid action for PUT request');
        }
    } catch (Exception $e) {
        throw new Exception('PUT request failed: ' . $e->getMessage());
    }
}

function completeToken($db, $input) {
    $token_id = $input['token_id'] ?? null;
    $staff_id = $input['staff_id'] ?? null;
    $notes = $input['notes'] ?? '';

    if (!$token_id || !$staff_id) {
        throw new Exception('Missing required fields: token_id, staff_id');
    }

    $query = "UPDATE service_tokens 
              SET status = 'completed', 
                  served_at = NOW(),
                  staff_id = :staff_id,
                  notes = :notes,
                  actual_service_time = TIMESTAMPDIFF(MINUTE, serving_started_at, NOW())
              WHERE id = :token_id AND status = 'serving'";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':token_id', $token_id);
    $stmt->bindParam(':staff_id', $staff_id);
    $stmt->bindParam(':notes', $notes);
    
    if ($stmt->execute() && $stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'data' => ['status' => 'completed']
        ]);
    } else {
        throw new Exception('Token not found or not in serving status');
    }
}

function cancelToken($db, $input) {
    $token_id = $input['token_id'] ?? null;
    $staff_id = $input['staff_id'] ?? null;
    $reason = $input['reason'] ?? 'Cancelled by staff';

    if (!$token_id || !$staff_id) {
        throw new Exception('Missing required fields: token_id, staff_id');
    }

    $query = "UPDATE service_tokens 
              SET status = 'cancelled', 
                  cancelled_at = NOW(),
                  staff_id = :staff_id,
                  notes = :reason
              WHERE id = :token_id AND status IN ('waiting', 'called')";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':token_id', $token_id);
    $stmt->bindParam(':staff_id', $staff_id);
    $stmt->bindParam(':reason', $reason);
    
    if ($stmt->execute() && $stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'data' => ['status' => 'cancelled']
        ]);
    } else {
        throw new Exception('Token not found or cannot be cancelled');
    }
}

function startServingToken($db, $input) {
    $token_id = $input['token_id'] ?? null;
    $staff_id = $input['staff_id'] ?? null;

    if (!$token_id || !$staff_id) {
        throw new Exception('Missing required fields: token_id, staff_id');
    }

    $query = "UPDATE service_tokens 
              SET status = 'serving', 
                  serving_started_at = NOW(),
                  staff_id = :staff_id
              WHERE id = :token_id AND status = 'called'";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':token_id', $token_id);
    $stmt->bindParam(':staff_id', $staff_id);
    
    if ($stmt->execute() && $stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'data' => ['status' => 'serving']
        ]);
    } else {
        throw new Exception('Token not found or not in called status');
    }
}

function handleDeleteRequest($db) {
    throw new Exception('Delete operation not implemented for tokens');
}

// Helper functions
function generateTokenNumber($db, $department_id, $division_id) {
    // Get department and division codes
    $query = "SELECT d.code as dept_code, div.code as div_code 
              FROM departments d, divisions div 
              WHERE d.id = :dept_id AND div.id = :div_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dept_id', $department_id);
    $stmt->bindParam(':div_id', $division_id);
    $stmt->execute();
    
    $codes = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $deptCode = $codes['dept_code'] ?? 'DEPT';
    $divCode = $codes['div_code'] ?? 'DIV';
    
    // Get next sequence number for today
    $today = date('Y-m-d');
    $countQuery = "SELECT COUNT(*) + 1 as next_seq 
                   FROM service_tokens 
                   WHERE department_id = :dept_id 
                   AND division_id = :div_id 
                   AND DATE(created_at) = :today";
    
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':dept_id', $department_id);
    $countStmt->bindParam(':div_id', $division_id);
    $countStmt->bindParam(':today', $today);
    $countStmt->execute();
    
    $sequence = $countStmt->fetch(PDO::FETCH_ASSOC)['next_seq'];
    
    return sprintf('%s-%s-%04d', $deptCode, $divCode, $sequence);
}

function getNextQueuePosition($db, $department_id, $division_id) {
    $query = "SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position 
              FROM service_tokens 
              WHERE department_id = :dept_id 
              AND division_id = :div_id 
              AND DATE(created_at) = CURDATE()
              AND status IN ('waiting', 'called', 'serving')";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dept_id', $department_id);
    $stmt->bindParam(':div_id', $division_id);
    $stmt->execute();
    
    return intval($stmt->fetch(PDO::FETCH_ASSOC)['next_position']);
}

function calculateWaitTime($db, $department_id, $division_id, $queue_position) {
    $query = "SELECT AVG(actual_service_time) as avg_time 
              FROM service_tokens 
              WHERE department_id = :dept_id 
              AND division_id = :div_id 
              AND status = 'completed'
              AND actual_service_time > 0
              AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dept_id', $department_id);
    $stmt->bindParam(':div_id', $division_id);
    $stmt->execute();
    
    $avgTime = floatval($stmt->fetch(PDO::FETCH_ASSOC)['avg_time'] ?: 15);
    
    return round(($queue_position - 1) * $avgTime);
}
?>
