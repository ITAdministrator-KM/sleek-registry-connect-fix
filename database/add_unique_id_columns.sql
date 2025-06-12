
-- Add unique ID columns to existing tables

-- Add dept_id column to departments table
ALTER TABLE departments 
ADD COLUMN dept_id VARCHAR(10) UNIQUE AFTER id;

-- Add div_id column to divisions table
ALTER TABLE divisions 
ADD COLUMN div_id VARCHAR(10) UNIQUE AFTER id;

-- Add user_id column to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(10) UNIQUE AFTER id;

-- Update existing departments with new IDs
UPDATE departments 
SET dept_id = CONCAT('DEP', LPAD(id, 3, '0')) 
WHERE dept_id IS NULL;

-- Update existing divisions with new IDs
UPDATE divisions 
SET div_id = CONCAT('DIV', LPAD(id, 3, '0')) 
WHERE div_id IS NULL;

-- Update existing users with new IDs
UPDATE users 
SET user_id = CONCAT('U', LPAD(id, 3, '0')) 
WHERE user_id IS NULL OR user_id = '';

-- Update existing public users to ensure proper format
UPDATE public_users 
SET public_user_id = CONCAT('PUB', LPAD(id, 5, '0')) 
WHERE public_user_id IS NULL OR public_user_id = '' OR public_user_id NOT LIKE 'PUB%';

-- Make sure all ID columns are not nullable
ALTER TABLE departments 
MODIFY COLUMN dept_id VARCHAR(10) NOT NULL UNIQUE;

ALTER TABLE divisions 
MODIFY COLUMN div_id VARCHAR(10) NOT NULL UNIQUE;

ALTER TABLE users 
MODIFY COLUMN user_id VARCHAR(10) NOT NULL UNIQUE;

ALTER TABLE public_users 
MODIFY COLUMN public_user_id VARCHAR(20) NOT NULL UNIQUE;
