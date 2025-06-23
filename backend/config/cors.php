
<?php
include_once __DIR__ . '/error_handler.php';

// Set error handler to ensure JSON responses
set_error_handler(function($severity, $message, $file, $line) {
    header('Content-Type: application/json');
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Handle CORS headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Access-Control-Expose-Headers: Content-Length, Content-Type, X-Total-Count");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Set default Accept header if not present
if (!isset($_SERVER['HTTP_ACCEPT'])) {
    $_SERVER['HTTP_ACCEPT'] = 'application/json';
}

// Only check Accept header for non-OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    if (!empty($accept) && strpos($accept, 'application/json') === false && 
        strpos($accept, '*/*') === false) {
        header('Content-Type: application/json');
        http_response_code(406);
        echo json_encode([
            "status" => "error",
            "message" => "Only JSON responses are supported. Please set Accept: application/json"
        ]);
        exit();
    }
}

// Clean any previous output
while (ob_get_level()) ob_end_clean();

// Setup output buffering with a callback to ensure clean JSON output
ob_start(function($output) {
    // If output is not empty and doesn't look like JSON
    if (!empty($output) && $output[0] !== '{' && $output[0] !== '[') {
        // Remove any whitespace before the first character
        $output = trim($output);
        // If it still doesn't look like JSON, wrap it
        if ($output[0] !== '{' && $output[0] !== '[') {
            return json_encode(["message" => strip_tags($output)]);
        }
    }
    return $output;
});

// Register shutdown function for fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Internal Server Error",
            "details" => $error['message'],
            "code" => $error['type']
        ]);
    } else {
        ob_end_flush();
    }
});
?>
