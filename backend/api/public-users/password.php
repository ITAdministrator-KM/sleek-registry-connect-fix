
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

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

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'PUT':
        updatePublicUserPassword($db);
        break;
    default:
        sendError(405, "Method not allowed");
        break;
}

function updatePublicUserPassword($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id) || !isset($data->newPassword)) {
            sendError(400, "User ID and new password are required");
            return;
        }
        
        if (strlen($data->newPassword) < 6) {
            sendError(400, "Password must be at least 6 characters long");
            return;
        }
        
        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM public_users WHERE id = :id AND status = 'active'");
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "User not found");
            return;
        }
        
        // Hash the new password
        $hashedPassword = password_hash($data->newPassword, PASSWORD_ARGON2ID);
        
        // Update password
        $query = "UPDATE public_users SET password = :password, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":password", $hashedPassword);
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
}
?>
