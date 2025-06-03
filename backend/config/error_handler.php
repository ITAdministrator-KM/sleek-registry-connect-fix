
<?php
function handleError($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "error",
        "message" => "Internal Server Error",
        "details" => $errstr,
        "code" => $errno
    ));
    die();
}

function handleException($e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "error",
        "message" => "Internal Server Error",
        "details" => $e->getMessage(),
        "code" => $e->getCode()
    ));
    die();
}

function sendError($httpCode, $message, $exception = null) {
    http_response_code($httpCode);
    $response = array(
        "status" => "error",
        "message" => $message
    );
    
    if ($exception && $exception instanceof Exception) {
        $response["details"] = $exception->getMessage();
        error_log("Error: " . $exception->getMessage());
    }
    
    echo json_encode($response);
    exit;
}

function sendSuccess($data = null, $message = "Success") {
    http_response_code(200);
    echo json_encode(array(
        "status" => "success",
        "message" => $message,
        "data" => $data
    ));
    exit;
}

// Add the missing sendResponse function
function sendResponse($httpCode, $response) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Set error handlers
set_error_handler("handleError");
set_exception_handler("handleException");

// Ensure errors don't get displayed directly
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Make sure all output is JSON
header('Content-Type: application/json');
?>
