
-- Update admin password to "password" (hashed)
-- Run this after importing the main database

UPDATE users 
SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'admin';

-- This password hash corresponds to "password"
-- The admin should change this immediately after first login
