-- Appointments table
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
    FOREIGN KEY (public_user_id) REFERENCES public_users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (staff_user_id) REFERENCES users(id)
);

-- Service History table
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
    FOREIGN KEY (public_user_id) REFERENCES public_users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (staff_user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    recipient_type ENUM('public', 'staff') DEFAULT 'public',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES public_users(id)
);

-- QR Scans table
CREATE TABLE IF NOT EXISTS qr_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    staff_user_id INT NOT NULL,
    scan_location VARCHAR(255),
    scan_purpose VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id),
    FOREIGN KEY (staff_user_id) REFERENCES users(id)
);

-- Login attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username_ip (username, ip_address),
    INDEX idx_attempt_time (attempt_time)
);

-- Login history table for audit
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
