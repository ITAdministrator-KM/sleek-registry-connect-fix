
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError(405, "Method not allowed");
        exit;
    }

    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        sendError(400, "No file uploaded or upload error");
        exit;
    }

    // Get form data
    $document_name = $_POST['document_name'] ?? '';
    $department_id = $_POST['department_id'] ?? '';
    $division_id = $_POST['division_id'] ?? '';
    $description = $_POST['description'] ?? '';
    $document_type = $_POST['document_type'] ?? '';

    // Validate required fields
    if (empty($document_name) || empty($department_id) || empty($division_id) || empty($document_type)) {
        sendError(400, "Missing required fields");
        exit;
    }

    // Validate file type
    $allowed_types = ['doc', 'docx', 'xls', 'xlsx'];
    $file_extension = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
    
    if (!in_array($file_extension, $allowed_types)) {
        sendError(400, "Invalid file type. Only DOC, DOCX, XLS, XLSX files are allowed");
        exit;
    }

    // Create upload directory if it doesn't exist
    $upload_dir = '../../uploads/documents/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    // Generate unique filename
    $file_name = time() . '_' . basename($_FILES['file']['name']);
    $file_path = $upload_dir . $file_name;

    // Move uploaded file
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $file_path)) {
        sendError(500, "Failed to upload file");
        exit;
    }

    // Insert document record into database
    $query = "INSERT INTO documents (document_name, document_type, file_name, file_path, file_size, department_id, division_id, uploaded_by_user_id, description, is_active, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'yes', NOW())";
    
    $stmt = $db->prepare($query);
    $result = $stmt->execute([
        $document_name,
        $document_type,
        $file_name,
        $file_path,
        $_FILES['file']['size'],
        intval($department_id),
        intval($division_id),
        1, // Default to user ID 1 for now - should be from session
        $description
    ]);

    if (!$result) {
        // Delete uploaded file if database insert failed
        unlink($file_path);
        throw new Exception("Failed to save document record");
    }

    $document_id = $db->lastInsertId();

    sendResponse([
        "id" => intval($document_id),
        "message" => "Document uploaded successfully"
    ], "Document uploaded successfully");

} catch (Exception $e) {
    error_log("Document upload error: " . $e->getMessage());
    sendError(500, "Failed to upload document: " . $e->getMessage());
}
?>
