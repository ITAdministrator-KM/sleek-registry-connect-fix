
<?php
// Include required files
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/error_handler.php';
require_once '../../config/jwt_middleware.php';

// Set headers for CORS and content type
header('Content-Type: application/json');

// Enhanced error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Initialize response handler
function sendResponse($data = null, $message = "Success", $status = 200) {
    http_response_code($status);
    echo json_encode([
        'success' => $status >= 200 && $status < 300,
        'data' => $data,
        'message' => $message,
        'status' => $status
    ]);
    exit;
}

function sendError($status, $message, $details = null) {
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'error' => $details,
        'status' => $status
    ]);
    exit;
}

function getServices($db) {
    try {
        $public_view = isset($_GET['public']);
        $query = "SELECT * FROM service_catalog";
        
        if ($public_view) {
            $query .= " WHERE status = 'active'";
        }
        
        $stmt = $db->query($query);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensure required_documents is always an array
        foreach ($services as &$service) {
            if (isset($service['required_documents'])) {
                $service['required_documents'] = json_decode($service['required_documents'], true) ?: [];
            } else {
                $service['required_documents'] = [];
            }
        }
        
        sendResponse($services);
    } catch (Exception $e) {
        error_log("Error in getServices: " . $e->getMessage());
        sendError(500, "Failed to fetch services", $e->getMessage());
    }
}

function createService($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception("Invalid input data");
        }
        
        // Validate required fields
        $required = ['service_name', 'service_code', 'description'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
        
        // Prepare data
        $data = [
            'service_name' => $input['service_name'],
            'service_code' => $input['service_code'],
            'description' => $input['description'],
            'department_id' => $input['department_id'] ?? null,
            'division_id' => $input['division_id'] ?? null,
            'icon' => $input['icon'] ?? '📄',
            'fee_amount' => $input['fee_amount'] ?? 0.00,
            'required_documents' => !empty($input['required_documents']) ? 
                json_encode($input['required_documents']) : null,
            'processing_time_days' => $input['processing_time_days'] ?? 7,
            'eligibility_criteria' => $input['eligibility_criteria'] ?? null,
            'form_template_url' => $input['form_template_url'] ?? null,
            'status' => in_array($input['status'] ?? 'active', ['active', 'inactive']) ? 
                $input['status'] : 'active'
        ];
        
        // Insert into database
        $fields = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $query = "INSERT INTO service_catalog ($fields) VALUES ($placeholders)";
        $stmt = $db->prepare($query);
        
        if (!$stmt->execute($data)) {
            throw new Exception("Failed to create service");
        }
        
        $serviceId = $db->lastInsertId();
        $data['id'] = $serviceId;
        
        sendResponse($data, "Service created successfully", 201);
    } catch (Exception $e) {
        error_log("Error in createService: " . $e->getMessage());
        sendError(400, "Failed to create service", $e->getMessage());
    }
}

function updateService($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            throw new Exception("Invalid input data or missing ID");
        }
        
        $id = $input['id'];
        
        // Check if service exists
        $checkStmt = $db->prepare("SELECT id FROM service_catalog WHERE id = ?");
        $checkStmt->execute([$id]);
        if (!$checkStmt->fetch()) {
            throw new Exception("Service not found");
        }
        
        // Prepare update data
        $updateFields = [];
        $params = [];
        
        $allowedFields = [
            'service_name', 'service_code', 'description', 'department_id', 
            'division_id', 'icon', 'fee_amount', 'processing_time_days', 
            'eligibility_criteria', 'form_template_url', 'status'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'status' && !in_array($input[$field], ['active', 'inactive'])) {
                    continue; // Skip invalid status values
                }
                $updateFields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        // Handle required_documents separately
        if (isset($input['required_documents'])) {
            $updateFields[] = "required_documents = ?";
            $params[] = json_encode($input['required_documents']);
        }
        
        if (empty($updateFields)) {
            throw new Exception("No valid fields to update");
        }
        
        $params[] = $id; // Add ID for WHERE clause
        
        $query = "UPDATE service_catalog SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to update service");
        }
        
        // Fetch updated service
        $fetchStmt = $db->prepare("SELECT * FROM service_catalog WHERE id = ?");
        $fetchStmt->execute([$id]);
        $updatedService = $fetchStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($updatedService && isset($updatedService['required_documents'])) {
            $updatedService['required_documents'] = json_decode($updatedService['required_documents'], true) ?: [];
        }
        
        sendResponse($updatedService, "Service updated successfully");
    } catch (Exception $e) {
        error_log("Error in updateService: " . $e->getMessage());
        sendError(400, "Failed to update service", $e->getMessage());
    }
}

function deleteService($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            throw new Exception("Missing service ID");
        }
        
        // Check if service exists
        $checkStmt = $db->prepare("SELECT id FROM service_catalog WHERE id = ?");
        $checkStmt->execute([$id]);
        if (!$checkStmt->fetch()) {
            throw new Exception("Service not found");
        }
        
        // Delete the service
        $stmt = $db->prepare("DELETE FROM service_catalog WHERE id = ?");
        if (!$stmt->execute([$id])) {
            throw new Exception("Failed to delete service");
        }
        
        sendResponse(null, "Service deleted successfully");
    } catch (Exception $e) {
        error_log("Error in deleteService: " . $e->getMessage());
        sendError(400, "Failed to delete service", $e->getMessage());
    }
}

try {
    // Require authentication for all endpoints except OPTIONS and public GET
    if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS' && 
        !($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['public']))) {
        $auth = requireAuth(); // This will exit if not authenticated
    }

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // Ensure service_catalog table exists
    $tableCheck = $db->query("SHOW TABLES LIKE 'service_catalog'");
    if ($tableCheck->rowCount() == 0) {
        // Create service_catalog table if it doesn't exist
        $createTable = "
        CREATE TABLE IF NOT EXISTS `service_catalog` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `service_name` VARCHAR(255) NOT NULL,
            `service_code` VARCHAR(50) UNIQUE NOT NULL,
            `description` TEXT,
            `department_id` INT,
            `division_id` INT,
            `icon` VARCHAR(100) DEFAULT '📄',
            `fee_amount` DECIMAL(10,2) DEFAULT 0.00,
            `required_documents` TEXT,
            `processing_time_days` INT DEFAULT 7,
            `eligibility_criteria` TEXT,
            `form_template_url` VARCHAR(500),
            `status` ENUM('active', 'inactive') DEFAULT 'active',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createTable);
        
        // Insert sample data if table was just created
        $stmt = $db->query("SELECT COUNT(*) FROM service_catalog");
        if ($stmt->fetchColumn() == 0) {
            $sampleData = [
                ["Marriage Registration", "MR-001", "Apply for marriage registration"],
                ["Birth Certificate", "BC-001", "Apply for birth certificate"],
                ["Death Certificate", "DC-001", "Apply for death certificate"]
            ];
            
            $stmt = $db->prepare("INSERT INTO service_catalog (service_name, service_code, description, status) VALUES (?, ?, ?, 'active')");
            foreach ($sampleData as $data) {
                $stmt->execute($data);
            }
        }
    }

    // Route the request
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
        case 'OPTIONS':
            http_response_code(200);
            exit;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Service Catalog API Error: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    sendError(500, "Internal server error", $e->getMessage());
}
