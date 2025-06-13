
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../config/response_handler.php';

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
    sendError(500, "Internal server error: " . $e->getMessage());
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
                     WHERE sc.id = ? AND sc.status = 'active'";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                sendError(404, "Service not found");
                return;
            }
            
            if ($service['required_documents']) {
                $service['required_documents'] = json_decode($service['required_documents'], true);
            }
            
            sendResponse($service, "Service retrieved successfully");
        } else {
            $whereClause = $public_view ? "WHERE sc.status = 'active'" : "";
            
            $query = "SELECT sc.*, d.name as department_name, dv.name as division_name
                     FROM service_catalog sc 
                     LEFT JOIN departments d ON sc.department_id = d.id 
                     LEFT JOIN divisions dv ON sc.division_id = dv.id 
                     $whereClause
                     ORDER BY sc.service_name ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($services as &$service) {
                if ($service['required_documents']) {
                    $service['required_documents'] = json_decode($service['required_documents'], true);
                }
            }
            
            sendResponse($services, "Services retrieved successfully");
        }
    } catch (Exception $e) {
        error_log("Get services error: " . $e->getMessage());
        sendError(500, "Failed to fetch services: " . $e->getMessage());
    }
}

function createService($db) {
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
        
        $requiredFields = ['service_name', 'service_code', 'description', 'department_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty(trim($data->$field))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Check for existing service code
        $stmt = $db->prepare("SELECT COUNT(*) FROM service_catalog WHERE service_code = ?");
        $stmt->execute([$data->service_code]);
        
        if ($stmt->fetchColumn() > 0) {
            sendError(409, "Service code already exists");
            return;
        }
        
        $db->beginTransaction();
        
        $query = "INSERT INTO service_catalog (service_name, service_code, description, department_id, division_id, 
                  icon, fee_amount, required_documents, processing_time_days, eligibility_criteria, 
                  form_template_url, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($query);
        $params = [
            $data->service_name,
            $data->service_code,
            $data->description,
            $data->department_id,
            $data->division_id ?? null,
            $data->icon ?? '📄',
            $data->fee_amount ?? 0.00,
            json_encode($data->required_documents ?? []),
            $data->processing_time_days ?? 7,
            $data->eligibility_criteria ?? null,
            $data->form_template_url ?? null,
            $data->status ?? 'active'
        ];
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to create service");
        }
        
        $serviceId = $db->lastInsertId();
        
        $db->commit();
        
        sendResponse([
            "id" => $serviceId,
            "service_code" => $data->service_code
        ], "Service created successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create service error: " . $e->getMessage());
        sendError(500, "Failed to create service: " . $e->getMessage());
    }
}

function updateService($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        $id = $_GET['id'] ?? null;
        if (!$id || !$data) {
            sendError(400, "Service ID and data are required");
            return;
        }
        
        $db->beginTransaction();
        
        $stmt = $db->prepare("SELECT id FROM service_catalog WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Service not found");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['service_name', 'service_code', 'description', 'department_id', 'division_id', 
                         'icon', 'fee_amount', 'required_documents', 'processing_time_days', 
                         'eligibility_criteria', 'form_template_url', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data->$field)) {
                if ($field === 'required_documents') {
                    $updateFields[] = "$field = ?";
                    $params[] = json_encode($data->$field);
                } else {
                    $updateFields[] = "$field = ?";
                    $params[] = $data->$field;
                }
            }
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE service_catalog SET " . implode(", ", $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $params[] = $id;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $db->commit();
        sendResponse(["id" => $id], "Service updated successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update service error: " . $e->getMessage());
        sendError(500, "Failed to update service: " . $e->getMessage());
    }
}

function deleteService($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError(400, "Service ID is required");
            return;
        }
        
        $db->beginTransaction();
        
        $stmt = $db->prepare("SELECT id FROM service_catalog WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Service not found");
            return;
        }
        
        // Soft delete by setting status to inactive
        $query = "UPDATE service_catalog SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        
        $db->commit();
        sendResponse(["id" => $id], "Service deleted successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete service error: " . $e->getMessage());
        sendError(500, "Failed to delete service: " . $e->getMessage());
    }
}
?>
