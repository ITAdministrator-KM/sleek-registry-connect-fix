<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Verify content type
if ($_SERVER["CONTENT_TYPE"] !== "application/json") {
    http_response_code(415);
    echo json_encode(["status" => "error", "message" => "Content-Type must be application/json"]);
    exit;
}

// Verify authentication for staff/admin setting passwords
$authHeader = getAuthorizationHeader();
$isStaffRequest = false;

if ($authHeader) {
    $token = validateToken($authHeader);
    if ($token && in_array($token['role'], ['admin', 'staff'])) {
        $isStaffRequest = true;
    }
}

// Only allow PUT method
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        throw new Exception("Public user ID is required", 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    // Staff/admin setting password for user
    if ($isStaffRequest) {
        if (!isset($data->password)) {
            throw new Exception("New password is required", 400);
        }

        // Validate password
        if (strlen($data->password) < 8) {
            throw new Exception("Password must be at least 8 characters long", 400);
        }

        $passwordHash = password_hash($data->password, PASSWORD_ARGON2ID);
        
        $stmt = $db->prepare("UPDATE public_users SET password_hash = :password_hash WHERE id = :id");
        $stmt->bindParam(":password_hash", $passwordHash);
        $stmt->bindParam(":id", $data->id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update password", 500);
        }

        if ($stmt->rowCount() === 0) {
            throw new Exception("Public user not found", 404);
        }

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Password updated successfully"
        ]);
    } 
    // Public user changing their own password
    else {
        if (!isset($data->currentPassword) || !isset($data->newPassword)) {
            throw new Exception("Current password and new password are required", 400);
        }

        // Validate password
        if (strlen($data->newPassword) < 8) {
            throw new Exception("New password must be at least 8 characters long", 400);
        }

        $stmt = $db->prepare("SELECT password_hash FROM public_users WHERE id = :id AND status = 'active'");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($data->currentPassword, $user['password_hash'])) {
            throw new Exception("Current password is incorrect", 401);
        }

        $newHash = password_hash($data->newPassword, PASSWORD_ARGON2ID);
        
        $stmt = $db->prepare("UPDATE public_users SET password_hash = :password_hash WHERE id = :id");
        $stmt->bindParam(":password_hash", $newHash);
        $stmt->bindParam(":id", $data->id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update password", 500);
        }

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Password updated successfully"
        ]);
    }
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
