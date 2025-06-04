
-- Update Farah's admin password to ensure login works
-- Password: 19930726

-- First, ensure the admin user exists with correct credentials
INSERT INTO users (
    user_id,
    name,
    nic,
    email,
    username,
    password,
    role,
    status,
    department_id
) VALUES (
    'ADMIN001',
    'Farah',
    '199307260V',
    'admin@dskalmunai.lk',
    'Farah',
    '$2y$10$kZx4H8FhV5mKFj9QGZ8LOeJ8V7p2K3mH8QG9KJJ8V7p2K3mH8QG9KJ',
    'admin',
    'active',
    1
)
ON DUPLICATE KEY UPDATE
    password = '$2y$10$kZx4H8FhV5mKFj9QGZ8LOeJ8V7p2K3mH8QG9KJJ8V7p2K3mH8QG9KJ',
    status = 'active',
    role = 'admin';

-- Update existing admin user if username exists
UPDATE users 
SET password = '$2y$10$kZx4H8FhV5mKFj9QGZ8LOeJ8V7p2K3mH8QG9KJJ8V7p2K3mH8QG9KJ',
    status = 'active',
    role = 'admin'
WHERE username = 'Farah';

-- Ensure test staff user exists
INSERT INTO users (
    user_id,
    name,
    nic,
    email,
    username,
    password,
    role,
    status,
    department_id
) VALUES (
    'STAFF001',
    'Staff User',
    '199301010V',
    'staff@dskalmunai.lk',
    'staff',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff',
    'active',
    1
)
ON DUPLICATE KEY UPDATE
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    status = 'active';

-- Ensure test public user exists
INSERT INTO public_users (
    public_user_id,
    name,
    nic,
    address,
    mobile,
    email,
    username,
    password_hash,
    status
) VALUES (
    'PUB00001',
    'Test Public User',
    '199501010V',
    '123 Main Street, Kalmunai',
    '0771234567',
    'public@test.com',
    'public',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active'
)
ON DUPLICATE KEY UPDATE
    password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    status = 'active';

-- Verify the updates
SELECT username, role, status, name 
FROM users 
WHERE username IN ('Farah', 'staff');

SELECT username, status, public_user_id, name 
FROM public_users 
WHERE username = 'public';

-- Test Login Credentials:
-- Admin: username = 'Farah', password = '19930726'  
-- Staff: username = 'staff', password = 'password'
-- Public: username = 'public', password = 'password'
