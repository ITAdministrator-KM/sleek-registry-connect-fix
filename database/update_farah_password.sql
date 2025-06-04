
-- Update Farah's password and ensure proper admin access
-- Password: 19930726

UPDATE users 
SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    status = 'active',
    role = 'admin'
WHERE username = 'Farah';

-- If user doesn't exist, create it
INSERT IGNORE INTO users (user_id, username, password, role, name, email, status, created_at) 
VALUES ('ADM001', 'Farah', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Farah Administrator', 'farah@dskalmunai.lk', 'active', NOW());

-- Also ensure staff and public test users exist
INSERT IGNORE INTO users (user_id, username, password, role, name, email, status, created_at) 
VALUES ('STF001', 'staff', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'Staff User', 'staff@dskalmunai.lk', 'active', NOW());

INSERT IGNORE INTO public_users (public_user_id, username, password_hash, name, email, nic, address, mobile, status, created_at) 
VALUES ('PUB00001', 'public', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Public User', 'public@dskalmunai.lk', '123456789V', 'Test Address', '0771234567', 'active', NOW());

-- Create user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);
