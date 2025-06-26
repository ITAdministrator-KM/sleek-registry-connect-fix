
-- Add missing tables and columns for the staff dashboard functionality

-- Create public_registry table if not exists
CREATE TABLE IF NOT EXISTS public_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_nic VARCHAR(20) NOT NULL,
    visitor_address TEXT,
    visitor_phone VARCHAR(20),
    department_id INT NOT NULL,
    division_id INT,
    purpose_of_visit TEXT NOT NULL,
    remarks TEXT,
    visitor_type ENUM('new', 'existing') DEFAULT 'existing',
    staff_id INT,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    INDEX idx_public_user_id (public_user_id),
    INDEX idx_department_id (department_id),
    INDEX idx_entry_time (entry_time),
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Create tokens table if not exists
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    registry_id INT,
    department_id INT NOT NULL,
    division_id INT,
    public_user_id INT,
    service_type VARCHAR(100),
    priority_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    status ENUM('waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show') DEFAULT 'waiting',
    queue_position INT,
    estimated_wait_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    served_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    staff_id INT,
    INDEX idx_token_number (token_number),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (registry_id) REFERENCES public_registry(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    target_type ENUM('all', 'individual', 'department', 'division') NOT NULL,
    target_id INT NULL,
    sender_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_target_type (target_type),
    INDEX idx_target_id (target_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (sender_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Add username column to public_users if not exists
ALTER TABLE public_users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE AFTER email;

-- Update existing public_users to have usernames if they don't
UPDATE public_users 
SET username = CONCAT('user_', id) 
WHERE username IS NULL OR username = '';
