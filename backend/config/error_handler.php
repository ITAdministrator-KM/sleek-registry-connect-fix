<?php
function handleError($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Internal Server Error",
        "details" => $errstr,
        "code" => $errno
    ));
    die();
}

function handleException($e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Internal Server Error",
        "details" => $e->getMessage(),
        "code" => $e->getCode()
    ));
    die();
}

// Set error handlers
set_error_handler("handleError");
set_exception_handler("handleException");

// Ensure errors don't get displayed directly
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Make sure all output is JSON
header('Content-Type: application/json');
