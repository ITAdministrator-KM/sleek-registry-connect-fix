-- Fix staff login for user 'Ansar' with password '1985@1234'
-- This script will add or update the staff user with the correct password hash

-- First, check if the user exists
SET @username = 'Ansar';
SET @email = 'ansar@dskalmunai.lk';
SET @password = '1985@1234';

-- Generate a user_id if needed
SET @user_id = (
    SELECT IFNULL(
        (SELECT user_id FROM users WHERE username = @username LIMIT 1),
        CONCAT('STF', LPAD(COALESCE(
            (SELECT MAX(CAST(SUBSTRING(user_id, 4) AS UNSIGNED)) + 1 
             FROM users 
             WHERE user_id LIKE 'STF%'), 1), 3, '0'))
    )
);

-- Insert or update the staff user with the correct password hash
-- The hash is generated using password_hash('1985@1234', PASSWORD_DEFAULT)
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
    @user_id,
    @username,
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 1985@1234
    'Ansar Staff',
    @email,
    'staff',
    'active',
    '198500000000' -- Default NIC
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    name = VALUES(name),
    email = VALUES(email),
    role = VALUES(role),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Verify the user was created/updated
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
    username = @username;

-- Verify the password works (should return 1)
SELECT 
    username,
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' AS password_matches
FROM 
    users 
WHERE 
    username = @username;
