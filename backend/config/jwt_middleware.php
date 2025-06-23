<?php
function verifyToken($requiredRole = null) {
    // Get the Authorization header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    // Check if token exists
    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'No token provided']);
        exit();
    }
    
    // Extract the token
    $token = str_replace('Bearer ', '', $authHeader);
    
    // Simple JWT verification (replace with your actual JWT verification logic)
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid token format']);
        exit();
    }
    
    // In a real app, you would verify the token signature here
    // For now, we'll just decode the payload
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
        exit();
    }
    
    // Check if token is expired
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Token expired']);
        exit();
    }
    
    // Check role if required
    if ($requiredRole && (!isset($payload['role']) || $payload['role'] !== $requiredRole)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Insufficient permissions']);
        exit();
    }
    
    return $payload;
}

// Helper function to require authentication
function requireAuth($requiredRole = null) {
    try {
        return verifyToken($requiredRole);
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Authentication failed: ' . $e->getMessage()]);
        exit();
    }
}
