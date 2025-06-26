
<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        error_log("Database connection failed in public-users API");
        sendError(500, "Database connection failed");
        exit;
    }

    // Log the request method and data for debugging
    error_log("Public Users API - Method: " . $_SERVER['REQUEST_METHOD']);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents("php://input");
        error_log("Public Users API - POST data: " . $input);
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
    error_log("Stack trace: " . $e->getTraceAsString());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function generateSequentialPublicId($db) {
    try {
        // Get the last sequential number
        $stmt = $db->prepare("SELECT public_user_id FROM public_users WHERE public_user_id LIKE 'PUB%' ORDER BY CAST(SUBSTRING(public_user_id, 4) AS UNSIGNED) DESC LIMIT 1");
        $stmt->execute();
        $lastId = $stmt->fetchColumn();
        
        if ($lastId) {
            $lastNumber = intval(substr($lastId, 3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return 'PUB' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        error_log("Generate ID error: " . $e->getMessage());
        return 'PUB' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
    }
}

function getPublicUsers($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            $query = "SELECT pu.*, d.name as department_name, `div`.name as division_name
                     FROM public_users pu 
                     LEFT JOIN departments d ON pu.department_id = d.id 
                     LEFT JOIN divisions `div` ON pu.division_id = `div`.id 
                     WHERE pu.id = ? AND pu.status = 'active'";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                sendError(404, "Public user not found");
                return;
            }
            
            unset($user['password_hash']);
            sendResponse($user, "Public user retrieved successfully");
        } else {
            $query = "SELECT pu.*, d.name as department_name, `div`.name as division_name
                     FROM public_users pu 
                     LEFT JOIN departments d ON pu.department_id = d.id 
                     LEFT JOIN divisions `div` ON pu.division_id = `div`.id 
                     WHERE pu.status = 'active' 
                     ORDER BY pu.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($users as &$user) {
                unset($user['password_hash']);
                // Add missing fields for compatibility
                if (!isset($user['public_id'])) {
                    $user['public_id'] = $user['public_user_id'];
                }
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
            error_log("Empty request body in createPublicUser");
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input, true);
        if (!$data) {
            error_log("Invalid JSON data in createPublicUser: " . json_last_error_msg());
            sendError(400, "Invalid JSON data: " . json_last_error_msg());
            return;
        }
        
        error_log("Creating public user with data: " . print_r($data, true));
        
        // Check required fields
        $requiredFields = ['name', 'nic', 'mobile'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                error_log("Missing required field: $field");
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Set default values
        $address = isset($data['address']) ? trim($data['address']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $username = isset($data['username']) ? trim($data['username']) : '';
        
        // Generate username if not provided
        if (empty($username)) {
            $username = 'user_' . time() . '_' . rand(100, 999);
        }
        
        // Validate NIC format
        $nic = trim($data['nic']);
        if (!preg_match('/^([0-9]{9}[vVxX]|[0-9]{12})$/', $nic)) {
            error_log("Invalid NIC format: $nic");
            sendError(400, "Invalid NIC format. Use 9 digits followed by V/X or 12 digits");
            return;
        }
        
        // Check for existing NIC
        $stmt = $db->prepare("SELECT COUNT(*) FROM public_users WHERE nic = ? AND status = 'active'");
        $stmt->execute([$nic]);
        
        if ($stmt->fetchColumn() > 0) {
            error_log("NIC already exists: $nic");
            sendError(409, "NIC already exists");
            return;
        }
        
        // Check for existing username if provided
        if (!empty($username)) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM public_users WHERE username = ? AND status = 'active'");
            $stmt->execute([$username]);
            
            if ($stmt->fetchColumn() > 0) {
                $username = $username . '_' . time();
            }
        }
        
        $db->beginTransaction();
        
        // Generate sequential public_id
        $public_id = generateSequentialPublicId($db);
        error_log("Generated public ID: $public_id");
        
        // Hash password
        $password = isset($data['password']) ? $data['password'] : 'changeme123';
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO public_users (public_user_id, name, nic, address, mobile, email, username, password_hash, department_id, division_id, status, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())";
        
        $params = [
            $public_id,
            trim($data['name']),
            $nic,
            $address,
            trim($data['mobile']),
            $email,
            $username,
            $password_hash,
            !empty($data['department_id']) ? intval($data['department_id']) : null,
            !empty($data['division_id']) ? intval($data['division_id']) : null
        ];
        
        error_log("Executing query with params: " . print_r($params, true));
        
        $stmt = $db->prepare($query);
        if (!$stmt->execute($params)) {
            $errorInfo = $stmt->errorInfo();
            error_log("SQL Error: " . print_r($errorInfo, true));
            throw new Exception("Failed to create public user: " . $errorInfo[2]);
        }
        
        $userId = $db->lastInsertId();
        error_log("Created user with ID: $userId");
        
        // Generate QR code data
        $qrData = json_encode([
            'public_id' => $public_id,
            'name' => trim($data['name']),
            'nic' => $nic,
            'mobile' => trim($data['mobile']),
            'address' => $address,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        $db->commit();
        
        $responseData = [
            "id" => intval($userId),
            "public_id" => $public_id,
            "public_user_id" => $public_id,
            "name" => trim($data['name']),
            "nic" => $nic,
            "mobile" => trim($data['mobile']),
            "address" => $address,
            "email" => $email,
            "username" => $username,
            "status" => "active",
            "qr_code_data" => $qrData,
            "department_id" => !empty($data['department_id']) ? intval($data['department_id']) : null,
            "division_id" => !empty($data['division_id']) ? intval($data['division_id']) : null,
            "created_at" => date('Y-m-d H:i:s')
        ];
        
        error_log("Sending response: " . print_r($responseData, true));
        sendResponse($responseData, "Public user created successfully");
        
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create public user error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendError(500, "Failed to create public user: " . $e->getMessage());
    }
}

function updatePublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Public user ID is required");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'nic', 'address', 'mobile', 'email', 'username', 'department_id', 'division_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'email' && !empty($data[$field]) && !filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
                    sendError(400, "Invalid email format");
                    return;
                }
                
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $updateFields[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE public_users SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        $params[] = $data['id'];
        
        $stmt = $db->prepare($query);
        if (!$stmt->execute($params)) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Update failed: " . $errorInfo[2]);
        }
        
        sendResponse(["id" => $data['id']], "Public user updated successfully");
        
    } catch (Exception $e) {
        error_log("Update public user error: " . $e->getMessage());
        sendError(500, "Failed to update public user: " . $e->getMessage());
    }
}

function deletePublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Public user ID is required");
            return;
        }
        
        // Check if user has active registry entries or tokens
        $stmt = $db->prepare("SELECT COUNT(*) FROM public_registry WHERE public_user_id = ? AND status = 'active'");
        $stmt->execute([$data['id']]);
        
        if ($stmt->fetchColumn() > 0) {
            sendError(409, "Cannot delete user with active registry entries. Please complete or cancel them first.");
            return;
        }
        
        $query = "UPDATE public_users SET status = 'deleted', updated_at = NOW() WHERE id = ?";
        $stmt = $db->prepare($query);
        if (!$stmt->execute([$data['id']])) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Delete failed: " . $errorInfo[2]);
        }
        
        sendResponse(["id" => $data['id']], "Public user deleted successfully");
        
    } catch (Exception $e) {
        error_log("Delete public user error: " . $e->getMessage());
        sendError(500, "Failed to delete public user: " . $e->getMessage());
    }
}
?>
