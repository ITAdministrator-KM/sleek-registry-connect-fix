
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getPublicUsers($db);
        break;
    case 'POST':
        createPublicUser($db);
        break;
    case 'PUT':
        updatePublicUser($db);
        break;
    case 'DELETE':
        deletePublicUser($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getPublicUsers($db) {
    try {
        $query = "SELECT pu.*, d.name as department_name, div.name as division_name 
                  FROM public_users pu 
                  LEFT JOIN departments d ON pu.department_id = d.id 
                  LEFT JOIN divisions div ON pu.division_id = div.id 
                  WHERE pu.status = 'active' 
                  ORDER BY pu.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($users);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function createPublicUser($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name) || !isset($data->nic) || !isset($data->address) || !isset($data->mobile)) {
        http_response_code(400);
        echo json_encode(array("message" => "All required fields must be provided"));
        return;
    }
    
    try {
        // Generate public_id
        $public_id = generatePublicId();
        
        $query = "INSERT INTO public_users (public_id, name, nic, address, mobile, email, department_id, division_id) 
                  VALUES (:public_id, :name, :nic, :address, :mobile, :email, :department_id, :division_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":public_id", $public_id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nic", $data->nic);
        $stmt->bindParam(":address", $data->address);
        $stmt->bindParam(":mobile", $data->mobile);
        $stmt->bindParam(":email", $data->email ?? null);
        $stmt->bindParam(":department_id", $data->department_id ?? null);
        $stmt->bindParam(":division_id", $data->division_id ?? null);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Public user created successfully", "public_id" => $public_id));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create public user"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function generatePublicId() {
    $timestamp = time();
    $random = rand(100, 999);
    return 'PUB' . substr($timestamp, -4) . $random;
}

function updatePublicUser($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(array("message" => "Public user ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE public_users SET name = :name, nic = :nic, address = :address, mobile = :mobile, email = :email, department_id = :department_id, division_id = :division_id WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nic", $data->nic);
        $stmt->bindParam(":address", $data->address);
        $stmt->bindParam(":mobile", $data->mobile);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Public user updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update public user"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function deletePublicUser($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "Public user ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE public_users SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Public user deleted successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to delete public user"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
