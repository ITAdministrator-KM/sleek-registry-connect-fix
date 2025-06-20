
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/response_handler.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // Get all current tokens using the view we created
    $query = "
        SELECT 
            t.id,
            t.token_number,
            t.status,
            t.created_at,
            t.called_at,
            t.updated_at,
            d.name as department_name,
            div.name as division_name,
            d.id as department_id,
            div.id as division_id,
            ROW_NUMBER() OVER (PARTITION BY t.division_id, t.status ORDER BY t.created_at) as position_in_queue
        FROM tokens t
        JOIN divisions div ON t.division_id = div.id
        JOIN departments d ON div.department_id = d.id
        WHERE t.status IN ('active', 'called', 'serving')
        AND DATE(t.created_at) = CURDATE()
        ORDER BY d.name, div.name, 
        CASE 
            WHEN t.status = 'serving' THEN 1
            WHEN t.status = 'called' THEN 2
            WHEN t.status = 'active' THEN 3
            ELSE 4
        END,
        t.created_at
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get summary statistics
    $statsQuery = "
        SELECT 
            COUNT(*) as total_tokens_today,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as waiting_tokens,
            COUNT(CASE WHEN status = 'serving' THEN 1 END) as serving_tokens,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tokens
        FROM tokens 
        WHERE DATE(created_at) = CURDATE()
    ";
    
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->execute();
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // Get department summary
    $deptQuery = "
        SELECT 
            d.id,
            d.name,
            COUNT(t.id) as total_tokens,
            COUNT(CASE WHEN t.status = 'active' THEN 1 END) as waiting_tokens,
            COUNT(CASE WHEN t.status = 'serving' THEN 1 END) as serving_tokens
        FROM departments d
        LEFT JOIN divisions div ON d.id = div.department_id
        LEFT JOIN tokens t ON div.id = t.division_id AND DATE(t.created_at) = CURDATE()
        WHERE d.status = 'active'
        GROUP BY d.id, d.name
        ORDER BY d.name
    ";
    
    $deptStmt = $db->prepare($deptQuery);
    $deptStmt->execute();
    $departments = $deptStmt->fetchAll(PDO::FETCH_ASSOC);

    ResponseHandler::success([
        'tokens' => $tokens,
        'statistics' => $stats,
        'departments' => $departments,
        'last_updated' => date('Y-m-d H:i:s')
    ], 'Current tokens retrieved successfully');

} catch (Exception $e) {
    error_log("Current tokens API error: " . $e->getMessage());
    ResponseHandler::error('Failed to retrieve current tokens: ' . $e->getMessage(), 500);
}
?>
