<?php
// Script to update all API endpoints with response_handler.php
$baseDir = __DIR__ . '/backend/api';
$files = glob("$baseDir/**/*.php");

foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // Check if response_handler.php is already included
    if (strpos($content, 'response_handler.php') === false) {
        // Find the first include statement
        if (preg_match('/include_once.*\.php\';/', $content, $matches)) {
            $firstInclude = $matches[0];
            
            // Add response_handler.php after the last include
            $content = preg_replace(
                '/(include_once.*\.php\';(?:\s*include_once.*\.php\';)*)/s',
                "$1\ninclude_once '../../config/response_handler.php';",
                $content
            );
            
            file_put_contents($file, $content);
            echo "Updated $file\n";
        }
    }
}
?>
