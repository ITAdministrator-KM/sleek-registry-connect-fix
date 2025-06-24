
-- Add staff_name column to subject_staff table
ALTER TABLE subject_staff 
ADD COLUMN staff_name VARCHAR(255) NOT NULL AFTER user_id;

-- Update existing records with user names
UPDATE subject_staff ss 
JOIN users u ON ss.user_id = u.id 
SET ss.staff_name = u.name 
WHERE ss.staff_name IS NULL OR ss.staff_name = '';
