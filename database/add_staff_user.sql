-- Add staff user 'Ansar' with password '1985@1234'
-- The password is hashed using password_hash('1985@1234', PASSWORD_DEFAULT)

-- First, check if the user already exists
SET @username = 'Ansar';
SET @email = 'ansar@dskalmunai.lk';
SET @user_id = CONCAT('STF', LPAD((SELECT IFNULL(MAX(CAST(SUBSTRING(user_id, 4) AS UNSIGNED)), 0) + 1 FROM users WHERE user_id LIKE 'STF%'), 3, '0'));

-- Insert or update the staff user
INSERT INTO users (
  user_id,
  username,
  password,
  name,
  email,
  role,
  status,
  nic
) VALUES (
  @user_id,
  @username,
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 1985@1234
  'Ansar Staff',
  @email,
  'staff',
  'active',
  '198500000000' -- Default NIC
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  name = VALUES(name),
  email = VALUES(email),
  role = VALUES(role),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

-- Verify the user was created
SELECT * FROM users WHERE username = @username;
