
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
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Public Users API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getPublicUsers($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            // Get specific public user
            $query = "SELECT pu.*, d.name as department_name, `div`.name as division_name,
                            qr.qr_code_data, qr.qr_code_url
                     FROM public_users pu 
                     LEFT JOIN departments d ON pu.department_id = d.id 
                     LEFT JOIN divisions `div` ON pu.division_id = `div`.id 
                     LEFT JOIN qr_codes qr ON pu.id = qr.public_user_id
                     WHERE pu.id = ? AND pu.status = 'active'";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                sendError(404, "Public user not found");
                return;
            }
            
            // Remove sensitive data
            unset($user['password_hash']);
            
            sendResponse($user, "Public user retrieved successfully");
        } else {
            // Get all public users
            $query = "SELECT pu.*, d.name as department_name, `div`.name as division_name,
                            qr.qr_code_data, qr.qr_code_url
                     FROM public_users pu 
                     LEFT JOIN departments d ON pu.department_id = d.id 
                     LEFT JOIN divisions `div` ON pu.division_id = `div`.id 
                     LEFT JOIN qr_codes qr ON pu.id = qr.public_user_id
                     WHERE pu.status = 'active' 
                     ORDER BY pu.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Remove sensitive data from all users
            foreach ($users as &$user) {
                unset($user['password_hash']);
            }
            
            sendResponse($users, "Public users retrieved successfully");
        }
    } catch (Exception $e) {
        error_log("Get public users error: " . $e->getMessage());
        sendError(500, "Failed to fetch public users: " . $e->getMessage());
    }
}

function createPublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input);
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        // Validate required fields
        $requiredFields = ['name', 'nic', 'address', 'mobile', 'email', 'username'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty(trim($data->$field))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Validate email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            sendError(400, "Invalid email format");
            return;
        }
        
        // Validate NIC format (basic validation)
        if (!preg_match('/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/', $data->nic)) {
            sendError(400, "Invalid NIC format");
            return;
        }
        
        // Check for existing username, email, or NIC
        $stmt = $db->prepare("SELECT COUNT(*) FROM public_users WHERE username = ? OR email = ? OR nic = ?");
        $stmt->execute([$data->username, $data->email, $data->nic]);
        
        if ($stmt->fetchColumn() > 0) {
            sendError(409, "Username, email, or NIC already exists");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Generate public_id
        $public_id = generatePublicId($db);
        
        // Hash password if provided
        $password_hash = null;
        if (isset($data->password) && !empty($data->password)) {
            $password_hash = password_hash($data->password, PASSWORD_ARGON2ID);
        }
        
        $query = "INSERT INTO public_users (public_user_id, name, nic, address, mobile, email, username, password_hash, department_id, division_id, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";
        
        $stmt = $db->prepare($query);
        $params = [
            $public_id,
            $data->name,
            $data->nic,
            $data->address,
            $data->mobile,
            $data->email,
            $data->username,
            $password_hash,
            (isset($data->department_id) && !empty($data->department_id)) ? $data->department_id : null,
            (isset($data->division_id) && !empty($data->division_id)) ? $data->division_id : null
        ];
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to create public user");
        }
        
        $userId = $db->lastInsertId();
        
        // Generate QR code data
        $qrData = json_encode([
            'public_id' => $public_id,
            'name' => $data->name,
            'nic' => $data->nic,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        // Store QR code in database
        $qrQuery = "INSERT INTO qr_codes (public_user_id, qr_code_data, qr_code_url) VALUES (?, ?, ?)";
        $qrStmt = $db->prepare($qrQuery);
        $qrUrl = "https://dskalmunai.lk/qr-scan/" . $public_id;
        $qrStmt->execute([$userId, $qrData, $qrUrl]);
        
        // Commit transaction
        $db->commit();
        
        sendResponse([
            "public_id" => $public_id,
            "id" => $userId,
            "qr_code_data" => $qrData,
            "qr_code_url" => $qrUrl
        ], "Public user created successfully with QR code");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create public user error: " . $e->getMessage());
        sendError(500, "Failed to create public user: " . $e->getMessage());
    }
}

function generatePublicId($db) {
    $year = date('Y');
    $prefix = 'PUB' . substr($year, -2);
    
    // Get the last ID for this year
    $stmt = $db->prepare("SELECT public_user_id FROM public_users WHERE public_user_id LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $lastId = $stmt->fetchColumn();
    
    if ($lastId) {
        $lastNumber = intval(substr($lastId, -4));
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
}

function updatePublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "Public user ID is required");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Check if user exists
        $stmt = $db->prepare("SELECT id, public_user_id FROM public_users WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Public user not found");
            return;
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'nic', 'address', 'mobile', 'email', 'username', 'department_id', 'division_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($data->$field)) {
                if ($field === 'email' && !filter_var($data->$field, FILTER_VALIDATE_EMAIL)) {
                    sendError(400, "Invalid email format");
                    return;
                }
                
                $updateFields[] = "$field = ?";
                $params[] = $data->$field;
            }
        }
        
        if (isset($data->password) && !empty($data->password)) {
            $updateFields[] = "password_hash = ?";
            $params[] = password_hash($data->password, PASSWORD_ARGON2ID);
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE public_users SET " . implode(", ", $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $params[] = $data->id;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $db->commit();
        sendResponse(["id" => $data->id], "Public user updated successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update public user error: " . $e->getMessage());
        sendError(500, "Failed to update public user: " . $e->getMessage());
    }
}

function deletePublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "Public user ID is required");
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM public_users WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Public user not found or already deleted");
            return;
        }
        
        // Soft delete
        $query = "UPDATE public_users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data->id]);
        
        $db->commit();
        sendResponse(["id" => $data->id], "Public user deleted successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete public user error: " . $e->getMessage());
        sendError(500, "Failed to delete public user: " . $e->getMessage());
    }
}
?>
