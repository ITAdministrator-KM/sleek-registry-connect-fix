<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'Backend API is working!',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
