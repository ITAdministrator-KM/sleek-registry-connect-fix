
-- Create public_registry table if it doesn't exist
CREATE TABLE IF NOT EXISTS public_registry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_user_id INT NULL,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_nic VARCHAR(20) NOT NULL,
  visitor_address TEXT,
  visitor_phone VARCHAR(20),
  department_id INT NOT NULL,
  division_id INT NULL,
  purpose_of_visit VARCHAR(255) NOT NULL,
  remarks TEXT,
  visitor_type ENUM('new', 'existing') NOT NULL,
  staff_id INT NOT NULL,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  FOREIGN KEY (staff_id) REFERENCES users(id),
  
  INDEX idx_registry_entry_time (entry_time),
  INDEX idx_registry_department (department_id),
  INDEX idx_registry_visitor_type (visitor_type),
  INDEX idx_registry_status (status)
);

-- Update tokens table to ensure all required columns exist
ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS called_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS eta_minutes INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal';

-- Update existing tokens that don't have updated_at values
UPDATE tokens SET updated_at = created_at WHERE updated_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tokens_status_date ON tokens(status, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_tokens_division_status ON tokens(division_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_updated_at ON tokens(updated_at);
