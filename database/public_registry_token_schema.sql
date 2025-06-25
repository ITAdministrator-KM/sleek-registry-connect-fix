
-- Updated Public Registry Schema with Token Management
-- This schema supports both new and existing visitors with token generation

-- Update existing public_registry table to support token generation
ALTER TABLE public_registry 
ADD COLUMN token_number VARCHAR(20) NULL AFTER id,
ADD COLUMN token_status ENUM('waiting', 'called', 'served', 'expired') DEFAULT 'waiting' AFTER token_number,
ADD COLUMN estimated_time TIME NULL AFTER token_status,
ADD COLUMN served_at TIMESTAMP NULL AFTER estimated_time,
ADD COLUMN queue_position INT DEFAULT 0 AFTER served_at,
ADD INDEX idx_token_number (token_number),
ADD INDEX idx_token_status (token_status),
ADD INDEX idx_queue_position (queue_position);

-- Create tokens table for managing service tokens
CREATE TABLE IF NOT EXISTS service_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    registry_id INT NOT NULL,
    department_id INT NOT NULL,
    division_id INT NOT NULL,
    service_type VARCHAR(100) DEFAULT 'General Service',
    queue_position INT DEFAULT 0,
    status ENUM('waiting', 'called', 'serving', 'served', 'expired') DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    served_at TIMESTAMP NULL,
    estimated_time TIME NULL,
    actual_service_time INT DEFAULT 0 COMMENT 'Service time in minutes',
    staff_id INT NULL COMMENT 'Staff member who served',
    notes TEXT NULL,
    INDEX idx_token_number (token_number),
    INDEX idx_status (status),
    INDEX idx_department_division (department_id, division_id),
    INDEX idx_queue_position (queue_position),
    FOREIGN KEY (registry_id) REFERENCES public_registry(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create token_sequences table for managing token numbering per department/division
CREATE TABLE IF NOT EXISTS token_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    division_id INT NOT NULL,
    date DATE NOT NULL,
    last_token_number INT DEFAULT 0,
    department_code VARCHAR(10) NOT NULL,
    division_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_div_date (department_id, division_id, date),
    INDEX idx_date (date),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create visitor_qr_scans table for tracking QR code scans
CREATE TABLE IF NOT EXISTS visitor_qr_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    scanned_by_staff_id INT NOT NULL,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registry_id INT NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    status ENUM('success', 'failed', 'duplicate') DEFAULT 'success',
    INDEX idx_public_user (public_user_id),
    INDEX idx_scan_timestamp (scan_timestamp),
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (scanned_by_staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (registry_id) REFERENCES public_registry(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample department codes for token generation
INSERT INTO token_sequences (department_id, division_id, date, last_token_number, department_code, division_code)
SELECT 
    d.id as department_id,
    dv.id as division_id,
    CURDATE() as date,
    0 as last_token_number,
    UPPER(LEFT(d.name, 3)) as department_code,
    UPPER(LEFT(dv.name, 2)) as division_code
FROM departments d
CROSS JOIN divisions dv
WHERE d.status = 'active' AND dv.status = 'active'
ON DUPLICATE KEY UPDATE last_token_number = last_token_number;

-- Create stored procedure for generating token numbers
DELIMITER //
CREATE PROCEDURE sp_generate_token_number(
    IN p_department_id INT,
    IN p_division_id INT,
    OUT p_token_number VARCHAR(20),
    OUT p_queue_position INT
)
BEGIN
    DECLARE v_dept_code VARCHAR(10);
    DECLARE v_div_code VARCHAR(10);
    DECLARE v_last_number INT;
    DECLARE v_current_date DATE;
    
    SET v_current_date = CURDATE();
    
    -- Get department and division codes
    SELECT UPPER(LEFT(d.name, 3)), UPPER(LEFT(dv.name, 2))
    INTO v_dept_code, v_div_code
    FROM departments d
    JOIN divisions dv ON dv.id = p_division_id
    WHERE d.id = p_department_id;
    
    -- Get or create token sequence for today
    INSERT INTO token_sequences (department_id, division_id, date, last_token_number, department_code, division_code)
    VALUES (p_department_id, p_division_id, v_current_date, 0, v_dept_code, v_div_code)
    ON DUPLICATE KEY UPDATE last_token_number = last_token_number;
    
    -- Increment and get new token number
    UPDATE token_sequences 
    SET last_token_number = last_token_number + 1,
        updated_at = NOW()
    WHERE department_id = p_department_id 
      AND division_id = p_division_id 
      AND date = v_current_date;
    
    -- Get the new token number
    SELECT last_token_number INTO v_last_number
    FROM token_sequences
    WHERE department_id = p_department_id 
      AND division_id = p_division_id 
      AND date = v_current_date;
    
    -- Format token number: DEPTDIV-001
    SET p_token_number = CONCAT(v_dept_code, v_div_code, '-', LPAD(v_last_number, 3, '0'));
    
    -- Get queue position (count of waiting tokens for this department/division today)
    SELECT COUNT(*) + 1 INTO p_queue_position
    FROM service_tokens st
    WHERE st.department_id = p_department_id 
      AND st.division_id = p_division_id
      AND DATE(st.created_at) = v_current_date
      AND st.status IN ('waiting', 'called');
      
END //
DELIMITER ;

-- Create view for active tokens dashboard
CREATE OR REPLACE VIEW vw_active_tokens AS
SELECT 
    st.id,
    st.token_number,
    st.queue_position,
    st.status,
    st.estimated_time,
    st.created_at,
    pr.visitor_name,
    pr.visitor_nic,
    pr.purpose_of_visit,
    d.name as department_name,
    dv.name as division_name,
    TIMESTAMPDIFF(MINUTE, st.created_at, NOW()) as waiting_minutes
FROM service_tokens st
JOIN public_registry pr ON st.registry_id = pr.id
JOIN departments d ON st.department_id = d.id
JOIN divisions dv ON st.division_id = dv.id
WHERE st.status IN ('waiting', 'called', 'serving')
  AND DATE(st.created_at) = CURDATE()
ORDER BY st.department_id, st.division_id, st.queue_position;
