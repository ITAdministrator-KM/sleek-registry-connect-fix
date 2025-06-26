
-- Create public_registry table for visitor management
CREATE TABLE IF NOT EXISTS public_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registry_id VARCHAR(50) UNIQUE NOT NULL,
    public_user_id INT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_nic VARCHAR(20) NOT NULL,
    visitor_address TEXT,
    visitor_phone VARCHAR(20),
    department_id INT NOT NULL,
    division_id INT NULL,
    purpose_of_visit VARCHAR(255) NOT NULL,
    remarks TEXT,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    visitor_type ENUM('new', 'existing') NOT NULL,
    status ENUM('active', 'checked_out', 'deleted') DEFAULT 'active',
    staff_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_registry_entry_time (entry_time),
    INDEX idx_registry_department (department_id),
    INDEX idx_registry_visitor_type (visitor_type),
    INDEX idx_registry_status (status),
    INDEX idx_registry_date_status (DATE(entry_time), status)
);

-- Update public_users table to ensure public_user_id column exists
ALTER TABLE public_users 
ADD COLUMN IF NOT EXISTS public_user_id VARCHAR(20) UNIQUE AFTER id;

-- Update existing records to have public_user_id if they don't
UPDATE public_users 
SET public_user_id = public_id 
WHERE public_user_id IS NULL AND public_id IS NOT NULL;

-- Ensure public_user_id is generated for records without it
UPDATE public_users 
SET public_user_id = CONCAT('PUB', LPAD(id, 5, '0'))
WHERE public_user_id IS NULL;
