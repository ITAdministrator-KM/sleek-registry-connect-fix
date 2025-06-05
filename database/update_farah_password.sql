
-- Update user passwords to use the standard hash for 'password'
-- The hash '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' = 'password'

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nic` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','staff','public') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create public_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `public_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `public_user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nic` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `nic` (`nic`),
  UNIQUE KEY `public_user_id` (`public_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_valid` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_token` (`token`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert/Update admin users with password = 'password'
INSERT INTO `users` (
  `user_id`, `username`, `password`, `name`, `nic`, `email`, `role`, `status`
) VALUES 
(
  'ADM001', 'Farah', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Farah Administrator', '199307260000', 'farah@dskalmunai.lk', 'admin', 'active'
),
(
  'ADM002', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'System Administrator', '199001010000', 'admin@dskalmunai.lk', 'admin', 'active'
)
ON DUPLICATE KEY UPDATE 
  `password` = VALUES(`password`),
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`),
  `updated_at` = CURRENT_TIMESTAMP;

-- Insert/Update staff users with password = 'password'
INSERT INTO `users` (
  `user_id`, `username`, `password`, `name`, `nic`, `email`, `role`, `status`
) VALUES 
(
  'STA2656932', 'Farhana', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Farhana', '199001020000', 'farhana@dskalmunai.lk', 'staff', 'active'
),
(
  'STF001', 'staff', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Staff User', '199001030000', 'staff@dskalmunai.lk', 'staff', 'active'
)
ON DUPLICATE KEY UPDATE 
  `password` = VALUES(`password`),
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`),
  `updated_at` = CURRENT_TIMESTAMP;

-- Insert/Update public users with password = 'password'
INSERT INTO `public_users` (
  `public_user_id`, `username`, `password_hash`, `name`, `nic`, `email`, `mobile`, `address`, `status`
) VALUES 
(
  'PUB00001', 'anzar', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Anzar Public', '199001040000', 'anzar@dskalmunai.lk', '0771234567', 'Test Address, Kalmunai', 'active'
),
(
  'PUB00002', 'public', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Public User', '199001050000', 'public@dskalmunai.lk', '0771234568', 'Public Address, Kalmunai', 'active'
)
ON DUPLICATE KEY UPDATE 
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `mobile` = VALUES(`mobile`),
  `address` = VALUES(`address`),
  `status` = VALUES(`status`),
  `updated_at` = CURRENT_TIMESTAMP;

-- Show all users for verification
SELECT 'ADMIN/STAFF USERS' as user_type, id, user_id, username, name, email, role, status FROM users
UNION ALL
SELECT 'PUBLIC USERS' as user_type, id, public_user_id as user_id, username, name, email, 'public' as role, status FROM public_users
ORDER BY user_type, username;
