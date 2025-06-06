-- Fix staff login issues
-- This script will update staff users with properly hashed passwords

-- Enable strict mode
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- Update Ansar's password to '1985@1234' using Argon2id
UPDATE users 
SET 
    password = '$argon2id$v=19$m=65536,t=4,p=1$T0V5b1E2bk92TU9IM1IxTQ$00XzaMVBR0sJP8wlNzh3TTjkirtYvdqrOIc9uH4kBa4',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'Ansar';

-- Update Staff User's password to 'password'
UPDATE users 
SET 
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'staff';

-- Verify the updates
SELECT 
    id,
    user_id,
    username,
    name,
    email,
    role,
    status,
    created_at,
    updated_at
FROM 
    users 
WHERE 
    role = 'staff' 
    AND status = 'active';

-- Add a test staff user if needed
INSERT INTO users (
    user_id,
    username,
    password,
    name,
    email,
    role,
    status,
    nic
) VALUES (
    'TEST001',
    'teststaff',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'Test Staff',
    'teststaff@dskalmunai.lk',
    'staff',
    'active',
    '199000000000'
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    updated_at = CURRENT_TIMESTAMP;

-- Verify the test user was created
SELECT * FROM users WHERE username = 'teststaff';
