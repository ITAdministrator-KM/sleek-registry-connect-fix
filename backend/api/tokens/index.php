
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

    // Verify authentication
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        throw new Exception("No authentication token provided", 401);
    }

    $token = $matches[1];
    // Validate JWT token (in production, use proper JWT library)
    list($payload, $signature) = explode('.', $token);
    $payload = json_decode(base64_decode($payload), true);
    
    if (!$payload || $payload['exp'] < time()) {
        throw new Exception("Token expired or invalid", 401);
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed", 500);
    }

    // Handle request
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

function getTokens($db) {
    try {
        // Get and validate date parameter
        $date = $_GET['date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new Exception("Invalid date format. Use YYYY-MM-DD", 400);
        }

        // Optional department and division filters
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;
        
        $query = "SELECT t.*, d.name as department_name, dv.name as division_name,
                         pu.name as public_user_name, pu.public_id
                  FROM tokens t 
                  LEFT JOIN departments d ON t.department_id = d.id 
                  LEFT JOIN divisions dv ON t.division_id = dv.id 
                  LEFT JOIN public_users pu ON t.public_user_id = pu.id
                  WHERE DATE(t.created_at) = :date";
        
        $params = [":date" => $date];

        if ($departmentId) {
            $query .= " AND t.department_id = :department_id";
            $params[":department_id"] = $departmentId;
        }

        if ($divisionId) {
            $query .= " AND t.division_id = :division_id";
            $params[":division_id"] = $divisionId;
        }
        
        $query .= " ORDER BY t.created_at DESC";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($tokens === false) {
            throw new Exception("Failed to fetch tokens");
        }

        // Group tokens by department and status for statistics
        $stats = [
            'total' => count($tokens),
            'by_status' => [],
            'by_department' => []
        ];

        foreach ($tokens as $token) {
            $stats['by_status'][$token['status']] = ($stats['by_status'][$token['status']] ?? 0) + 1;
            $stats['by_department'][$token['department_name']] = ($stats['by_department'][$token['department_name']] ?? 0) + 1;
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => $tokens,
            "meta" => [
                "date" => $date,
                "department_id" => $departmentId,
                "division_id" => $divisionId,
                "statistics" => $stats
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

function createToken($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->department_id) || !isset($data->division_id)) {
        http_response_code(400);
        echo json_encode(array("message" => "Department and division are required"));
        return;
    }
    
    try {
        // Get next token number for this department-division combination today
        $today = date('Y-m-d');
        $query = "SELECT COALESCE(MAX(token_number), 0) + 1 as next_number 
                  FROM tokens 
                  WHERE department_id = :department_id 
                  AND division_id = :division_id 
                  AND DATE(created_at) = :today";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        $stmt->bindParam(":today", $today);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $token_number = $result['next_number'];
        
        // Insert new token
        $insertQuery = "INSERT INTO tokens (token_number, department_id, division_id, public_user_id, status) 
                        VALUES (:token_number, :department_id, :division_id, :public_user_id, 'active')";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(":token_number", $token_number);
        $insertStmt->bindParam(":department_id", $data->department_id);
        $insertStmt->bindParam(":division_id", $data->division_id);
        $insertStmt->bindParam(":public_user_id", $data->public_user_id ?? null);
        
        if ($insertStmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "Token created successfully", 
                "token_number" => $token_number,
                "token_id" => $db->lastInsertId()
            ));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create token"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function updateToken($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id) || !isset($data->status)) {
        http_response_code(400);
        echo json_encode(array("message" => "Token ID and status are required"));
        return;
    }
    
    try {
        $query = "UPDATE tokens SET status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":status", $data->status);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Token updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update token"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
