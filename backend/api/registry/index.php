
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/response_handler.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getRegistryEntries($db);
            break;
        case 'POST':
            createRegistryEntry($db);
            break;
        case 'PUT':
            updateRegistryEntry($db);
            break;
        case 'DELETE':
            deleteRegistryEntry($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Registry API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function createRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        // Required fields validation
        $requiredFields = ['visitor_name', 'visitor_nic', 'department_id', 'purpose_of_visit', 'visitor_type'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Generate unique registry ID
        $registryId = 'REG' . date('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $query = "INSERT INTO public_registry (
            registry_id, 
            public_user_id, 
            visitor_name, 
            visitor_nic, 
            visitor_address, 
            visitor_phone, 
            department_id, 
            division_id, 
            purpose_of_visit, 
            remarks, 
            visitor_type, 
            status, 
            entry_time, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute([
            $registryId,
            $data['public_user_id'] ?? null,
            $data['visitor_name'],
            $data['visitor_nic'],
            $data['visitor_address'] ?? null,
            $data['visitor_phone'] ?? null,
            intval($data['department_id']),
            !empty($data['division_id']) ? intval($data['division_id']) : null,
            $data['purpose_of_visit'],
            $data['remarks'] ?? null,
            $data['visitor_type']
        ]);
        
        if (!$result) {
            throw new Exception("Failed to create registry entry");
        }
        
        $entryId = $db->lastInsertId();
        
        sendResponse([
            "id" => intval($entryId),
            "registry_id" => $registryId
        ], "Registry entry created successfully");
        
    } catch (Exception $e) {
        error_log("Create registry entry error: " . $e->getMessage());
        sendError(500, "Failed to create registry entry: " . $e->getMessage());
    }
}

function getRegistryEntries($db) {
    try {
        $query = "SELECT 
            pr.*,
            d.name as department_name,
            div.name as division_name,
            pu.name as public_user_name,
            pu.public_id as public_user_id_display
        FROM public_registry pr
        LEFT JOIN departments d ON pr.department_id = d.id
        LEFT JOIN divisions div ON pr.division_id = div.id
        LEFT JOIN public_users pu ON pr.public_user_id = pu.id
        WHERE pr.status != 'deleted'
        ORDER BY pr.entry_time DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse($entries, "Registry entries retrieved successfully");
        
    } catch (Exception $e) {
        error_log("Get registry entries error: " . $e->getMessage());
        sendError(500, "Failed to fetch registry entries: " . $e->getMessage());
    }
}

function updateRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Registry entry ID is required");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['status', 'exit_time', 'remarks', 'purpose_of_visit'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'exit_time' && $data[$field]) {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                } else if ($field !== 'exit_time') {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        $query = "UPDATE public_registry SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $params[] = $data['id'];
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute($params);
        
        if (!$result) {
            throw new Exception("Failed to update registry entry");
        }
        
        sendResponse(["id" => intval($data['id'])], "Registry entry updated successfully");
        
    } catch (Exception $e) {
        error_log("Update registry entry error: " . $e->getMessage());
        sendError(500, "Failed to update registry entry: " . $e->getMessage());
    }
}

function deleteRegistryEntry($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError(400, "Registry entry ID is required");
            return;
        }
        
        $query = "UPDATE public_registry SET status = 'deleted', updated_at = NOW() WHERE id = ?";
        $stmt = $db->prepare($query);
        $result = $stmt->execute([intval($id)]);
        
        if (!$result) {
            throw new Exception("Failed to delete registry entry");
        }
        
        sendResponse(["id" => intval($id)], "Registry entry deleted successfully");
        
    } catch (Exception $e) {
        error_log("Delete registry entry error: " . $e->getMessage());
        sendError(500, "Failed to delete registry entry: " . $e->getMessage());
    }
}
?>
