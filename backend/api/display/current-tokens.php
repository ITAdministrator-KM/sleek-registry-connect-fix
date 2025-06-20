
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

    // Check if required columns exist, add them if missing
    $addColumnsSQL = "
        ALTER TABLE tokens 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS called_at TIMESTAMP NULL
    ";
    
    try {
        $db->exec($addColumnsSQL);
        
        // Update existing records that don't have updated_at
        $db->exec("UPDATE tokens SET updated_at = created_at WHERE updated_at IS NULL");
    } catch (Exception $e) {
        error_log("Column addition warning: " . $e->getMessage());
    }

    // Get all current tokens
    $query = "
        SELECT 
            t.id,
            t.token_number,
            t.status,
            t.created_at,
            COALESCE(t.called_at, t.updated_at) as called_at,
            COALESCE(t.updated_at, t.created_at) as updated_at,
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

    // Response with proper structure
    $response = [
        'success' => true,
        'data' => [
            'tokens' => $tokens,
            'statistics' => $stats,
            'departments' => $departments,
            'last_updated' => date('Y-m-d H:i:s')
        ],
        'message' => 'Current tokens retrieved successfully'
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Current tokens API error: " . $e->getMessage());
    
    $errorResponse = [
        'success' => false,
        'message' => 'Failed to retrieve current tokens',
        'error' => $e->getMessage(),
        'data' => [
            'tokens' => [],
            'statistics' => [
                'total_tokens_today' => 0,
                'waiting_tokens' => 0,
                'serving_tokens' => 0,
                'completed_tokens' => 0
            ],
            'departments' => [],
            'last_updated' => date('Y-m-d H:i:s')
        ]
    ];
    
    http_response_code(500);
    echo json_encode($errorResponse);
}
?>
