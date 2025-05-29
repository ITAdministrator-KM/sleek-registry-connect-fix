-- Add new columns to public_users table
ALTER TABLE public_users
ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL,
ADD COLUMN password_hash VARCHAR(255) NOT NULL,
ADD COLUMN qr_code TEXT NOT NULL,
ADD COLUMN last_login TIMESTAMP NULL;

-- Update existing indexes and add new ones
CREATE INDEX idx_public_users_public_id ON public_users(public_id);
CREATE INDEX idx_public_users_name ON public_users(name);
CREATE INDEX idx_public_users_username ON public_users(username);

-- Create a sequence for public_id generation
CREATE TABLE public_id_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    last_value INT NOT NULL DEFAULT 0
);

INSERT INTO public_id_sequence (last_value) VALUES (0);

-- Create a trigger to auto-generate public_id
DELIMITER //
CREATE TRIGGER before_insert_public_user
BEFORE INSERT ON public_users
FOR EACH ROW
BEGIN
    DECLARE next_val INT;
    UPDATE public_id_sequence SET last_value = last_value + 1;
    SELECT last_value INTO next_val FROM public_id_sequence LIMIT 1;
    SET NEW.public_id = CONCAT('PUB', LPAD(next_val, 5, '0'));
END;//
DELIMITER ;
