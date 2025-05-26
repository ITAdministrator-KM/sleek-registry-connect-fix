
-- Updated DSK Database Structure for Divisional Secretariat KALMUNAI
-- Database: dskalmun_appDSK

-- Add new tables for enhanced functionality

-- Public users table (separate from main users table)
CREATE TABLE public_users (
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

-- Tokens table
CREATE TABLE tokens (
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
    INDEX idx_department_division_date (department_id, division_id, created_at),
    INDEX idx_token_date (created_at)
);

-- Service history table
CREATE TABLE service_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    department_id INT NOT NULL,
    division_id INT NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
    staff_user_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    recipient_type ENUM('public', 'staff', 'admin') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    department_id INT NOT NULL,
    division_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    purpose VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
    staff_user_id INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- QR codes table (for tracking QR code scans)
CREATE TABLE qr_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    scanned_by INT NOT NULL,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scan_location VARCHAR(100),
    purpose VARCHAR(200),
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample public users
INSERT INTO public_users (public_id, name, nic, address, mobile, email) VALUES 
('PUB001', 'Ahmed Mohamed', '199512345678', 'No. 123, Main Street, Kalmunai', '+94771234567', 'ahmed@example.com'),
('PUB002', 'Fatima Ibrahim', '198798765432', 'No. 456, Temple Road, Kalmunai', '+94779876543', 'fatima@example.com'),
('PUB003', 'Mohamed Ali', '200012345678', 'No. 789, Beach Road, Kalmunai', '+94771111111', 'ali@example.com');

-- Insert sample service history
INSERT INTO service_history (public_user_id, department_id, division_id, service_name, status) VALUES 
(1, 2, 3, 'Birth Certificate Application', 'completed'),
(1, 3, 6, 'COVID-19 Vaccination', 'completed'),
(2, 4, 7, 'School Admission', 'completed'),
(3, 2, 3, 'Marriage Certificate Application', 'processing');

-- Insert sample notifications
INSERT INTO notifications (recipient_id, recipient_type, title, message, type) VALUES 
(1, 'public', 'Service Completed', 'Your birth certificate application has been completed and is ready for collection.', 'success'),
(2, 'public', 'Appointment Reminder', 'You have an appointment scheduled for tomorrow at 10:00 AM.', 'info');

-- Create indexes for better performance
CREATE INDEX idx_public_users_nic ON public_users(nic);
CREATE INDEX idx_public_users_mobile ON public_users(mobile);
CREATE INDEX idx_service_history_user ON service_history(public_user_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, recipient_type);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
