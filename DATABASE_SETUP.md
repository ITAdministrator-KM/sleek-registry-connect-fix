# Database Setup Instructions

## 1. Database Configuration

Make sure your database configuration is correctly set in:
```
backend/config/database.php
```

## 2. Create Database Tables

Run the following SQL script to create the necessary tables:
```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
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

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_valid` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  KEY `expires_at` (`expires_at`),
  KEY `is_valid` (`is_valid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3. Create Admin User

You can create an admin user using one of these methods:

### Option 1: Using the setup script
Access this URL in your browser:
```
http://your-domain.com/backend/scripts/check_database.php
```

### Option 2: Manual SQL
Run this SQL to create a default admin user (password: password):
```sql
-- Default admin user (password: password)
INSERT INTO `users` (
  `user_id`, 
  `username`, 
  `password`, 
  `name`,
  `nic`,
  `email`, 
  `role`, 
  `status`
) VALUES (
  'ADMIN-001',
  'admin',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'System Administrator',
  '199001010000', -- Default NIC
  'admin@example.com',
  'admin',
  'active'
);
```

## 4. Default Login Credentials

- **Username:** admin
- **Password:** password

## 5. Verify Installation

1. Access the login page
2. Enter the admin credentials
3. Select 'admin' as the role
4. You should be redirected to the admin dashboard

## 6. Troubleshooting

1. **Database Connection Issues**
   - Verify database credentials in `backend/config/database.php`
   - Ensure the database server is running
   - Check if the database user has proper permissions

2. **Login Fails**
   - Check browser console for errors (F12)
   - Verify the users table exists and has data
   - Check PHP error logs for server-side errors

3. **Session Issues**
   - Make sure the `user_sessions` table exists
   - Check PHP session configuration
   - Ensure cookies are enabled in the browser
