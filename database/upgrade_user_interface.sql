
-- Add missing columns to tokens table for better display functionality
ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS called_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS eta_minutes INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal';

-- Create service_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_user_id INT NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  division_id INT,
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  request_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (public_user_id) REFERENCES public_users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id)
);

-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_user_id INT NOT NULL,
  department_id INT NOT NULL,
  division_id INT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (public_user_id) REFERENCES public_users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id)
);

-- Update existing tokens to have updated_at values
UPDATE tokens SET updated_at = created_at WHERE updated_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tokens_status_date ON tokens(status, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_service_requests_user_status ON service_requests(public_user_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
