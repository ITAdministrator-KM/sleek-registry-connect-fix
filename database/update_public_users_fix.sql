-- First add columns without constraints
ALTER TABLE public_users
ADD COLUMN username VARCHAR(50) NULL,
ADD COLUMN password_hash VARCHAR(255) NULL,
ADD COLUMN qr_code TEXT NULL,
ADD COLUMN last_login TIMESTAMP NULL;

-- Update existing records with default values
UPDATE public_users 
SET username = CONCAT('user_', id),
    password_hash = '$argon2id$v=19$m=65536,t=4,p=1$MLtSs6nKxUpoMKqgBR2rzw$mF8r/yZemC3XH3BqR9GxNGjcoL9FvHHWnATvHt6bwrg', -- Default password: 'changeme'
    qr_code = CONCAT('{"public_id":"', public_id, '","name":"', name, '","nic":"', nic, '","timestamp":', UNIX_TIMESTAMP(), '}')
WHERE username IS NULL;

-- Now add the constraints
ALTER TABLE public_users
MODIFY COLUMN username VARCHAR(50) NOT NULL,
MODIFY COLUMN password_hash VARCHAR(255) NOT NULL,
MODIFY COLUMN qr_code TEXT NOT NULL,
ADD UNIQUE INDEX idx_username (username);

-- Update existing indexes and add new ones
CREATE INDEX idx_public_users_public_id ON public_users(public_id);
CREATE INDEX idx_public_users_name ON public_users(name);

-- Create a sequence table for public_id generation (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public_id_counter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_value INT NOT NULL DEFAULT 0
);

-- Insert initial sequence value if table is empty
INSERT INTO public_id_counter (sequence_value)
SELECT 0
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
