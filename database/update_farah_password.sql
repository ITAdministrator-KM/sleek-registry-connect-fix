
-- Update Farah's admin password
-- This will update the password for user 'Farah' to '19930726'

-- First, create or update the admin user 'Farah'
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

-- Create default staff user if not exists
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
    'STAFF001',
    'Staff User',
    '199301010V',
    'staff@dskalmunai.lk',
    'staff',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff',
    'active'
)
ON DUPLICATE KEY UPDATE
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    status = 'active';

-- Create a test public user
INSERT INTO public_users (
    public_user_id,
    name,
    nic,
    email,
    mobile,
    username,
    password_hash,
    status
) VALUES (
    'PUB001',
    'Test Public User',
    '199501010V',
    'public@test.com',
    '0771234567',
    'public',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active'
)
ON DUPLICATE KEY UPDATE
    password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    status = 'active';

-- To verify the update:
SELECT username, role, status 
FROM users 
WHERE username IN ('Farah', 'staff');

SELECT username, status 
FROM public_users 
WHERE username = 'public';
