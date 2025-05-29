<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Verify content type
if ($_SERVER["CONTENT_TYPE"] !== "application/json") {
    sendError(415, "Content-Type must be application/json");
    exit;
}

// Verify authentication
$authHeader = getAuthorizationHeader();
if (!$authHeader) {
    sendError(401, "No authorization header present");
    exit;
}

$token = validateToken($authHeader);
if (!$token) {
    sendError(401, "Invalid or expired token");
    exit;
}

// Only allow PUT method
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError(405, "Method not allowed");
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id) || !isset($data->currentPassword) || !isset($data->newPassword)) {
        sendError(400, "Current password and new password are required");
        exit;
    }

    // Validate password length
    if (strlen($data->newPassword) < 8) {
        sendError(400, "Password must be at least 8 characters long");
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    // Verify current password
    $stmt = $db->prepare("SELECT password FROM users WHERE id = :id AND status = 'active'");
    $stmt->bindParam(":id", $data->id);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($data->currentPassword, $user['password'])) {
        sendError(401, "Current password is incorrect");
        exit;
    }

    // Update password
    $newHash = password_hash($data->newPassword, PASSWORD_ARGON2ID);
    
    $stmt = $db->prepare("UPDATE users SET password = :password, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
    $stmt->bindParam(":password", $newHash);
    $stmt->bindParam(":id", $data->id);
    
    if ($stmt->execute()) {
        sendResponse(200, ["message" => "Password updated successfully"]);
    } else {
        sendError(500, "Failed to update password");
    }

} catch (PDOException $e) {
    sendError(500, "Database error", $e);
} catch (Exception $e) {
    sendError(500, "Internal server error", $e);
}
