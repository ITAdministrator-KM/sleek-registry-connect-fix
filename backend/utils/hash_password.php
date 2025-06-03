<?php
$password = 'Ansar@1985';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Password hash for 'Ansar@1985': " . $hash . "\n";
?>
