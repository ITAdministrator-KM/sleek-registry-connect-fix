
-- Create public_registry table for visitor management
CREATE TABLE IF NOT EXISTS `public_registry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registry_id` varchar(20) NOT NULL UNIQUE,
  `public_user_id` int(11) DEFAULT NULL,
  `visitor_name` varchar(255) NOT NULL,
  `visitor_nic` varchar(20) NOT NULL,
  `visitor_address` text,
  `visitor_phone` varchar(20),
  `department_id` int(11) NOT NULL,
  `division_id` int(11) DEFAULT NULL,
  `purpose_of_visit` text NOT NULL,
  `remarks` text,
  `entry_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `visitor_type` enum('new','existing') NOT NULL DEFAULT 'new',
  `status` enum('active','checked_out','deleted') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_registry_id` (`registry_id`),
  KEY `idx_visitor_nic` (`visitor_nic`),
  KEY `idx_entry_time` (`entry_time`),
  KEY `idx_status` (`status`),
  KEY `fk_registry_public_user` (`public_user_id`),
  KEY `fk_registry_department` (`department_id`),
  KEY `fk_registry_division` (`division_id`),
  CONSTRAINT `fk_registry_public_user` FOREIGN KEY (`public_user_id`) REFERENCES `public_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_registry_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_registry_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
CREATE INDEX `idx_registry_date` ON `public_registry` (DATE(`entry_time`));
CREATE INDEX `idx_registry_department_date` ON `public_registry` (`department_id`, DATE(`entry_time`));
