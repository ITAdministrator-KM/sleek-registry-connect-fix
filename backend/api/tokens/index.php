
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

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
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getTokens($db) {
    try {
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $query = "SELECT t.*, d.name as department_name, dv.name as division_name 
                  FROM tokens t 
                  LEFT JOIN departments d ON t.department_id = d.id 
                  LEFT JOIN divisions dv ON t.division_id = dv.id 
                  WHERE DATE(t.created_at) = :date 
                  ORDER BY t.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($tokens);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
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
