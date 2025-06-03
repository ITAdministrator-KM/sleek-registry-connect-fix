
<?php
function sendResponse($data, $message = "Success", $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode([
        "status" => "success",
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

function sendError($status_code, $message, $details = null) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode([
        "status" => "error",
        "message" => $message,
        "details" => $details
    ]);
    exit();
}

function validateAuthToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return false;
    }

    $token = $matches[1];
    
    // Simple token validation - check if it exists and is not empty
    if (empty($token)) {
        return false;
    }
    
    // For development purposes, we'll accept any non-empty token
    // In production, you should validate the JWT signature and expiration
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        $payload = json_decode(base64_decode($parts[1]), true);
        
        // Check if payload exists and has required fields
        if (!$payload) {
            return false;
        }
        
        // If exp field exists, check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Token validation error: " . $e->getMessage());
        return false;
    }
}
?>
