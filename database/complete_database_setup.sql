
-- Complete Database Setup for DSK Application
-- Run this script in your MySQL database 'dskalmun_appDSK'

-- Create departments table if not exists
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create divisions table if not exists
CREATE TABLE IF NOT EXISTS divisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_division_per_department (name, department_id)
);

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL,
    department_id INT NULL,
    division_id INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL
);

-- Create public_users table
CREATE TABLE IF NOT EXISTS public_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    mobile VARCHAR(20),
    email VARCHAR(100),
    photo_url VARCHAR(500),
    department_id INT NULL,
    division_id INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number INT NOT NULL,
    department_id INT NOT NULL,
    division_id INT NOT NULL,
    public_user_id INT NULL,
    status ENUM('active', 'called', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    INDEX idx_token_date (created_at),
    INDEX idx_token_status (status)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    department_id INT,
    division_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    staff_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create service_history table
CREATE TABLE IF NOT EXISTS service_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    department_id INT,
    division_id INT,
    service_name VARCHAR(255) NOT NULL,
    status ENUM('completed', 'pending', 'processing') DEFAULT 'pending',
    details TEXT,
    staff_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    recipient_type ENUM('public', 'staff') DEFAULT 'public',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create qr_scans table
CREATE TABLE IF NOT EXISTS qr_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    staff_user_id INT NOT NULL,
    scan_location VARCHAR(255),
    scan_purpose VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username_ip (username, ip_address),
    INDEX idx_attempt_time (attempt_time)
);

-- Create login_history table for audit
CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample departments
INSERT IGNORE INTO departments (name, description) VALUES 
('Health Services', 'Public health and medical services'),
('Education Services', 'Educational programs and services'),
('Social Services', 'Community and social welfare services'),
('Administrative Services', 'General administrative services');

-- Insert sample divisions
INSERT IGNORE INTO divisions (name, department_id, description) VALUES 
('Primary Healthcare', 1, 'Basic healthcare services'),
('Maternal Health', 1, 'Maternal and child health services'),
('Primary Education', 2, 'Elementary education services'),
('Adult Education', 2, 'Adult literacy and education programs'),
('Welfare Programs', 3, 'Social welfare and assistance programs'),
('Community Development', 3, 'Community development initiatives'),
('Registration Services', 4, 'Birth, death, and other registrations'),
('Licensing Services', 4, 'Various licensing and permits');

-- Insert admin user (password: password)
INSERT IGNORE INTO users (user_id, name, nic, email, username, password, role, department_id, division_id) VALUES 
('USR001', 'System Administrator', '123456789V', 'admin@dskalmunai.lk', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, 1);

-- Insert sample staff users (password: password)
INSERT IGNORE INTO users (user_id, name, nic, email, username, password, role, department_id, division_id) VALUES 
('USR002', 'Ansar Mohamed', '987654321V', 'ansar@dskalmunai.lk', 'Ansar', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 1, 1),
('USR003', 'Fatima Hassan', '456789123V', 'fatima@dskalmunai.lk', 'fatima', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 2, 3),
('USR004', 'Ahmed Ali', '789123456V', 'ahmed@dskalmunai.lk', 'ahmed', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 3, 5);

-- Insert sample public users
INSERT IGNORE INTO public_users (public_id, name, nic, address, mobile, email, department_id, division_id) VALUES 
('PUB001', 'Mohamed Ibrahim', '111222333V', '123 Main St, Kalmunai', '0771234567', 'mohamed@example.com', 1, 1),
('PUB002', 'Aisha Rahman', '444555666V', '456 Second St, Kalmunai', '0777654321', 'aisha@example.com', 2, 3),
('PUB003', 'Hassan Abdullah', '777888999V', '789 Third St, Kalmunai', '0769876543', 'hassan@example.com', 3, 5);
