
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
        error_log("Database connection failed in registry API");
        sendError(500, "Database connection failed");
        exit;
    }

    // Log the request method and data for debugging
    error_log("Registry API - Method: " . $_SERVER['REQUEST_METHOD']);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents("php://input");
        error_log("Registry API - POST data: " . $input);
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
    error_log("Stack trace: " . $e->getTraceAsString());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getRegistryEntries($db) {
    try {
        $date = $_GET['date'] ?? date('Y-m-d');
        $departmentId = $_GET['department_id'] ?? null;
        $status = $_GET['status'] ?? 'active';
        $search = $_GET['search'] ?? null;
        
        $query = "SELECT pr.*, d.name as department_name, div.name as division_name, pu.name as public_user_name, pu.public_user_id as public_user_id_display
                 FROM public_registry pr 
                 LEFT JOIN departments d ON pr.department_id = d.id 
                 LEFT JOIN divisions div ON pr.division_id = div.id 
                 LEFT JOIN public_users pu ON pr.public_user_id = pu.id
                 WHERE DATE(pr.entry_time) = ? AND pr.status = ?";
        
        $params = [$date, $status];
        
        if ($departmentId) {
            $query .= " AND pr.department_id = ?";
            $params[] = $departmentId;
        }
        
        if ($search) {
            $query .= " AND (pr.visitor_name LIKE ? OR pr.visitor_nic LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $query .= " ORDER BY pr.entry_time DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse($entries, "Registry entries retrieved successfully");
        
    } catch (Exception $e) {
        error_log("Get registry entries error: " . $e->getMessage());
        sendError(500, "Failed to fetch registry entries: " . $e->getMessage());
    }
}

function createRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            error_log("Empty request body in createRegistryEntry");
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input, true);
        if (!$data) {
            error_log("Invalid JSON data in createRegistryEntry: " . json_last_error_msg());
            sendError(400, "Invalid JSON data: " . json_last_error_msg());
            return;
        }
        
        error_log("Creating registry entry with data: " . print_r($data, true));
        
        // Check required fields
        $requiredFields = ['visitor_name', 'visitor_nic', 'department_id', 'purpose_of_visit', 'visitor_type'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                error_log("Missing required field: $field");
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        $db->beginTransaction();
        
        // Generate registry ID
        $registry_id = 'REG' . date('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $query = "INSERT INTO public_registry (registry_id, public_user_id, visitor_name, visitor_nic, visitor_address, visitor_phone, department_id, division_id, purpose_of_visit, remarks, visitor_type, entry_time, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'active')";
        
        $params = [
            $registry_id,
            !empty($data['public_user_id']) ? intval($data['public_user_id']) : null,
            trim($data['visitor_name']),
            trim($data['visitor_nic']),
            isset($data['visitor_address']) ? trim($data['visitor_address']) : '',
            isset($data['visitor_phone']) ? trim($data['visitor_phone']) : '',
            intval($data['department_id']),
            !empty($data['division_id']) ? intval($data['division_id']) : null,
            trim($data['purpose_of_visit']),
            isset($data['remarks']) ? trim($data['remarks']) : '',
            trim($data['visitor_type'])
        ];
        
        error_log("Executing registry query with params: " . print_r($params, true));
        
        $stmt = $db->prepare($query);
        if (!$stmt->execute($params)) {
            $errorInfo = $stmt->errorInfo();
            error_log("SQL Error: " . print_r($errorInfo, true));
            throw new Exception("Failed to create registry entry: " . $errorInfo[2]);
        }
        
        $entryId = $db->lastInsertId();
        error_log("Created registry entry with ID: $entryId");
        
        $db->commit();
        
        // Get the created entry with department/division names
        $stmt = $db->prepare("
            SELECT pr.*, d.name as department_name, div.name as division_name, pu.name as public_user_name, pu.public_user_id as public_user_id_display
            FROM public_registry pr
            LEFT JOIN departments d ON pr.department_id = d.id
            LEFT JOIN divisions div ON pr.division_id = div.id
            LEFT JOIN public_users pu ON pr.public_user_id = pu.id
            WHERE pr.id = ?
        ");
        $stmt->execute([$entryId]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("Sending registry response: " . print_r($entry, true));
        sendResponse($entry, "Registry entry created successfully");
        
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create registry entry error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendError(500, "Failed to create registry entry: " . $e->getMessage());
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
        
        $allowedFields = ['visitor_name', 'visitor_nic', 'visitor_address', 'visitor_phone', 'department_id', 'division_id', 'purpose_of_visit', 'remarks', 'status', 'exit_time'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE public_registry SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        $params[] = $data['id'];
        
        $stmt = $db->prepare($query);
        if (!$stmt->execute($params)) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Update failed: " . $errorInfo[2]);
        }
        
        sendResponse(["id" => $data['id']], "Registry entry updated successfully");
        
    } catch (Exception $e) {
        error_log("Update registry entry error: " . $e->getMessage());
        sendError(500, "Failed to update registry entry: " . $e->getMessage());
    }
}

function deleteRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Registry entry ID is required");
            return;
        }
        
        $query = "UPDATE public_registry SET status = 'deleted', updated_at = NOW() WHERE id = ?";
        $stmt = $db->prepare($query);
        if (!$stmt->execute([$data['id']])) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Delete failed: " . $errorInfo[2]);
        }
        
        sendResponse(["id" => $data['id']], "Registry entry deleted successfully");
        
    } catch (Exception $e) {
        error_log("Delete registry entry error: " . $e->getMessage());
        sendError(500, "Failed to delete registry entry: " . $e->getMessage());
    }
}
?>
