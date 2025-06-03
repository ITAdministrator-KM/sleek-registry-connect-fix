
-- Create missing tables for full functionality

-- Tokens table for queue management
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    division_id INT,
    purpose TEXT,
    status ENUM('waiting', 'called', 'serving', 'completed', 'cancelled') DEFAULT 'waiting',
    public_user_id INT,
    staff_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    served_at TIMESTAMP NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (public_user_id) REFERENCES public_users(id),
    FOREIGN KEY (staff_user_id) REFERENCES users(id),
    INDEX idx_token_status (status, created_at),
    INDEX idx_department_tokens (department_id, status)
);

-- QR codes table for public users
CREATE TABLE IF NOT EXISTS qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,
    qr_code_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    INDEX idx_public_user (public_user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_type ENUM('all', 'public', 'staff', 'admin', 'individual') DEFAULT 'all',
    recipient_id INT NULL,
    department_id INT NULL,
    division_id INT NULL,
    status ENUM('draft', 'sent', 'failed') DEFAULT 'draft',
    sent_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES public_users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    INDEX idx_recipient (recipient_type, recipient_id),
    INDEX idx_status (status, created_at)
);

-- QR scan logs for tracking
CREATE TABLE IF NOT EXISTS qr_scan_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    scanned_by INT NOT NULL,
    scan_location VARCHAR(255),
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id),
    FOREIGN KEY (scanned_by) REFERENCES users(id),
    INDEX idx_public_user_scans (public_user_id, created_at),
    INDEX idx_scanner (scanned_by, created_at)
);

-- ID card generation logs
CREATE TABLE IF NOT EXISTS id_card_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    generated_by INT NOT NULL,
    card_type ENUM('individual', 'bulk') DEFAULT 'individual',
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id),
    FOREIGN KEY (generated_by) REFERENCES users(id),
    INDEX idx_public_user_cards (public_user_id, created_at),
    INDEX idx_generator (generated_by, created_at)
);

-- Update public_users table to include QR code field if not exists
ALTER TABLE public_users 
ADD COLUMN IF NOT EXISTS qr_code_data TEXT AFTER mobile,
ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR(255) AFTER qr_code_data;

-- Ensure user_sessions table has proper indexes
ALTER TABLE user_sessions 
ADD INDEX IF NOT EXISTS idx_user_valid_session (user_id, is_valid, expires_at);

-- Add some sample departments and divisions if they don't exist
INSERT IGNORE INTO departments (name, description, status) VALUES 
('General Services', 'General administrative services and inquiries', 'active'),
('Document Services', 'Birth certificates, marriage certificates, and other documents', 'active'),
('License Services', 'Business licenses and permits', 'active'),
('Social Services', 'Welfare and community services', 'active');

-- Add divisions for each department
INSERT IGNORE INTO divisions (name, department_id, description, status) VALUES 
('Reception', (SELECT id FROM departments WHERE name = 'General Services' LIMIT 1), 'General reception and information', 'active'),
('Complaints', (SELECT id FROM departments WHERE name = 'General Services' LIMIT 1), 'Public complaints and grievances', 'active'),
('Birth Registration', (SELECT id FROM departments WHERE name = 'Document Services' LIMIT 1), 'Birth certificate services', 'active'),
('Marriage Registration', (SELECT id FROM departments WHERE name = 'Document Services' LIMIT 1), 'Marriage certificate services', 'active'),
('Business Licenses', (SELECT id FROM departments WHERE name = 'License Services' LIMIT 1), 'Business registration and licensing', 'active'),
('Trade Permits', (SELECT id FROM departments WHERE name = 'License Services' LIMIT 1), 'Trade and commercial permits', 'active'),
('Welfare Programs', (SELECT id FROM departments WHERE name = 'Social Services' LIMIT 1), 'Social welfare and assistance programs', 'active'),
('Community Development', (SELECT id FROM departments WHERE name = 'Social Services' LIMIT 1), 'Community development initiatives', 'active');

-- Create default staff user if not exists
INSERT IGNORE INTO users (user_id, name, nic, email, username, password, role, department_id, status) 
SELECT 
    'STF-000001', 
    'Default Staff', 
    '123456789V', 
    'staff@dskalmunai.lk', 
    'staff', 
    '$argon2id$v=19$m=65536,t=4,p=3$example$hash', 
    'staff', 
    (SELECT id FROM departments WHERE name = 'General Services' LIMIT 1),
    'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'staff' AND role = 'staff');

-- Update the default staff password to a known value
UPDATE users SET password = '$argon2id$v=19$m=65536,t=4,p=3$YWRkT1B5NEZGaG1sYS9XNA$7rL7XLCMkKBjN9GlOEGM6YcGn3sGW5XpI0XL5rL7XLM' 
WHERE username = 'staff' AND role = 'staff';
