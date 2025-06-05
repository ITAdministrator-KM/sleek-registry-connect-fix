-- Verify staff user 'Ansar' exists and is active
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
    username = 'Ansar' 
    AND role = 'staff' 
    AND status = 'active';

-- Check login credentials (manually verify the password hash matches '1985@1234')
SELECT 
    username,
    password,
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' AS password_matches
FROM 
    users 
WHERE 
    username = 'Ansar';
