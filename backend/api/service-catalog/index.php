
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../config/response_handler.php';

header('Content-Type: application/json');

// Enhanced error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        error_log("Service Catalog API: Database connection failed");
        sendError(500, "Database connection failed");
        exit;
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getServices($db);
            break;
        case 'POST':
            createService($db);
            break;
        case 'PUT':
            updateService($db);
            break;
        case 'DELETE':
            deleteService($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Service Catalog API Error: " . $e->getMessage());
    error_log("Service Catalog API Trace: " . $e->getTraceAsString());
    sendError(500, "Internal server error");
}

function getServices($db) {
    try {
        $id = $_GET['id'] ?? null;
        $public_view = isset($_GET['public']) ? true : false;
        
        if ($id) {
            $query = "SELECT sc.*, d.name as department_name, dv.name as division_name
                     FROM service_catalog sc 
                     LEFT JOIN departments d ON sc.department_id = d.id 
                     LEFT JOIN divisions dv ON sc.division_id = dv.id 
                     WHERE sc.id = ?";
            
            if ($public_view) {
                $query .= " AND sc.status = 'active'";
            }
            
            $stmt = $db->prepare($query);
            if (!$stmt) {
                throw new Exception("Failed to prepare statement: " . $db->error);
            }
            
            $stmt->execute([$id]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                sendError(404, "Service not found");
                return;
            }
            
            // Safely decode JSON
            if (!empty($service['required_documents'])) {
                $decoded = json_decode($service['required_documents'], true);
                $service['required_documents'] = $decoded ?: [];
            } else {
                $service['required_documents'] = [];
            }
            
            sendResponse($service, "Service retrieved successfully");
        } else {
            // Get all services
            $whereClause = $public_view ? "WHERE sc.status = 'active'" : "";
            
            $query = "SELECT sc.*, d.name as department_name, dv.name as division_name
                     FROM service_catalog sc 
                     LEFT JOIN departments d ON sc.department_id = d.id 
                     LEFT JOIN divisions dv ON sc.division_id = dv.id 
                     $whereClause
                     ORDER BY sc.service_name ASC";
            
            $stmt = $db->prepare($query);
            if (!$stmt) {
                throw new Exception("Failed to prepare statement: " . $db->error);
            }
            
            $stmt->execute();
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process each service
            foreach ($services as &$service) {
                if (!empty($service['required_documents'])) {
                    $decoded = json_decode($service['required_documents'], true);
                    $service['required_documents'] = $decoded ?: [];
                } else {
                    $service['required_documents'] = [];
                }
            }
            
            sendResponse($services, "Services retrieved successfully");
        }
    } catch (Exception $e) {
        error_log("Get services error: " . $e->getMessage());
        sendError(500, "Failed to fetch services");
    }
}

function createService($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input, true);
        if (!$data) {
            error_log("Invalid JSON data received: " . $input);
            sendError(400, "Invalid JSON data");
            return;
        }
        
        // Required fields validation
        $requiredFields = ['service_name', 'service_code', 'description', 'department_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Check for existing service code
        $stmt = $db->prepare("SELECT COUNT(*) FROM service_catalog WHERE service_code = ?");
        if (!$stmt) {
            throw new Exception("Failed to prepare statement: " . $db->error);
        }
        
        $stmt->execute([$data['service_code']]);
        
        if ($stmt->fetchColumn() > 0) {
            sendError(409, "Service code already exists");
            return;
        }
        
        // Start transaction
        if (!$db->beginTransaction()) {
            throw new Exception("Failed to start transaction");
        }
        
        $query = "INSERT INTO service_catalog (
                    service_name, service_code, description, department_id, division_id, 
                    icon, fee_amount, required_documents, processing_time_days, 
                    eligibility_criteria, form_template_url, status, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare insert statement: " . $db->error);
        }
        
        // Handle required_documents
        $requiredDocs = [];
        if (isset($data['required_documents'])) {
            if (is_array($data['required_documents'])) {
                $requiredDocs = $data['required_documents'];
            } else if (is_string($data['required_documents'])) {
                $requiredDocs = array_map('trim', explode(',', $data['required_documents']));
            }
        }
        
        $params = [
            $data['service_name'],
            $data['service_code'],
            $data['description'],
            intval($data['department_id']),
            !empty($data['division_id']) ? intval($data['division_id']) : null,
            $data['icon'] ?? '📄',
            floatval($data['fee_amount'] ?? 0.00),
            json_encode($requiredDocs),
            intval($data['processing_time_days'] ?? 7),
            $data['eligibility_criteria'] ?? null,
            $data['form_template_url'] ?? null,
            $data['status'] ?? 'active'
        ];
        
        if (!$stmt->execute($params)) {
            $db->rollBack();
            throw new Exception("Failed to execute insert: " . implode(', ', $stmt->errorInfo()));
        }
        
        $serviceId = $db->lastInsertId();
        
        if (!$db->commit()) {
            throw new Exception("Failed to commit transaction");
        }
        
        sendResponse([
            "id" => intval($serviceId),
            "service_code" => $data['service_code']
        ], "Service created successfully");
        
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create service error: " . $e->getMessage());
        sendError(500, "Failed to create service");
    }
}

