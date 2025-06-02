
<?php
function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function validateToken($authHeader) {
    if (!$authHeader) {
        return false;
    }
    
    $token = getBearerToken();
    if (!$token) {
        return false;
    }
    
    try {
        // Simple token validation - you can enhance this with JWT validation
        $database = new Database();
        $db = $database->getConnection();
        
        $stmt = $db->prepare("SELECT u.*, s.expires_at FROM user_sessions s 
                             JOIN users u ON s.user_id = u.id 
                             WHERE s.token = :token AND s.is_valid = 1 AND s.expires_at > NOW()");
        $stmt->bindParam(":token", $token);
        $stmt->execute();
        
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($session) {
            return [
                'id' => $session['id'],
                'username' => $session['username'],
                'role' => $session['role'],
                'department_id' => $session['department_id'],
                'division_id' => $session['division_id']
            ];
        }
        
        return false;
    } catch (Exception $e) {
        error_log("Token validation error: " . $e->getMessage());
        return false;
    }
}
?>
