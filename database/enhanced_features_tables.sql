-- Ensure the new tables use utf8mb4 charset for better unicode support
-- Feel free to change engine to InnoDB if you want foreign key enforcement

-- Table: service_catalog
CREATE TABLE IF NOT EXISTS service_catalog (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    service_code VARCHAR(20) NOT NULL UNIQUE,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INT,
    division_id INT,
    icon VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    fee_amount DECIMAL(10,2) DEFAULT 0.00,
    required_documents JSON DEFAULT NULL,
    processing_time_days INT DEFAULT 7,
    eligibility_criteria TEXT,
    form_template_url VARCHAR(500),
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_department (department_id),
    INDEX idx_service_division (division_id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: enhanced_tokens
CREATE TABLE IF NOT EXISTS enhanced_tokens (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    division_id INT,
    service_request_id INT,
    public_user_id INT,
    status ENUM('waiting','called','serving','completed','cancelled','no_show') DEFAULT 'waiting',
    estimated_wait_time INT DEFAULT 15,
    called_at DATETIME DEFAULT NULL,
    served_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    counter_number VARCHAR(10) DEFAULT NULL,
    staff_user_id INT DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_token_number_department (token_number, department_id),
    INDEX idx_token_status (status),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table: service_requests
CREATE TABLE IF NOT EXISTS service_requests (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(50) NOT NULL UNIQUE,
    public_user_id INT NOT NULL,
    service_id INT NOT NULL,
    department_id INT NOT NULL,
    division_id INT DEFAULT NULL,
    status ENUM('pending','under_review','approved','rejected','completed','cancelled') DEFAULT 'pending',
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    submitted_documents JSON,
    staff_notes TEXT,
    public_notes TEXT,
    assigned_staff_user_id INT DEFAULT NULL,
    fee_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('unpaid','paid','waived','refunded') DEFAULT 'unpaid',
    estimated_completion DATE DEFAULT NULL,
    actual_completion DATETIME DEFAULT NULL,
    token_number VARCHAR(50) DEFAULT NULL,
    appointment_date DATETIME DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at),
    INDEX idx_public_user_status (public_user_id, status),
    INDEX idx_assigned_staff_status (assigned_staff_user_id, status),
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table: application_timeline
CREATE TABLE IF NOT EXISTS application_timeline (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    service_request_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    staff_user_id INT DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_request_created (service_request_id, created_at),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table: request_documents
CREATE TABLE IF NOT EXISTS request_documents (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    service_request_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT NULL,
    uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_request_document_type (service_request_id, document_type),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table: document_templates
CREATE TABLE IF NOT EXISTS document_templates (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    division_id INT DEFAULT NULL,
    file_path VARCHAR(500) DEFAULT NULL,
    file_type ENUM('pdf','doc','docx','xlsx') DEFAULT 'pdf',
    description TEXT,
    is_active ENUM('yes','no') DEFAULT 'yes',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;