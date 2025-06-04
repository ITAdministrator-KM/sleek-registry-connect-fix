
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

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function validateToken($authHeader) {
    if (!$authHeader) {
        error_log("[Auth] No authorization header present");
        return false;
    }
    
    $token = getBearerToken();
    if (!$token) {
        error_log("[Auth] No bearer token found in header");
        return false;
    }
    
    try {
        // Validate JWT token structure
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            error_log("[Auth] Invalid JWT token structure");
            return false;
        }
        
        // Decode payload
        $payload = json_decode(base64url_decode($parts[1]), true);
        if (!$payload) {
            error_log("[Auth] Invalid JWT payload");
            return false;
        }
        
        // Check if token has expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            error_log("[Auth] Token has expired");
            return false;
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        // First verify the token exists and is valid in the sessions table
        $stmt = $db->prepare("SELECT u.id, u.username, u.role, u.department_id, u.division_id, s.expires_at 
                             FROM user_sessions s 
                             JOIN users u ON s.user_id = u.id 
                             WHERE s.token = ? 
                             AND s.is_valid = 1 
                             AND s.expires_at > NOW()");
        $stmt->execute([$token]);
        
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            // Also check public users if not found in regular users
            $stmt = $db->prepare("SELECT pu.id, pu.username, 'public' as role, pu.department_id, pu.division_id, s.expires_at 
                                 FROM user_sessions s 
                                 JOIN public_users pu ON s.user_id = pu.id 
                                 WHERE s.token = ? 
                                 AND s.is_valid = 1 
                                 AND s.expires_at > NOW()");
            $stmt->execute([$token]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$session) {
            error_log("[Auth] No valid session found for token");
            // Invalidate expired or invalid tokens
            $db->prepare("UPDATE user_sessions SET is_valid = 0 WHERE token = ?")->execute([$token]);
            return false;
        }
        
        return [
            'id' => $session['id'],
            'username' => $session['username'],
            'role' => $session['role'],
            'department_id' => $session['department_id'],
            'division_id' => $session['division_id']
        ];
        
    } catch (Exception $e) {
        error_log("Token validation error: " . $e->getMessage());
        return false;
    }
}

function invalidateToken($token) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $stmt = $db->prepare("UPDATE user_sessions SET is_valid = 0 WHERE token = ?");
        return $stmt->execute([$token]);
    } catch (Exception $e) {
        error_log("[Auth] Error invalidating token: " . $e->getMessage());
        return false;
    }
}

function cleanupExpiredSessions() {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Mark expired sessions as invalid
        $stmt = $db->prepare("UPDATE user_sessions 
                             SET is_valid = FALSE 
                             WHERE expires_at < NOW() AND is_valid = TRUE");
        $stmt->execute();
        
        // Log cleanup results
        $rowCount = $stmt->rowCount();
        if ($rowCount > 0) {
            error_log("[Auth] Cleaned up {$rowCount} expired sessions");
        }
        
        return true;
    } catch (Exception $e) {
        error_log("[Auth] Error cleaning up sessions: " . $e->getMessage());
        return false;
    }
}
?>
