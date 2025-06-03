-- Update Farah's admin password
-- This will update the password for user 'Farah' to '19930726'

-- First, verify the admin user exists and update if necessary
INSERT INTO users (
    user_id,
    name,
    nic,
    email,
    username,
    password,
    role,
    status
) VALUES (
    'ADMIN001',
    'Farah',
    '199307260V',
    'admin@dskalmunai.lk',
    'Farah',
    '$2y$10$4W8NZDSpXu.iPAyXZuZE5.cQmIhV3IRGHrVBX8SAV90G5hh.Z41Uy',
    'admin',
    'active'
)
ON DUPLICATE KEY UPDATE
    password = '$2y$10$4W8NZDSpXu.iPAyXZuZE5.cQmIhV3IRGHrVBX8SAV90G5hh.Z41Uy',
    status = 'active',
    role = 'admin';

-- If you just want to update the password for an existing user:
UPDATE users 
SET password = '$2y$10$4W8NZDSpXu.iPAyXZuZE5.cQmIhV3IRGHrVBX8SAV90G5hh.Z41Uy',
    status = 'active'
WHERE username = 'Farah';

-- To verify the update:
SELECT username, role, status 
FROM users 
WHERE username = 'Farah';
