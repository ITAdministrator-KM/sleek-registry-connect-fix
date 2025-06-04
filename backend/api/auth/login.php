
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

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

    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data || !isset($data->username) || !isset($data->password)) {
        sendError(400, "Username and password are required");
        exit;
    }

    $username = $data->username;
    $password = $data->password;
    $role = isset($data->role) ? strtolower($data->role) : null;

    // First try admin/staff users table
    if (!$role || $role === 'admin' || $role === 'staff') {
        $query = "SELECT id, user_id, username, password, role, name, email, status, department_id 
                  FROM users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Get department info if exists
            $departmentName = null;
            if ($user['department_id']) {
                $deptQuery = "SELECT name FROM departments WHERE id = ?";
                $deptStmt = $db->prepare($deptQuery);
                $deptStmt->execute([$user['department_id']]);
                $dept = $deptStmt->fetch(PDO::FETCH_ASSOC);
                $departmentName = $dept ? $dept['name'] : null;
            }
            
            $token = generateJWT([
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ]);
            
            sendResponse([
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'user_id' => $user['user_id'],
                    'username' => $user['username'],
                    'role' => $user['role'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'department_id' => $user['department_id'],
                    'department_name' => $departmentName
                ]
            ], "Login successful");
            exit;
        }
    }

    // Try public users table if not found in admin/staff or role is public
    if (!$role || $role === 'public') {
        $query = "SELECT id, public_user_id, username, password_hash, name, email, status 
                  FROM public_users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$username]);
        $publicUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($publicUser && password_verify($password, $publicUser['password_hash'])) {
            $token = generateJWT([
                'user_id' => $publicUser['id'],
                'username' => $publicUser['username'],
                'role' => 'public',
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ]);
            
            sendResponse([
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $publicUser['id'],
                    'public_user_id' => $publicUser['public_user_id'],
                    'username' => $publicUser['username'],
                    'role' => 'public',
                    'name' => $publicUser['name'],
                    'email' => $publicUser['email']
                ]
            ], "Login successful");
            exit;
        }
    }

    // No user found with matching credentials
    sendError(401, "Invalid credentials");

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    sendError(500, "Login failed: " . $e->getMessage());
}
?>
