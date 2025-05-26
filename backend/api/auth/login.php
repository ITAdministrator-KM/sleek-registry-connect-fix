
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password) || !isset($data->role)) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing required fields"));
    exit();
}

try {
    $query = "SELECT id, user_id, name, username, password, role, email, department_id, division_id, status 
              FROM users 
              WHERE username = :username AND role = :role AND status = 'active'";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->bindParam(":role", $data->role);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($data->password, $user['password'])) {
            unset($user['password']); // Remove password from response
            
            // Generate a simple session token (in production, use proper JWT)
            $token = base64_encode($user['id'] . ':' . time() . ':' . $user['role']);
            
            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful",
                "user" => $user,
                "token" => $token
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Invalid credentials"));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "User not found or invalid role"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Internal server error: " . $e->getMessage()));
}
?>
