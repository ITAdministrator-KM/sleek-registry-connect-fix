
-- Create service_requests table for the multi-step booking form
CREATE TABLE IF NOT EXISTS service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    department_id INT,
    division_id INT,
    purpose TEXT,
    required_documents JSON,
    status ENUM('pending', 'processing', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_completion DATE,
    fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_status ENUM('unpaid', 'paid', 'waived') DEFAULT 'unpaid',
    notes TEXT,
    token_number VARCHAR(50),
    appointment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    INDEX idx_public_user_requests (public_user_id, status),
    INDEX idx_service_type (service_type),
    INDEX idx_status_date (status, created_at)
);

-- Create service_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    purpose TEXT,
    department_id INT,
    division_id INT,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    INDEX idx_public_user_history (public_user_id, created_at),
    INDEX idx_service_status (service_type, status)
);

-- Add missing columns to notifications table if they don't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info' AFTER message,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE AFTER type;

-- Ensure notifications table has proper structure
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    recipient_type ENUM('public', 'staff', 'admin') DEFAULT 'public',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient_type, recipient_id, is_read),
    INDEX idx_created (created_at)
);
