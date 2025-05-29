
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Server error",
        "details" => $e->getMessage()
    ));
}

function getPublicUsers($db) {
    try {
        $query = "SELECT pu.*, d.name as department_name, dv.name as division_name 
                  FROM public_users pu 
                  LEFT JOIN departments d ON pu.department_id = d.id 
                  LEFT JOIN divisions dv ON pu.division_id = dv.id 
                  WHERE pu.status = 'active' 
                  ORDER BY pu.created_at DESC";
        
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($users === false) {
            throw new Exception("Failed to fetch results");
        }
        
        http_response_code(200);
        echo json_encode(array(
            "status" => "success",
            "data" => $users
        ));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array(
            "status" => "error",
            "message" => "Database error",
            "details" => $e->getMessage()
        ));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array(
            "status" => "error",
            "message" => "Server error",
            "details" => $e->getMessage()
        ));
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
        
        // Use bindValue instead of bindParam to avoid reference issues
        $stmt->bindValue(":public_id", $public_id);
        $stmt->bindValue(":name", $data->name);
        $stmt->bindValue(":nic", $data->nic);
        $stmt->bindValue(":address", $data->address);
        $stmt->bindValue(":mobile", $data->mobile);
        $stmt->bindValue(":email", $data->email ?? null);
        $stmt->bindValue(":department_id", $data->department_id ?? null);
        $stmt->bindValue(":division_id", $data->division_id ?? null);
        
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
        
        // Use bindValue instead of bindParam
        $stmt->bindValue(":id", $data->id);
        $stmt->bindValue(":name", $data->name);
        $stmt->bindValue(":nic", $data->nic);
        $stmt->bindValue(":address", $data->address);
        $stmt->bindValue(":mobile", $data->mobile);
        $stmt->bindValue(":email", $data->email);
        $stmt->bindValue(":department_id", $data->department_id);
        $stmt->bindValue(":division_id", $data->division_id);
        
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
        $stmt->bindValue(":id", $id);
        
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
