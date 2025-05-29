
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

function generateQRCode($data) {
    // Use chillerlan/php-qrcode library
    require_once '../../vendor/autoload.php';
    
    $options = new \chillerlan\QRCode\QROptions([
        'outputType' => \chillerlan\QRCode\QRCode::OUTPUT_IMAGE_PNG,
        'eccLevel' => \chillerlan\QRCode\QRCode::ECC_L,
        'scale' => 5,
        'imageBase64' => true,
    ]);
    
    $qrcode = new \chillerlan\QRCode\QRCode($options);
    
    return $qrcode->render(json_encode($data));
}

function sendResponse($status, $data = null, $message = null) {
    http_response_code($status);
    echo json_encode([
        'status' => $status >= 200 && $status < 300 ? 'success' : 'error',
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendResponse(500, null, "Database connection failed");
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['id'])) {
                getPublicUserById($db, $_GET['id']);
            } else {
                getPublicUsers($db);
            }
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
            sendResponse(405, null, "Method not allowed");
    }
} catch (Exception $e) {
    sendResponse(500, null, $e->getMessage());
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
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to fetch public users");
        }
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Remove sensitive data
        foreach ($users as &$user) {
            unset($user['password_hash']);
        }
        
        sendResponse(200, $users);
    } catch (Exception $e) {
        sendResponse(500, null, $e->getMessage());
    }
}

function getPublicUserById($db, $id) {
    try {
        $query = "SELECT pu.*, d.name as department_name, dv.name as division_name 
                  FROM public_users pu 
                  LEFT JOIN departments d ON pu.department_id = d.id 
                  LEFT JOIN divisions dv ON pu.division_id = dv.id 
                  WHERE pu.id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to fetch public user");
        }
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            sendResponse(404, null, "User not found");
        }
        
        // Remove sensitive data
        unset($user['password_hash']);
        
        sendResponse(200, $user);
    } catch (Exception $e) {
        sendResponse(500, null, $e->getMessage());
    }
}

function createPublicUser($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->name) || !isset($data->nic) || !isset($data->address) || 
            !isset($data->mobile) || !isset($data->email) || !isset($data->username) || 
            !isset($data->password)) {
            throw new Exception("All required fields must be provided", 400);
        }
        
        $db->beginTransaction();
        
        // Generate next public_id
        $stmt = $db->query("SELECT MAX(CAST(SUBSTRING(public_id, 4) AS UNSIGNED)) as max_id FROM public_users WHERE public_id REGEXP '^PUB[0-9]+$'");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nextId = ($result['max_id'] ?? 0) + 1;
        $publicId = 'PUB' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
        
        // Generate QR code data
        $qrData = [
            'public_id' => $publicId,
            'name' => $data->name,
            'nic' => $data->nic,
            'mobile' => $data->mobile,
            'timestamp' => time()
        ];
        
        $qrCode = generateQRCode($qrData);
        
        // Hash password using Argon2id
        $passwordHash = password_hash($data->password, PASSWORD_ARGON2ID);
        
        $query = "INSERT INTO public_users (
            public_id, name, nic, address, mobile, email, username, password_hash,
            qr_code, department_id, division_id, status
        ) VALUES (
            :public_id, :name, :nic, :address, :mobile, :email, :username, :password_hash,
            :qr_code, :department_id, :division_id, 'active'
        )";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindValue(':public_id', $publicId);
        $stmt->bindValue(':name', $data->name);
        $stmt->bindValue(':nic', $data->nic);
        $stmt->bindValue(':address', $data->address);
        $stmt->bindValue(':mobile', $data->mobile);
        $stmt->bindValue(':email', $data->email);
        $stmt->bindValue(':username', $data->username);
        $stmt->bindValue(':password_hash', $passwordHash);
        $stmt->bindValue(':qr_code', $qrCode);
        $stmt->bindValue(':department_id', isset($data->department_id) ? $data->department_id : null);
        $stmt->bindValue(':division_id', isset($data->division_id) ? $data->division_id : null);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create public user");
        }
        
        $userId = $db->lastInsertId();
        $db->commit();
        
        // Fetch created user
        $query = "SELECT * FROM public_users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $userId);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        unset($user['password_hash']);
        
        sendResponse(201, $user);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        sendResponse(500, null, $e->getMessage());
    }
}

function updatePublicUser($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id)) {
            throw new Exception("User ID is required", 400);
        }
        
        $db->beginTransaction();
        
        $updates = [];
        $params = [':id' => $data->id];
        
        // Build dynamic update query
        if (isset($data->name)) {
            $updates[] = "name = :name";
            $params[':name'] = $data->name;
        }
        if (isset($data->nic)) {
            $updates[] = "nic = :nic";
            $params[':nic'] = $data->nic;
        }
        if (isset($data->address)) {
            $updates[] = "address = :address";
            $params[':address'] = $data->address;
        }
        if (isset($data->mobile)) {
            $updates[] = "mobile = :mobile";
            $params[':mobile'] = $data->mobile;
        }
        if (isset($data->email)) {
            $updates[] = "email = :email";
            $params[':email'] = $data->email;
        }
        if (isset($data->username)) {
            $updates[] = "username = :username";
            $params[':username'] = $data->username;
        }
        if (isset($data->password)) {
            $updates[] = "password_hash = :password_hash";
            $params[':password_hash'] = password_hash($data->password, PASSWORD_ARGON2ID);
        }
        if (isset($data->department_id)) {
            $updates[] = "department_id = :department_id";
            $params[':department_id'] = $data->department_id;
        }
        if (isset($data->division_id)) {
            $updates[] = "division_id = :division_id";
            $params[':division_id'] = $data->division_id;
        }
        if (isset($data->status)) {
            $updates[] = "status = :status";
            $params[':status'] = $data->status;
        }
        
        if (empty($updates)) {
            throw new Exception("No fields to update", 400);
        }
        
        $query = "UPDATE public_users SET " . implode(", ", $updates) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to update public user");
        }
        
        $db->commit();
        
        // Fetch updated user
        $query = "SELECT pu.*, d.name as department_name, dv.name as division_name 
                  FROM public_users pu 
                  LEFT JOIN departments d ON pu.department_id = d.id 
                  LEFT JOIN divisions dv ON pu.division_id = dv.id 
                  WHERE pu.id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $data->id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        unset($user['password_hash']);
        
        sendResponse(200, $user);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        sendResponse(500, null, $e->getMessage());
    }
}

function deletePublicUser($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id)) {
            throw new Exception("User ID is required", 400);
        }
        
        $query = "UPDATE public_users SET status = 'inactive' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $data->id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete public user");
        }
        
        sendResponse(200, null, "User deleted successfully");
    } catch (Exception $e) {
        sendResponse(500, null, $e->getMessage());
    }
}
?>
