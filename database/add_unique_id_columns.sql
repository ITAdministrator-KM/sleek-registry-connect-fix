
-- Add unique ID columns to existing tables (with existence checks)

-- Check and add dept_id column to departments table if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'departments' 
                   AND COLUMN_NAME = 'dept_id');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE departments ADD COLUMN dept_id VARCHAR(10) UNIQUE AFTER id', 
              'SELECT "dept_id column already exists in departments table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add div_id column to divisions table if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'divisions' 
                   AND COLUMN_NAME = 'div_id');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE divisions ADD COLUMN div_id VARCHAR(10) UNIQUE AFTER id', 
              'SELECT "div_id column already exists in divisions table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add user_id column to users table if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'user_id');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN user_id VARCHAR(10) UNIQUE AFTER id', 
              'SELECT "user_id column already exists in users table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add public_user_id column to public_users table if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'public_users' 
                   AND COLUMN_NAME = 'public_user_id');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE public_users ADD COLUMN public_user_id VARCHAR(20) UNIQUE AFTER id', 
              'SELECT "public_user_id column already exists in public_users table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing departments with new IDs (only if dept_id is NULL)
UPDATE departments 
SET dept_id = CONCAT('DEP', LPAD(id, 3, '0')) 
WHERE dept_id IS NULL;

-- Update existing divisions with new IDs (only if div_id is NULL)
UPDATE divisions 
SET div_id = CONCAT('DIV', LPAD(id, 3, '0')) 
WHERE div_id IS NULL;

-- Update existing users with new IDs (only if user_id is NULL or empty)
UPDATE users 
SET user_id = CONCAT('U', LPAD(id, 3, '0')) 
WHERE user_id IS NULL OR user_id = '';

-- Update existing public users to ensure proper format (only if public_user_id is NULL, empty, or doesn't follow PUB format)
UPDATE public_users 
SET public_user_id = CONCAT('PUB', LPAD(id, 5, '0')) 
WHERE public_user_id IS NULL OR public_user_id = '' OR public_user_id NOT LIKE 'PUB%';

-- Make sure all ID columns are not nullable and unique (only if they exist)
-- For departments
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'departments' 
                   AND COLUMN_NAME = 'dept_id');

SET @sql = IF(@col_exists > 0, 
              'ALTER TABLE departments MODIFY COLUMN dept_id VARCHAR(10) NOT NULL UNIQUE', 
              'SELECT "dept_id column does not exist in departments table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For divisions
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'divisions' 
                   AND COLUMN_NAME = 'div_id');

SET @sql = IF(@col_exists > 0, 
              'ALTER TABLE divisions MODIFY COLUMN div_id VARCHAR(10) NOT NULL UNIQUE', 
              'SELECT "div_id column does not exist in divisions table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For users
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'user_id');

SET @sql = IF(@col_exists > 0, 
              'ALTER TABLE users MODIFY COLUMN user_id VARCHAR(10) NOT NULL UNIQUE', 
              'SELECT "user_id column does not exist in users table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For public_users
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'public_users' 
                   AND COLUMN_NAME = 'public_user_id');

SET @sql = IF(@col_exists > 0, 
              'ALTER TABLE public_users MODIFY COLUMN public_user_id VARCHAR(20) NOT NULL UNIQUE', 
              'SELECT "public_user_id column does not exist in public_users table"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Display results
SELECT 'Database schema updated successfully. All ID columns have been configured with unique identifiers.' as Result;
