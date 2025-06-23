
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
            getDocuments($db);
            break;
        case 'POST':
            createDocument($db);
            break;
        case 'PUT':
            updateDocument($db);
            break;
        case 'DELETE':
            deleteDocument($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Documents API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getDocuments($db) {
    try {
        $departmentId = $_GET['department_id'] ?? null;
        $divisionId = $_GET['division_id'] ?? null;
        
        if ($departmentId && $divisionId) {
            $query = "SELECT d.*, dept.name as department_name, div.name as division_name
                     FROM documents d
                     JOIN departments dept ON d.department_id = dept.id
                     JOIN divisions div ON d.division_id = div.id
                     WHERE d.department_id = ? AND d.division_id = ? AND d.is_active = 'yes'
                     ORDER BY d.document_name ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$departmentId, $divisionId]);
            $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse($documents, "Documents retrieved successfully");
        } else {
            $query = "SELECT d.*, dept.name as department_name, div.name as division_name
                     FROM documents d
                     JOIN departments dept ON d.department_id = dept.id
                     JOIN divisions div ON d.division_id = div.id
                     WHERE d.is_active = 'yes'
                     ORDER BY d.document_name ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse($documents, "All documents retrieved successfully");
        }
    } catch (Exception $e) {
        error_log("Get documents error: " . $e->getMessage());
        sendError(500, "Failed to fetch documents: " . $e->getMessage());
    }
}

function createDocument($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        $requiredFields = ['document_name', 'document_type', 'file_name', 'file_path', 'department_id', 'division_id', 'uploaded_by_user_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        $query = "INSERT INTO documents (document_name, document_type, file_name, file_path, file_size, department_id, division_id, uploaded_by_user_id, description, is_active, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'yes', NOW())";
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute([
            $data['document_name'],
            $data['document_type'],
            $data['file_name'],
            $data['file_path'],
            $data['file_size'] ?? null,
            $data['department_id'],
            $data['division_id'],
            $data['uploaded_by_user_id'],
            $data['description'] ?? null
        ]);
        
        if (!$result) {
            throw new Exception("Failed to create document");
        }
        
        $documentId = $db->lastInsertId();
        
        sendResponse([
            "id" => intval($documentId)
        ], "Document created successfully");
        
    } catch (Exception $e) {
        error_log("Create document error: " . $e->getMessage());
        sendError(500, "Failed to create document: " . $e->getMessage());
    }
}

function updateDocument($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Document ID is required");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['document_name', 'document_type', 'file_name', 'file_path', 'file_size', 'department_id', 'division_id', 'description', 'is_active'];
        
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
        
        $query = "UPDATE documents SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        $params[] = $data['id'];
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute($params);
        
        if (!$result) {
            throw new Exception("Failed to update document");
        }
        
        sendResponse(["id" => intval($data['id'])], "Document updated successfully");
        
    } catch (Exception $e) {
        error_log("Update document error: " . $e->getMessage());
        sendError(500, "Failed to update document: " . $e->getMessage());
    }
}

function deleteDocument($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError(400, "Document ID is required");
            return;
        }
        
        $query = "UPDATE documents SET is_active = 'no', updated_at = NOW() WHERE id = ?";
        $stmt = $db->prepare($query);
        $result = $stmt->execute([intval($id)]);
        
        if (!$result) {
            throw new Exception("Failed to delete document");
        }
        
        sendResponse(["id" => intval($id)], "Document deleted successfully");
        
    } catch (Exception $e) {
        error_log("Delete document error: " . $e->getMessage());
        sendError(500, "Failed to delete document: " . $e->getMessage());
    }
}
?>
