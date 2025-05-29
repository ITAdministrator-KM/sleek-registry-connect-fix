<?php
function verifyToken($token) {
    try {
        if (!$token) {
            throw new Exception('No token provided');
        }

        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            throw new Exception('Invalid token format');
        }

        $payload = json_decode(base64_decode($tokenParts[1]), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            throw new Exception('Token expired or invalid');
        }

        return $payload;
    } catch (Exception $e) {
        throw new Exception('Authentication failed: ' . $e->getMessage());
    }
}

function getAuthToken() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        throw new Exception('No authentication token provided');
    }
    
    return $matches[1];
}

function authenticate() {
    try {
        $token = getAuthToken();
        return verifyToken($token);
    } catch (Exception $e) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
        exit;
    }
}
