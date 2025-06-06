-- Fix staff login for user 'Ansar' with password '1985@1234'
-- This script will add or update the staff user with the correct password hash

-- First, check if the user exists
SELECT username, password, 
       password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' AS password_matches
FROM users 
WHERE username = 'Ansar';