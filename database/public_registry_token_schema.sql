
-- Updated Public Registry Schema with Token Management System
-- Using UUID for all IDs and comprehensive token management

-- Update existing public_registry table to use UUID and add token support
DROP TABLE IF EXISTS public_registry;
CREATE TABLE public_registry (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    visitor_id VARCHAR(36) NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_nic VARCHAR(15) NOT NULL,
    visitor_phone VARCHAR(20) NULL,
    visitor_address TEXT NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    division_id VARCHAR(36) NOT NULL,
    division_name VARCHAR(255) NOT NULL,
    purpose_of_visit TEXT NOT NULL,
    remarks TEXT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    status ENUM('active', 'checked_out', 'deleted') DEFAULT 'active',
    created_by VARCHAR(36) NULL,
    updated_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_department_division (department_id, division_id),
    INDEX idx_entry_time (entry_time),
    INDEX idx_status (status),
    INDEX idx_visitor_nic (visitor_nic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create comprehensive service_tokens table
DROP TABLE IF EXISTS service_tokens;
CREATE TABLE service_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    token_number VARCHAR(20) NOT NULL UNIQUE,
    registry_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    division_id VARCHAR(36) NOT NULL,
    service_type VARCHAR(100) DEFAULT 'General Service',
    queue_position INT DEFAULT 0,
    status ENUM('waiting', 'called', 'serving', 'served', 'cancelled', 'expired') DEFAULT 'waiting',
    priority_level ENUM('normal', 'urgent', 'vip') DEFAULT 'normal',
    estimated_service_time INT DEFAULT 15 COMMENT 'Estimated service time in minutes',
    actual_service_time INT NULL COMMENT 'Actual service time in minutes',
    wait_time_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    serving_started_at TIMESTAMP NULL,
    served_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    staff_id VARCHAR(36) NULL COMMENT 'Staff member who served',
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    updated_by VARCHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_token_number (token_number),
    INDEX idx_status (status),
    INDEX idx_department_division (department_id, division_id),
    INDEX idx_queue_position (queue_position),
    INDEX idx_created_at (created_at),
    INDEX idx_priority_level (priority_level),
    FOREIGN KEY (registry_id) REFERENCES public_registry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create token_sequences table for managing daily token numbering
DROP TABLE IF EXISTS token_sequences;
CREATE TABLE token_sequences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    department_id VARCHAR(36) NOT NULL,
    division_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    last_token_number INT DEFAULT 0,
    department_code VARCHAR(10) NOT NULL,
    division_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_div_date (department_id, division_id, date),
    INDEX idx_date (date),
    INDEX idx_department_division (department_id, division_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create token_queue_management table for real-time queue tracking
DROP TABLE IF EXISTS token_queue_management;
CREATE TABLE token_queue_management (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    department_id VARCHAR(36) NOT NULL,
    division_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    total_tokens_issued INT DEFAULT 0,
    tokens_served INT DEFAULT 0,
    tokens_waiting INT DEFAULT 0,
    tokens_cancelled INT DEFAULT 0,
    average_service_time DECIMAL(5,2) DEFAULT 0.00,
    longest_wait_time INT DEFAULT 0,
    current_serving_token VARCHAR(20) NULL,
    last_called_token VARCHAR(20) NULL,
    estimated_wait_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_div_date_queue (department_id, division_id, date),
    INDEX idx_date (date),
    INDEX idx_department_division (department_id, division_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create token_audit_log for comprehensive audit trail
DROP TABLE IF EXISTS token_audit_log;
CREATE TABLE token_audit_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    token_id VARCHAR(36) NOT NULL,
    action_type ENUM('created', 'called', 'serving', 'served', 'cancelled', 'status_change') NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    action_by VARCHAR(36) NULL,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    INDEX idx_token_id (token_id),
    INDEX idx_action_type (action_type),
    INDEX idx_action_timestamp (action_timestamp),
    FOREIGN KEY (token_id) REFERENCES service_tokens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create visitor_qr_scans table for QR code tracking
DROP TABLE IF EXISTS visitor_qr_scans;
CREATE TABLE visitor_qr_scans (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    public_user_id VARCHAR(36) NOT NULL,
    scanned_by_staff_id VARCHAR(36) NOT NULL,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registry_id VARCHAR(36) NULL,
    scan_result ENUM('success', 'failed', 'duplicate', 'invalid') DEFAULT 'success',
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    notes TEXT NULL,
    INDEX idx_public_user (public_user_id),
    INDEX idx_scan_timestamp (scan_timestamp),
    INDEX idx_scan_result (scan_result),
    FOREIGN KEY (registry_id) REFERENCES public_registry(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add CHECK constraints for data validation
ALTER TABLE service_tokens 
ADD CONSTRAINT chk_queue_position CHECK (queue_position >= 0),
ADD CONSTRAINT chk_service_times CHECK (actual_service_time IS NULL OR actual_service_time >= 0),
ADD CONSTRAINT chk_wait_time CHECK (wait_time_minutes >= 0);

ALTER TABLE token_queue_management
ADD CONSTRAINT chk_token_counts CHECK (
    total_tokens_issued >= 0 AND 
    tokens_served >= 0 AND 
    tokens_waiting >= 0 AND 
    tokens_cancelled >= 0 AND
    (tokens_served + tokens_waiting + tokens_cancelled) <= total_tokens_issued
);
