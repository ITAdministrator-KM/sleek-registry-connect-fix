
-- Subject Management System Database Schema
-- This creates the necessary tables for Subject Staff management and document handling

-- Add 'subject_staff' role to users table if not exists
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'public', 'subject_staff') NOT NULL DEFAULT 'public';

-- Create subject_staff table for additional subject staff information
CREATE TABLE IF NOT EXISTS subject_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post VARCHAR(100) NOT NULL,
    assigned_department_id INT NOT NULL,
    assigned_division_id INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    INDEX idx_subject_staff_user (user_id),
    INDEX idx_subject_staff_department (assigned_department_id),
    INDEX idx_subject_staff_division (assigned_division_id)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create documents table for managing Word and Excel files
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    document_type ENUM('word', 'excel') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT NULL,
    department_id INT NOT NULL,
    division_id INT NOT NULL,
    uploaded_by_user_id INT NOT NULL,
    description TEXT,
    is_active ENUM('yes', 'no') DEFAULT 'yes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_documents_department (department_id),
    INDEX idx_documents_division (division_id),
    INDEX idx_documents_type (document_type)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create excel_edits table to track Excel document modifications
CREATE TABLE IF NOT EXISTS excel_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    edited_by_user_id INT NOT NULL,
    edit_data LONGTEXT NOT NULL,
    version_number INT DEFAULT 1,
    edit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_excel_edits_document (document_id),
    INDEX idx_excel_edits_user (edited_by_user_id)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
