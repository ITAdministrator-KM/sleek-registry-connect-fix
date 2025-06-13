
-- Enhanced Database Tables for Improved DSK Application
-- Add these tables to your existing database

-- Service catalog table for managing available services
CREATE TABLE IF NOT EXISTS service_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(200) NOT NULL,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    department_id INT NOT NULL,
    division_id INT,
    icon VARCHAR(100),
    fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    required_documents JSON,
    processing_time_days INT DEFAULT 7,
    eligibility_criteria TEXT,
    form_template_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    INDEX idx_service_department (department_id, is_active),
    INDEX idx_service_code (service_code)
);

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    department_id INT NOT NULL,
    division_id INT,
    file_path VARCHAR(500),
    file_type ENUM('pdf', 'doc', 'docx', 'xlsx') DEFAULT 'pdf',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL
);

-- Enhanced service requests table (if not exists)
CREATE TABLE IF NOT EXISTS service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    public_user_id INT NOT NULL,
    service_id INT NOT NULL,
    department_id INT NOT NULL,
    division_id INT,
    status ENUM('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    submitted_documents JSON,
    staff_notes TEXT,
    public_notes TEXT,
    assigned_staff_id INT,
    fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_status ENUM('unpaid', 'paid', 'waived', 'refunded') DEFAULT 'unpaid',
    estimated_completion DATE,
    actual_completion DATETIME,
    token_number VARCHAR(50),
    appointment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_request_status (status, created_at),
    INDEX idx_request_user (public_user_id, status),
    INDEX idx_request_staff (assigned_staff_id, status)
);

-- Enhanced tokens table with department-specific numbering
CREATE TABLE IF NOT EXISTS enhanced_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    division_id INT,
    service_request_id INT,
    public_user_id INT,
    status ENUM('waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show') DEFAULT 'waiting',
    estimated_wait_time INT DEFAULT 15,
    called_at DATETIME,
    served_at DATETIME,
    completed_at DATETIME,
    counter_number VARCHAR(10),
    staff_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_token_dept_status (department_id, status, created_at),
    INDEX idx_token_date (DATE(created_at), department_id)
);

-- Application timeline for tracking request progress
CREATE TABLE IF NOT EXISTS application_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_request_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    staff_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_timeline_request (service_request_id, created_at)
);

-- Document uploads for service requests
CREATE TABLE IF NOT EXISTS request_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_request_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    INDEX idx_doc_request (service_request_id)
);

-- Enhanced notifications with categories
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category ENUM('service_update', 'appointment', 'payment', 'general', 'urgent') DEFAULT 'general' AFTER type,
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500) AFTER category,
ADD COLUMN IF NOT EXISTS expires_at DATETIME AFTER action_url;

-- QR codes table for public users (if not exists)
CREATE TABLE IF NOT EXISTS qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_user_id INT NOT NULL,
    qr_code_data TEXT NOT NULL,
    qr_code_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE,
    INDEX idx_qr_user (public_user_id)
);

-- Insert sample service catalog data
INSERT INTO service_catalog (service_name, service_code, description, department_id, icon, fee_amount, required_documents, processing_time_days) VALUES
('Vehicle License Renewal', 'VLR001', 'Renew your vehicle license registration', 1, '🚗', 1500.00, '["Vehicle Registration Certificate", "Insurance Certificate", "Revenue License"]', 3),
('Birth Certificate', 'BC001', 'Apply for birth certificate', 2, '👶', 500.00, '["Hospital Discharge Summary", "Parents ID Copies", "Marriage Certificate"]', 7),
('Business Registration', 'BR001', 'Register new business entity', 3, '🏢', 2500.00, '["Business Plan", "ID Copies", "Location Certificate"]', 14),
('Scholarship Application', 'SA001', 'Apply for government scholarship', 4, '🎓', 0.00, '["Academic Transcripts", "Income Certificate", "Recommendation Letters"]', 21),
('Dry Ration Application', 'DRA001', 'Apply for monthly dry rations', 1, '🍚', 0.00, '["Income Certificate", "Family Details", "Bank Statement"]', 5),
('Animal Permit', 'AP001', 'Permit for keeping livestock', 5, '🐄', 1000.00, '["Property Documents", "Veterinary Certificate", "ID Copy"]', 10);

-- Insert sample document templates
INSERT INTO document_templates (template_name, template_code, department_id, file_path, description) VALUES
('Vehicle License Application Form', 'VLA_FORM', 1, '/templates/vehicle_license_form.pdf', 'Standard application form for vehicle license'),
('Birth Certificate Application Form', 'BC_FORM', 2, '/templates/birth_certificate_form.pdf', 'Birth certificate application form'),
('Business Registration Form', 'BR_FORM', 3, '/templates/business_registration_form.pdf', 'Business registration application form'),
('Scholarship Application Form', 'SCHOLAR_FORM', 4, '/templates/scholarship_form.pdf', 'Government scholarship application form');

-- Update public_users table to include photo_url if not exists
ALTER TABLE public_users 
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) AFTER email,
ADD COLUMN IF NOT EXISTS public_user_id VARCHAR(20) UNIQUE AFTER public_id;

-- Add missing columns to existing tables
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id INT AFTER role,
ADD COLUMN IF NOT EXISTS division_id INT AFTER department_id,
ADD FOREIGN KEY IF NOT EXISTS (department_id) REFERENCES departments(id) ON DELETE SET NULL,
ADD FOREIGN KEY IF NOT EXISTS (division_id) REFERENCES divisions(id) ON DELETE SET NULL;
