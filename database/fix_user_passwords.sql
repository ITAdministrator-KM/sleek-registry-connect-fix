
-- Fix user passwords with proper hashing
-- Run this script to ensure test users can login

-- Update admin user (Farah) with password 'password'
UPDATE users 
SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'Farah';

-- Update staff user (Farhana) with password 'password'  
UPDATE users 
SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'Farhana';

-- Create a test admin user if Farah doesn't exist
INSERT IGNORE INTO users (user_id, username, password, name, email, role, status) 
VALUES ('ADMIN001', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@dsk.lk', 'admin', 'active');

-- Create a test staff user if needed
INSERT IGNORE INTO users (user_id, username, password, name, email, role, status) 
VALUES ('STAFF001', 'staff', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff Member', 'staff@dsk.lk', 'staff', 'active');

-- Update public user (anzar) with password 'password'
UPDATE public_users 
SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'anzar';

-- Create a test public user if needed
INSERT IGNORE INTO public_users (public_user_id, username, password_hash, name, email, status) 
VALUES ('PUB001', 'public', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Public User', 'public@example.com', 'active');

-- Verify the users exist
SELECT 'Admin Users:' as type, username, role, status FROM users WHERE role IN ('admin', 'staff')
UNION ALL
SELECT 'Public Users:' as type, username, 'public' as role, status FROM public_users;
