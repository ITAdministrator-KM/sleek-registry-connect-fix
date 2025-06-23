-- Update public_users table
ALTER TABLE public_users
ADD COLUMN qr_code VARCHAR(100) NULL AFTER public_id,
ADD COLUMN email_verified_at TIMESTAMP NULL AFTER email,
ADD COLUMN last_visit TIMESTAMP NULL AFTER updated_at,
ADD COLUMN visit_count INT DEFAULT 0 AFTER last_visit,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER status,
ADD COLUMN created_by INT NULL AFTER is_active,
MODIFY COLUMN public_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Format: PUB-YYYYMMDD-XXXXX',
ADD INDEX idx_public_id (public_id),
ADD INDEX idx_nic (nic),
ADD INDEX idx_status (status);

-- Update public_registry table
ALTER TABLE public_registry
ADD COLUMN checked_out_at TIMESTAMP NULL AFTER entry_time,
ADD COLUMN checked_out_by INT NULL AFTER checked_out_at,
ADD COLUMN is_exported BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN export_format VARCHAR(10) NULL AFTER is_exported,
ADD COLUMN export_path VARCHAR(255) NULL AFTER export_format,
ADD COLUMN export_date TIMESTAMP NULL AFTER export_path,
ADD COLUMN export_by INT NULL AFTER export_date,
ADD INDEX idx_visitor_type (visitor_type),
ADD INDEX idx_entry_date (DATE(entry_time)),
ADD INDEX idx_export_status (is_exported, export_date);

-- Create a new table for tracking exports
CREATE TABLE IF NOT EXISTS registry_exports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    export_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exported_by INT NOT NULL,
    export_format VARCHAR(10) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    entry_count INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    department_id INT NULL,
    division_id INT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    INDEX idx_export_date (export_date),
    INDEX idx_export_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a view for public registry reports
CREATE OR REPLACE VIEW vw_public_registry_reports AS
SELECT 
    pr.id,
    pr.registry_id,
    pr.visitor_name,
    pr.visitor_nic,
    pr.visitor_phone,
    d.name AS department_name,
    dv.name AS division_name,
    pr.purpose_of_visit,
    pr.entry_time,
    pr.checked_out_at,
    pr.visitor_type,
    pr.status,
    pr.created_at,
    pr.updated_at
FROM public_registry pr
LEFT JOIN departments d ON pr.department_id = d.id
LEFT JOIN divisions dv ON pr.division_id = dv.id
WHERE pr.status = 'active';

-- Create a stored procedure for generating reports
DELIMITER //
CREATE PROCEDURE sp_generate_registry_report(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_department_id INT,
    IN p_division_id INT
)
BEGIN
    SELECT 
        pr.*,
        d.name AS department_name,
        dv.name AS division_name,
        u.name AS checked_out_by_name
    FROM public_registry pr
    LEFT JOIN departments d ON pr.department_id = d.id
    LEFT JOIN divisions dv ON pr.division_id = dv.id
    LEFT JOIN users u ON pr.checked_out_by = u.id
    WHERE 
        DATE(pr.entry_time) BETWEEN p_start_date AND p_end_date
        AND (p_department_id IS NULL OR pr.department_id = p_department_id)
        AND (p_division_id IS NULL OR pr.division_id = p_division_id)
        AND pr.status = 'active'
    ORDER BY pr.entry_time DESC;
END //
DELIMITER ;