function updateService($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        $id = $_GET['id'] ?? null;
        if (!$id || !$data) {
            sendError(400, "Service ID and data are required");
            return;
        }
        
        // Start transaction
        if (!$db->beginTransaction()) {
            throw new Exception("Failed to start transaction");
        }
        
        // Check if service exists
        $stmt = $db->prepare("SELECT id FROM service_catalog WHERE id = ?");
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare statement: " . $db->error);
        }
        
        $stmt->execute([intval($id)]);
        
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            sendError(404, "Service not found");
            return;
        }
        
        // Build update query
        $updateFields = [];
        $params = [];
        
        $allowedFields = [
            'service_name', 'service_code', 'description', 'department_id', 'division_id', 
            'icon', 'fee_amount', 'required_documents', 'processing_time_days', 
            'eligibility_criteria', 'form_template_url', 'status'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'required_documents') {
                    $updateFields[] = "$field = ?";
                    if (is_array($data[$field])) {
                        $params[] = json_encode($data[$field]);
                    } else if (is_string($data[$field])) {
                        $docs = array_map('trim', explode(',', $data[$field]));
                        $params[] = json_encode($docs);
                    } else {
                        $params[] = json_encode([]);
                    }
                } else {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
        }
        
        if (empty($updateFields)) {
            $db->rollBack();
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE service_catalog SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        $params[] = intval($id);
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare update statement: " . $db->error);
        }
        
        if (!$stmt->execute($params)) {
            $db->rollBack();
            throw new Exception("Failed to execute update: " . implode(', ', $stmt->errorInfo()));
        }
        
        if (!$db->commit()) {
            throw new Exception("Failed to commit transaction");
        }
        
        sendResponse(["id" => intval($id)], "Service updated successfully");
        
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update service error: " . $e->getMessage());
        sendError(500, "Failed to update service");
    }
}

function deleteService($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError(400, "Service ID is required");
            return;
        }
        
        // Start transaction
        if (!$db->beginTransaction()) {
            throw new Exception("Failed to start transaction");
        }
        
        // Check if service exists
        $stmt = $db->prepare("SELECT id FROM service_catalog WHERE id = ?");
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare statement: " . $db->error);
        }
        
        $stmt->execute([intval($id)]);
        
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            sendError(404, "Service not found");
            return;
        }
        
        // Soft delete by setting status to inactive
        $query = "UPDATE service_catalog SET status = 'inactive', updated_at = NOW() WHERE id = ?";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            $db->rollBack();
            throw new Exception("Failed to prepare delete statement: " . $db->error);
        }
        
        if (!$stmt->execute([intval($id)])) {
            $db->rollBack();
            throw new Exception("Failed to execute delete: " . implode(', ', $stmt->errorInfo()));
        }
        
        if (!$db->commit()) {
            throw new Exception("Failed to commit transaction");
        }
        
        sendResponse(["id" => intval($id)], "Service deleted successfully");
        
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete service error: " . $e->getMessage());
        sendError(500, "Failed to delete service");
    }
}
?>
