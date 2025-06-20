
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/response_handler.php';
require_once '../utils/auth.php';

try {
    // Verify authentication
    $auth = new Auth();
    $user = $auth->validateToken();
    
    if (!$user || $user['role'] !== 'staff') {
        throw new Exception("Unauthorized access");
    }

    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Invalid input data");
    }

    // Validate required fields
    $required_fields = ['visitor_name', 'visitor_nic', 'department_id', 'purpose_of_visit', 'visitor_type'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: " . $field);
        }
    }

    // Create registry entry
    $stmt = $db->prepare("
        INSERT INTO public_registry (
            public_user_id, visitor_name, visitor_nic, visitor_address, 
            visitor_phone, department_id, division_id, purpose_of_visit, 
            remarks, visitor_type, staff_id, entry_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $input['public_user_id'] ?? null,
        $input['visitor_name'],
        $input['visitor_nic'],
        $input['visitor_address'] ?? '',
        $input['visitor_phone'] ?? '',
        $input['department_id'],
        $input['division_id'] ?? null,
        $input['purpose_of_visit'],
        $input['remarks'] ?? '',
        $input['visitor_type'],
        $user['id']
    ]);

    $entry_id = $db->lastInsertId();

    // Get the created entry with department/division names
    $stmt = $db->prepare("
        SELECT 
            pr.*,
            d.name as department_name,
            div.name as division_name
        FROM public_registry pr
        JOIN departments d ON pr.department_id = d.id
        LEFT JOIN divisions div ON pr.division_id = div.id
        WHERE pr.id = ?
    ");
    
    $stmt->execute([$entry_id]);
    $entry = $stmt->fetch(PDO::FETCH_ASSOC);

    ResponseHandler::success($entry, "Registry entry created successfully");

} catch (Exception $e) {
    error_log("Registry creation error: " . $e->getMessage());
    ResponseHandler::error($e->getMessage(), 500);
}
?>
