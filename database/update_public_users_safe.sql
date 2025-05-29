-- First, let's check if columns exist and only add if they don't
SET @dbname = DATABASE();
SET @tablename = "public_users";

-- Add username column if it doesn't exist
SET @columnname = "username";
SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE public_users ADD COLUMN username VARCHAR(50) NULL',
        'SELECT "username column already exists"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add password_hash column if it doesn't exist
SET @columnname = "password_hash";
SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE public_users ADD COLUMN password_hash VARCHAR(255) NULL',
        'SELECT "password_hash column already exists"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add qr_code column if it doesn't exist
SET @columnname = "qr_code";
SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE public_users ADD COLUMN qr_code TEXT NULL',
        'SELECT "qr_code column already exists"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_login column if it doesn't exist
SET @columnname = "last_login";
SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE public_users ADD COLUMN last_login TIMESTAMP NULL',
        'SELECT "last_login column already exists"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records with default values where needed
UPDATE public_users 
SET username = CONCAT('user_', id),
    password_hash = '$argon2id$v=19$m=65536,t=4,p=1$MLtSs6nKxUpoMKqgBR2rzw$mF8r/yZemC3XH3BqR9GxNGjcoL9FvHHWnATvHt6bwrg', -- Default password: 'changeme'
    qr_code = CONCAT('{"public_id":"', public_id, '","name":"', name, '","nic":"', nic, '","timestamp":', UNIX_TIMESTAMP(), '}')
WHERE username IS NULL OR password_hash IS NULL OR qr_code IS NULL;

-- Add constraints and indexes if they don't exist
SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE public_users ADD UNIQUE INDEX idx_username (username)',
        'SELECT "username index already exists"'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = 'idx_username'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update other indexes if they don't exist
SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX idx_public_users_public_id ON public_users(public_id)',
        'SELECT "public_id index already exists"'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = 'idx_public_users_public_id'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sqlstmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX idx_public_users_name ON public_users(name)',
        'SELECT "name index already exists"'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = 'idx_public_users_name'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create sequence table if it doesn't exist
CREATE TABLE IF NOT EXISTS public_id_counter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_value INT NOT NULL DEFAULT 0
);

-- Insert initial sequence value if table is empty
INSERT INTO public_id_counter (sequence_value)
SELECT 0 FROM dual
WHERE NOT EXISTS (SELECT * FROM public_id_counter);

-- Update sequence to current max value if needed
UPDATE public_id_counter 
SET sequence_value = (
    SELECT COALESCE(MAX(CAST(SUBSTRING(public_id, 4) AS UNSIGNED)), 0)
    FROM public_users 
    WHERE public_id REGEXP '^PUB[0-9]+$'
);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS before_insert_public_user;

-- Create trigger for auto-generating public_id
DELIMITER //
CREATE TRIGGER before_insert_public_user
BEFORE INSERT ON public_users
FOR EACH ROW
BEGIN
    DECLARE next_val INT;
    UPDATE public_id_counter SET sequence_value = sequence_value + 1;
    SELECT sequence_value INTO next_val FROM public_id_counter LIMIT 1;
    SET NEW.public_id = CONCAT('PUB', LPAD(next_val, 5, '0'));
END;//
DELIMITER ;

-- Make columns NOT NULL after populating data
ALTER TABLE public_users
MODIFY COLUMN username VARCHAR(50) NOT NULL,
MODIFY COLUMN password_hash VARCHAR(255) NOT NULL,
MODIFY COLUMN qr_code TEXT NOT NULL;
