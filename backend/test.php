<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'Backend server is running',
    'time' => date('Y-m-d H:i:s')
]);
?>
