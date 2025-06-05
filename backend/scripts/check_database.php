<?php
// Include database configuration
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/response_handler.php';

// Set headers for JSON response
header('Content-Type: application/json');

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Failed to connect to database");
    }

    // Check if users table exists
    $stmt = $db->query("SHOW TABLES LIKE 'users'");
    $usersTableExists = $stmt->rowCount() > 0;

    $result = [
        'database_connection' => 'success',
        'users_table_exists' => $usersTableExists,
        'admin_user' => null
    ];

    if ($usersTableExists) {
        // Check if admin user exists
        $stmt = $db->query("SELECT id, user_id, username, name, email, role, status FROM users WHERE username = 'admin' OR username = 'Farah' LIMIT 1");
        $adminUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($adminUser) {
            $result['admin_user'] = $adminUser;
            $result['message'] = 'Existing admin user found';
        } else {
            // Create default admin user if not exists
            $password = password_hash('password', PASSWORD_DEFAULT);
            $stmt = $db->prepare("
                INSERT INTO users 
                (user_id, username, password, name, nic, email, role, status) 
                VALUES 
                ('ADMIN-001', 'admin', :password, 'System Administrator', '199001010000', 'admin@example.com', 'admin', 'active')
            ");
            $stmt->execute([':password' => $password]);
            $result['admin_user_created'] = true;
            $result['admin_user'] = [
                'user_id' => 'ADMIN-001',
                'username' => 'admin',
                'name' => 'System Administrator',
                'nic' => '199001010000',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'status' => 'active',
                'default_password' => 'password'
            ];
            $result['message'] = 'Default admin user created';
        }
    } else {
        $result['message'] = 'Users table does not exist. Please run your database migrations first.';
    }

    // Return success response using the response handler
    sendResponse($result, $result['message']);

} catch (Exception $e) {
    // Return error response using the response handler
    sendError(500, 'Database check failed', [
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
