-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 04, 2025 at 02:38 PM
-- Server version: 8.0.41-cll-lve
-- PHP Version: 8.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dskalmun_appDSK`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `purpose` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci,
  `status` enum('scheduled','confirmed','completed','cancelled') COLLATE utf8mb3_unicode_ci DEFAULT 'scheduled',
  `notes` text COLLATE utf8mb3_unicode_ci,
  `staff_user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'General Administration', 'Overall administrative functions and coordination', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(2, 'Public Services', 'Direct services provided to the public', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(3, 'Health Services', 'Health-related services and programs', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(4, 'Education Services', 'Education coordination and support', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(5, 'Planning', 'planning ,Infrastructure and development initiatives', 'active', '2025-05-26 04:38:32', '2025-05-26 10:40:12'),
(6, 'NIC', 'get nic', 'active', '2025-05-26 10:28:32', '2025-05-26 10:28:32'),
(7, 'ADR', 'BC,DC and MC', 'active', '2025-05-29 04:49:06', '2025-05-29 04:49:06'),
(8, 'Driving Licence', 'Vehicle', 'active', '2025-05-29 05:39:14', '2025-05-29 05:39:14'),
(9, 'Accounts Division', 'Identifying the Development Needs\nEvaluation the Progress of the Projects\nUpdating PMCS\nMaintaining and Updating Resources Profile of the Division', 'active', '2025-05-29 08:45:02', '2025-05-29 08:45:02');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `divisions`
--

INSERT INTO `divisions` (`id`, `name`, `department_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Human Resources', 1, 'Staff management and HR functions', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(2, 'Finance account', 1, 'Financial management and accounting', 'active', '2025-05-26 04:38:32', '2025-05-29 03:38:30'),
(3, 'Birth Registration', 2, 'Birth certificate services', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(4, 'Marriage Registration', 2, 'Marriage certificate services', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(5, 'Identity Cards', 2, 'National ID card services', 'active', '2025-05-26 04:38:32', '2025-05-26 04:38:32'),
(6, 'Primary Health Care', 3, 'Basic health services', 'inactive', '2025-05-26 04:38:32', '2025-06-04 04:04:32'),
(7, 'Asswesume', 5, 'public sevices aswesume', 'active', '2025-05-26 04:38:32', '2025-05-26 10:41:11'),
(8, 'Road Development', 5, 'Road construction and maintenance', 'inactive', '2025-05-26 04:38:32', '2025-06-04 04:04:09'),
(9, 'BC', 7, 'BC', 'active', '2025-06-02 04:54:26', '2025-06-02 04:54:26');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb3_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `file_type` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `uploaded_by` int NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forms`
--

CREATE TABLE `forms` (
  `id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci,
  `form_fields` json DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_submissions`
--

CREATE TABLE `form_submissions` (
  `id` int NOT NULL,
  `form_id` int NOT NULL,
  `submitted_by` int DEFAULT NULL,
  `submission_data` json DEFAULT NULL,
  `status` enum('pending','processing','completed','rejected') COLLATE utf8mb3_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `id_card_logs`
--

CREATE TABLE `id_card_logs` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `generated_by` int NOT NULL,
  `card_type` enum('individual','bulk') COLLATE utf8mb3_unicode_ci DEFAULT 'individual',
  `file_path` varchar(500) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int NOT NULL,
  `username` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `attempt_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`id`, `user_id`, `ip_address`, `user_agent`, `login_time`) VALUES
(1, 3, '103.11.33.250', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-05-27 10:59:49'),
(2, 3, '103.11.33.250', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-05-27 11:03:32'),
(3, 3, '103.11.33.250', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-05-28 03:34:55'),
(4, 3, '103.11.33.250', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-05-28 04:29:45');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `recipient_id` int NOT NULL,
  `recipient_type` enum('public','staff') COLLATE utf8mb3_unicode_ci DEFAULT 'public',
  `title` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error') COLLATE utf8mb3_unicode_ci DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_id`, `recipient_type`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 1, 'public', 'Service Completed', 'Your birth certificate application has been completed and is ready for collection.', 'success', 0, '2025-05-27 10:55:59', '2025-05-27 10:55:59'),
(2, 2, 'public', 'Appointment Reminder', 'You have an appointment scheduled for tomorrow at 10:00 AM.', 'info', 0, '2025-05-27 10:55:59', '2025-05-27 10:55:59');

-- --------------------------------------------------------

--
-- Table structure for table `public_id_counter`
--

CREATE TABLE `public_id_counter` (
  `id` int NOT NULL,
  `sequence_value` int NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `public_id_counter`
--

INSERT INTO `public_id_counter` (`id`, `sequence_value`) VALUES
(1, 7497498);

-- --------------------------------------------------------

--
-- Table structure for table `public_users`
--

CREATE TABLE `public_users` (
  `id` int NOT NULL,
  `public_id` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `nic` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb3_unicode_ci,
  `mobile` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `qr_code_data` text COLLATE utf8mb3_unicode_ci,
  `qr_code_url` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `photo_url` varchar(500) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `username` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `qr_code` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `public_users`
--

INSERT INTO `public_users` (`id`, `public_id`, `name`, `nic`, `address`, `mobile`, `qr_code_data`, `qr_code_url`, `email`, `photo_url`, `department_id`, `division_id`, `status`, `created_at`, `updated_at`, `username`, `password_hash`, `qr_code`, `last_login`) VALUES
(1, 'PUB001', 'T.M.Mohemed Anzar', '853421669V', '167A, Gafoor Lane, F.C Road, Kattankudy 02', '+94777930531', NULL, NULL, 'anzar@example.com', NULL, 1, 0, 'active', '2025-05-27 10:55:59', '2025-05-30 06:25:54', 'anzar', '$argon2id$v=19$m=65536,t=4,p=1$SGtYc3RqV2M4SGk2WVAzWQ$PAiRPI0K55li3Y8hx5Wquv6Il90G+S0QrST8KjkgCsM', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAsQAAALECAIAAACAN7HUAAAACXBIWXMAAA7EAAAOxAGVKw4bAAATaUlEQVR4nO3dS3IlOZIAweFI3v/KOftelEDaMF6OoOoBGN8XNMEC/vP379//AQD4b/3vv30CAMDbxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACD5M3mwn5+fycOt8vfv3yt/59Y9PDmfbce6dQ9PbLv2yWNN3ucTk+f81W/U5Lux7R376jM9MXmfrUwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJKOzOU5smwtw4sW93yf34X/x/kzO1Lhl22yFbffnFnNAum3zO/zf6axMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACTrZnOcmNyTfNue7dvmAmyb9TD5d05M3ucT2347k+fz4syRbc/9xXt4y4vPfZKVCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIDkydkc7PHiHvuTJvfYf3Heyi2T5zM5L2PbbJcTL87QobMyAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCYzfFBt/bz3zbr4cSL+/lvm2+y7VlsO59bJq/9lsnz2fY75Z9ZmQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBInpzN8dU92ydnYZzYNstg0ovzILY9r5Pz+er8l0nmicz46rfuFisTAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAMm62Rxf3df9llt742+b0TB5XV/9O7dMns9XZz28+P785vfwxXdsGysTAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAMnobI7Jfd1f5P502+YUbJt3cGLb/IVbf2fbfZ60bd7KpG3n81VWJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACS0dkck/vDT85WOLHtWLf+zm+eYXFi27XfescmvTgrZNJXv5knfH/2sDIBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkPy8uO/9i3uk/+Zrn7RttsKL8022zWh48Z2ffA9/8+yJF9/Vbe/GLVYmAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAAJLR2RyTXtyz/cTkHvu/eT//E9vm2rz4LG7ZNlth27yMbfdnmxf/F2xjZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgGZ3NsW2+wLbzuWXb3vjb5hTc8tW9+r86M2Kbyd/pizNHXpwnsu3+TP4urEwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJKOzOU5s22/8hHPuts1o2LZX/61j3bLt/TmxbWbEiW3PdNJXr33b7+IWKxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAyZ9/+wT+G9vmJrw4D+Kr+97fcuvdeHEexDYvzgGZ/CZs+45N+upcmxPbnpeVCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIDkZ9ue5C/Oufjq/IVte79v29P+q89r23Wd2DYLY/JY274/274bt2y7P9vmrViZAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEj+/Nsn8J8m5wJs2/f+xf3zX7yuyT3tX5yX8dV348WZI9vu4bZ345Zt78a28zlhZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAg+Znc//yrJveZ37Znu7kk3eS1n/jNz+LEV+dTnNh2n1/8Hn6VlQkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAZHQ2x7YZFr95rsQt2/bqP7FtJsJXZ3zcsu13uu093PY+3/LiN3Pb72vy2q1MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACR/Jg/21X3mf/N+/p7FzLEm/862eSvb5uO8+I06sW0WxrZ3lX9mZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgGZ3N8eKe9pPnMzk74JYXZ4V8dS7JLZOzS7a59f5sm29y6+989dpPTM4uefF/pZUJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgGR0NseLXtxnftu8jMl95l8851u2zcK4dZ9vmTyfyWO5hzN/55avfqOsTAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkP9vmC5zYtif5iRf3qz/x4j7zk89i0lefxbbZCtue+wn3p9v2+9r2f9DKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEDy598+gf8v5gt02/Z+nzT5vCaPte0du/X+vDgTYfL3te18tr2Ht/zmGShWJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACSdbM5Xpx3sG3uxrbzuWXynLfdn8l9+Ldd+zaT8zJueXGeyC1fnSey7VlYmQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIfrbto35icp/5bbbt53/ixXds0ovv4S3bfqfbfl/b7s8tv/m6vsrKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAyOpvj1l70t451Ytv9OTG57/2Lx9r2TLfdw1u2nfNXZ3ycePF3cWLbOU++q9veMSsTAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAMmff/sE/tPk/vm3bNtH3R7y3a3r+s3XfmLy/rw42+XEb57/cmLbM711n7ddl5UJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgGTdbI4XvThfYHIGyrZZD9tml2yzbU7B5DPd9txvnfOL7+Et22aFbDufW6xMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACQ/2/YJ/817yJ/46j782+ZB3LJt1sM2274/k7bNJZn01ff5xLZncYuVCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIDkydkck/vVT/6dW7bNudh2f26ZvK4Xj/Wb/84t234XL/6/ODE5Q+fFY52wMgEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQ/Pm3T+A/3dpLfHKWwbY90k9M7vm/bX7H5LN48bpefJ9vefEeTp7zb343Tkw+i22sTAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAk62ZznPjqvvfb5ji8eKxJ22ZqnJj87Uw+023v863z2XZdk/OMbtn2LLb9b7rFygQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBA8uRsjm17kk/ux37Csf7Zree1bYbFV8958nmdHGvbfJMXj7VtzsUtX50DcsLKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEDyM7l39639/E9s29t827VP+upe9CcmZ1i86MVnestv/v5MfhNuefF/pdkcAMAzxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAZnc1xYtsch8m9309s26v/xfPZ9o5NMg9ixovvz7bz2Wbb+7ONlQkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCA5LOzOW4d68Tk+WybPXHCnIKZY704R+bFeQcv3ucTL/4GJ217n09MPi8rEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJutkcJ16cZbBtT/tt53PixbkkzPjq/JcT22aObLuHXz2fbdduZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAg+TN5sBdnNEzads7bnte2Y92yba/+bfNNtv1OT3z1t3zLb55hceLFc7YyAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCMzua4tZ//rX3mJ/erP7n2bXv1b9v7/ZZt93ny70x6cU7KiRdnoGybZzT5d279T5n8bmx7XiesTAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAko7M5tnlxRsO2Pe23nc+tY03aNp9i2/25Zduci1u2fcdunc+L93Dy2rf9Tq1MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACSjszm27bVuJsI/2zbL4KszCLaZnIHy4jPd9t24dV3bnsWJF5/XLdu+UVYmAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAAJLR2RwnJvda/+rMiMm/s20+xYv78E++85Pv84vv2Iv3Z/JYt679q9/5F78/t1iZAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEh+tu17f+LFPdK3zQHZ9iy2vYcv3ucTv/m5n5ic0fDitZ948bpefKbbzsfKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAyOpvjhP3h9xzrxTkOkzNZts3LuGXbdb34u9g262HbHIcTv/mcX7x2KxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAybrZHLd8dd/7bcc68eJMjW3zMn4z36g9f+eWbeezzYvzO6xMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACSfnc3xom1745/YNr/jxT3tX3zuJ7a9G7e8+M3cdn8m341bts0K2fYeWpkAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASP5MHmzb3uaTTvZR3zaf4sTk/vAvzt04sW1Oyov38MSt92fbd2zbt+XE5Dfqq9e1jZUJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgGR0NseJF/f837aH/Lb5HS/Oeth2zpP7+W+bt3Lr72ybRzP5+9rmq+/zb2ZlAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACBZN5vjxFf3dZ+cLzBp2974X52BcuLF92dyTsq2d/XEi7NCbv0uXnyfJ5/X5PtsZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgeXI2x1fd2md+cj/2bfvDT87CMMdh5lhfnZNyYts7tu33fsu2d+PF+2xlAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAxm2ORW/vD39rX/TfP+Jic37Ftj/1t8ylOfHX+y7Y5Mi/Odjkx+bxe/CacsDIBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkDw5m+PFfcsn3Zod8OI+/NvmSmw7nxe9eA8n53dsm2Hx4uyJ3/zNvMXKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAECybjbHi/vw33JrP/Ztf+eWyXdj22yFF4+1bY7DttkKJyZ/X9t+y9ueBf/MygQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBA8jO5HzsA8D1WJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACS/wNniv2gvNJqDgAAAABJRU5ErkJggg==', NULL),
(2, 'PUB002', 'Fatima Ibrahim', '198798765432', 'No. 456, Temple Road, Kalmunai', '+94779876543', NULL, NULL, 'fatima@example.com', NULL, 0, 0, 'active', '2025-05-27 10:55:59', '2025-05-30 09:29:46', 'Fatima ', '$argon2id$v=19$m=65536,t=4,p=1$Y3dVZDBpMm1mN1ZKcW5CNA$oN8lRAuNzOVa0/qFSDeRV5x++vsTXUXg2KUVRXUDmMo', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAsQAAALECAIAAACAN7HUAAAACXBIWXMAAA7EAAAOxAGVKw4bAAATf0lEQVR4nO3dS24lSZIAweEg73/l7BtUO1odVuZBkTXx4h9UxMLt5+/fv/8HAPC/+v9/ewcAgLeJCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQPJncmM/Pz+Tm1vl79+///VvTs7Pye+cmLwWLx77tn0+se0cnnjxPJ948fma3Na25+KrJs+zLxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAyehsjhPb1tg/8eLa75Pr+Z+YXPP/xfkCJ756TU9sm0vy4rWYtO352nZ+Tmz7v+PLBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAECybjbHia+uab9tPf8Tk/MObv3Oi+vwT9o2w+LWtiafnRfnd2ybfbPNV//v3OLLBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEDy5GyOr9q2nv+L68NP7vO22RMvXq8TX72fJ5/3bTM1Jo+LGb5MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRmcywyuTb+iW2zQia9OOPj1nl+8R570bZ77MS2+R3s4csEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQPLkbI7fvGb7V4/91pr/22YQnPzO5DV9cR7E5PyObbNCtt3Pv9lX3723+DIBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkKybzfGb14e/NRdg2+9MenEGwbbzPLk/k9dr23Mx+Tsv2jaThX/mywQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAMjqbY9sch99sct7Brd95cY7Di746B+TEi/uzzbZ5Il99TrfxZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgGZ3NsW3+gjXk/9mt83Prdya3Nfk7k7bNeth2nre9f07cenZubevFe37yWrx4j53wZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAg+Zlcu3vbGuknfvP5+eoa+1+d7XJi2/18y7brfmLb8z7pxXN44qvn+YQvEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJutkcJ766z1/d1i0vrsNvtkK37V7ddt23XYsXZ9ac+Op79RZfJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACSdbM5bq1/Pvk7t2w7rm3r8G+bc/Hi+vlfnSvx4jXdNp9i27W4Zdtxvfi/6YQvEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJ6GyOW15c8/+WF2dhnNi27v2kbbMwXrwW295jk/fYi7Metj2Dt2x7/0xeU18mAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAAJLR2RxfnR3w4tr4L9p23V/c1qQXj2vbc7rtHL44F2nbvIwTL/5P8WUCAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIPnzb+/Av2nbrJBJk/s8uT78rW29eN1fnJtwy4v7c3Ittt2HkzMjXnxvbJuXMcmXCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBk3WyOr64zf/I7k9ua/J1Jt+6fbce17R675auzJ7bZts8vzkWanCey7Tk94csEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQDI6m2PbPIht68O/uBb9iyaP68V7bPJ3Jre1bT7FiW0zGr56P9/y4v+vW3yZAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEhGZ3Pcsm2N/Rdnakyusb/td25t68X5FNtsm/WwbbbCNi/eh9vevS9u64QvEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJz7b1vU+8uKb9LZNzLk7cuhbb7sOvnsPJ4zrx1f3Zdk0ntzX5XPzm87ONLxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAyZ/JjW1bI/3Wtm452efJuSTb1pmfvKbb1s+/tT9ffXa+atvz/qJtM3S++nz5MgEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQ/Lw4W+GWyTXbJ2ciTLp1XC9eixePfdK249r2DL747t12z7/oxXfLCV8mAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAAJI/kxvbNn9hclsv7vMt22Y0nPjq7IBt8ym2zYyY3Nbk/kz+zolt76jJa/HVd4svEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJ6GyOEy/OBdj2O7dsmx1wy+RcgG3zVl58viZtm/HxVZPzjF68D09su398mQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIfrat7003OXtict373zzn4pavPu/brunked52H07O3Zj04nt18hz6MgEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQ/Jnc2OT6+V+drTBpcn34F2d8bNvWyTncds9vm79wYtvsiW3n8De/n1/c51t8mQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIRmdznNi2tvm22Qrb1rTfdn5ObJuJ8NU5DrdmhZzs81fPz7Y5INveUb/5em37X+nLBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAyOptjcr3xyXXLX1wb/8Tkuve3bJtlcMtX7+cTk3McvnrsL57DyWOffD9P/s4kXyYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAktHZHC+uN35icq3+r84XmFyr/8X5ApNevJ9ftG0exFdtm7OzbX9u8WUCAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIPl5cZ1wa9H/s23zO7bN1Jjc1rYZKC+avA+3XffJ+/nEV++xW7Y975P748sEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQPJncmOTa4lvW2P/lpN9nlw//8VtvXhvvDgTYXKWyokXn+UT22aXTG5r2/3z4vyXW3yZAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEhGZ3NsW2v9hHkQb9m2Xv2JbTMRbnnx/nnRtvvnxW3d8uJ7/hZfJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACSnxfXAP+qyTkg/LMXr8VX5yZ89VqceHGe0bb5FNvun237c4svEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJn397B/5Nt9aH37YO/+Ra/S/Oejgxed23zVbYdi22eXG2wuS8jG3387aZGie2zTc54csEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQPIzuXb35Frik+vMb1uvfts1PbFtBsotv3lOwbb5Atu2dcu2OSlffWd61/0zXyYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAkj//9g78L26tW75tvsDkcZ3YNsNi24yGF9fqP7HtPtxm2716y+RxnXjx/fPiu/cWXyYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAktHZHNtmENxa//zF9epPzvOL1+JF22Z8vDhXYpttxz553X/zs/yb+TIBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkPxMrqO+bQbBpBfP84ltcxy2zaeYNHkOJ/3m6zX5rnvx2dn2rtu2P5N8mQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBI/kxu7Nba5l9d0/7WtibX2H9xrf5t5+fEret+Ytt8gW0zCF607RxOvje2HfuJF9+9vkwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJKOzOV6chXHiq8d1YnL9/G3zMk5M7s9X5x189fnatj8vPl8nJu+fW7+z7Rye8GUCAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBmdzXHixfXPt23rxMn+TM56uGVyn29ta9u8jG1zNyav14lt9/yL+/Pi7IkX93mSLxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAyehsjm0zEU5sW2d+clvbjn2bF2dYbLteX50rse3eOPHijKFb29p2XNueixO+TAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAko7M5btk2d+PW73x1jf0Xt3Vi25yLbfuz7fnaZtuMjxPb9mfStnkr266FLxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAyc+29cZPfHWt/lvXYnLewbbfuWXbtbhl23Oxbb7Aid/8HnvxXt32LG87rlt8mQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIRmdznPjquuUvzpU48eLsgG3X4quzHrY9g5MmZ7J8dVsntr1/tpm8Fr5MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACTrZnPcsm29+hfdmvWw7Txvm1Pw1fvnlsn70OyJf+Z+nvHi/2VfJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACSz87meNG2+QLb5hRs8+IMgm1zJbbdzye2zad48dhffP9suw9PTJ4fXyYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAkj+TG3txlsEtL86weHGfX1w/f5vJmQjb5hSc7M+Lsye2PcuT1/0338+TfJkAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASEZnc5zYtt74ia/Ocdg252Ly3tg2W+HEi+f5xOS12HbsL17TbbNvth37LdveP75MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACTrZnOc+M3rut869m3ruk/aNu9g8lq8OEdm8p6/5db1+uo9dutd95vv5218mQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBInpzN8VXbZkacmFxn/qtr2r84x+HEV2e7nPjqLIwTL97Pk7NCtj2nt/gyAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCYzfGYbfMOtu3P5HyBbbMMJm2b/3Lrer14XNt8dT7F5DvhxLZ7w5cJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgOTJ2Rzb1iS/ZdtxbZuJMPk7k7at57/tPvyqW+d58npNPl/bZnxMPjsvzm3xZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAg+Zlc33vbTIRJL86M2HZvbFuL/tb1cp5nuF57/OZ33YkXr7svEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJ6GwOAOB7fJkAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASP4DxKW+x830Fw8AAAAASUVORK5CYII=', NULL),
(3, 'PUB003', 'Mohamed Ali', '200012345678', 'No. 789, Beach Road, Kalmunai', '+94771111111', NULL, NULL, 'ali@example.com', NULL, NULL, NULL, 'inactive', '2025-05-27 10:55:59', '2025-05-30 05:55:42', 'user_3', '$argon2id$v=19$m=65536,t=4,p=1$MLtSs6nKxUpoMKqgBR2rzw$mF8r/yZemC3XH3BqR9GxNGjcoL9FvHHWnATvHt6bwrg', '{\"public_id\":\"PUB003\",\"name\":\"Mohamed Ali\",\"nic\":\"200012345678\",\"timestamp\":1748503355}', NULL),
(4, 'PUB7497495', 'Farhana', '937080590v', 'Divisional Secretariat, Kalmunai', '+94672229236', NULL, NULL, 'itdskalmunai@gmail.com', NULL, 1, NULL, 'inactive', '2025-05-29 05:44:57', '2025-05-30 05:55:07', 'user_4', '$argon2id$v=19$m=65536,t=4,p=1$MLtSs6nKxUpoMKqgBR2rzw$mF8r/yZemC3XH3BqR9GxNGjcoL9FvHHWnATvHt6bwrg', '{\"public_id\":\"PUB7497495\",\"name\":\"Farhana\",\"nic\":\"937080590v\",\"timestamp\":1748503355}', NULL),
(5, 'PUB74974', 'Test Public User', '199501010V', NULL, '0771234567', 'Sample QR Data', 'https://example.com/qrcode.png', 'public@test.com', 'https://example.com/photo.jpg', 1, 2, 'active', '2025-06-04 06:45:22', '2025-06-04 08:34:18', 'public', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'GeneratedQRCodeData', '2025-06-04 08:34:18');

--
-- Triggers `public_users`
--
DELIMITER $$
CREATE TRIGGER `before_insert_public_user` BEFORE INSERT ON `public_users` FOR EACH ROW BEGIN
    DECLARE next_val INT;
    UPDATE public_id_counter SET sequence_value = sequence_value + 1;
    SELECT sequence_value INTO next_val FROM public_id_counter LIMIT 1;
    SET NEW.public_id = CONCAT('PUB', LPAD(next_val, 5, '0'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `qr_codes`
--

CREATE TABLE `qr_codes` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `qr_code_data` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `qr_code_url` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qr_scans`
--

CREATE TABLE `qr_scans` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `staff_user_id` int NOT NULL,
  `scan_location` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `scan_purpose` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qr_scan_logs`
--

CREATE TABLE `qr_scan_logs` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `scanned_by` int NOT NULL,
  `scan_location` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `purpose` text COLLATE utf8mb3_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_history`
--

CREATE TABLE `service_history` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `service_name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` enum('completed','pending','processing') COLLATE utf8mb3_unicode_ci DEFAULT 'pending',
  `details` text COLLATE utf8mb3_unicode_ci,
  `staff_user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `service_history`
--

INSERT INTO `service_history` (`id`, `public_user_id`, `department_id`, `division_id`, `service_name`, `status`, `details`, `staff_user_id`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 3, 'Birth Certificate Application', 'completed', NULL, NULL, '2025-05-27 10:55:59', '2025-05-27 10:55:59'),
(2, 1, 3, 6, 'COVID-19 Vaccination', 'completed', NULL, NULL, '2025-05-27 10:55:59', '2025-05-27 10:55:59'),
(3, 2, 4, 7, 'School Admission', 'completed', NULL, NULL, '2025-05-27 10:55:59', '2025-05-27 10:55:59'),
(4, 3, 2, 3, 'Marriage Certificate Application', 'processing', NULL, NULL, '2025-05-27 10:55:59', '2025-05-27 10:55:59');

-- --------------------------------------------------------

--
-- Table structure for table `service_requests`
--

CREATE TABLE `service_requests` (
  `id` int NOT NULL,
  `public_user_id` int NOT NULL,
  `service_type` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `purpose` text COLLATE utf8mb3_unicode_ci,
  `required_documents` json DEFAULT NULL,
  `status` enum('pending','processing','approved','rejected','completed') COLLATE utf8mb3_unicode_ci DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb3_unicode_ci DEFAULT 'medium',
  `estimated_completion` date DEFAULT NULL,
  `fee_amount` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('unpaid','paid','waived') COLLATE utf8mb3_unicode_ci DEFAULT 'unpaid',
  `notes` text COLLATE utf8mb3_unicode_ci,
  `token_number` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `appointment_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int NOT NULL,
  `token_number` int NOT NULL,
  `department_id` int NOT NULL,
  `division_id` int NOT NULL,
  `public_user_id` int DEFAULT NULL,
  `status` enum('active','called','completed','cancelled') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`id`, `token_number`, `department_id`, `division_id`, `public_user_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, NULL, 'active', '2025-05-29 07:32:35', '2025-05-29 07:32:35'),
(2, 1, 1, 2, NULL, 'active', '2025-05-29 08:15:37', '2025-05-29 08:15:37'),
(3, 2, 1, 1, NULL, 'active', '2025-05-29 09:12:17', '2025-05-29 09:12:17'),
(4, 3, 1, 1, NULL, 'active', '2025-05-29 09:28:09', '2025-05-29 09:28:09'),
(5, 1, 1, 2, NULL, 'active', '2025-05-30 03:23:46', '2025-05-30 03:23:46'),
(6, 2, 1, 2, NULL, 'active', '2025-05-30 03:25:25', '2025-05-30 03:25:25'),
(7, 1, 1, 1, NULL, 'active', '2025-05-30 03:52:14', '2025-05-30 03:52:14'),
(8, 2, 1, 1, NULL, 'active', '2025-05-30 03:53:01', '2025-05-30 03:53:01'),
(9, 1, 3, 6, NULL, 'active', '2025-05-30 05:28:46', '2025-05-30 05:28:46'),
(10, 1, 1, 2, NULL, 'active', '2025-06-03 07:50:58', '2025-06-03 07:50:58'),
(11, 1, 7, 9, NULL, 'active', '2025-06-03 07:51:30', '2025-06-03 07:51:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `user_id` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `nic` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL COMMENT 'Supports both old (12 digits) and new (10 chars) NIC formats',
  `email` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `role` enum('admin','staff','public') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'public',
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_id`, `name`, `nic`, `email`, `username`, `password`, `role`, `department_id`, `division_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'ADM001', 'Farah', '199312345678', 'admin@dskalmunai.lk', 'Farah', '$2y$10$4W8NZDSpXu.iPAyXZuZE5.cQmIhV3IRGHrVBX8SAV90G5hh.Z41Uy', 'admin', NULL, NULL, 'active', '2025-05-26 04:38:32', '2025-06-04 06:38:32'),
(2, 'STA2656932', 'Farhana', '937080590v', 'farhana@dskalmunai.lk', 'Farhana', '$argon2id$v=19$m=65536,t=4,p=1$T0V5b1E2bk92TU9IM1IxTQ$00XzaMVBR0sJP8wlNzh3TTjkirtYvdqrOIc9uH4kBa4', 'staff', 1, 1, 'active', '2025-05-26 06:57:37', '2025-06-03 09:06:04'),
(3, 'STA1351777', 'Ansar', '857080590v', 'ansar@gmail.com', 'Ansar', '$2y$12$PwRRePUs5ALQgSMF1TTdmO1j/khF/o45bCz58.5KvJDgYBgScdA.C', 'staff', 2, NULL, 'active', '2025-05-27 04:49:11', '2025-05-27 04:49:11'),
(5, 'STAFF001', 'Staff User', '199301010V', 'staff@dskalmunai.lk', 'staff', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', NULL, NULL, 'active', '2025-06-04 06:38:32', '2025-06-04 06:38:32'),
(4, 'ADM17489343995760', 'Marliya', '669678598v', 'marliya@gmail.com', 'Marliya', '$argon2id$v=19$m=65536,t=4,p=1$UVpvQVh1Qm01MGoxVWg3Qg$t8I+bYfaEjpDsRsCoo4hmDYgynPktOc3VrmJGW/+UIE', 'admin', 1, 2, 'active', '2025-06-03 07:06:39', '2025-06-03 07:06:39');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `token` varchar(500) COLLATE utf8mb3_unicode_ci NOT NULL,
  `is_valid` tinyint(1) DEFAULT '1',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `token`, `is_valid`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDkwMDk4MjYsImV4cCI6MTc0OTAxMzQyNiwidXNlcl9pZCI6MSwicm9sZSI6ImFkbWluIiwianRpIjoiMTMzOGQ4ODFiZjE5Mjk1N2JiZjU3NmIwM2Q4NDVjYzkifQ.KU9ES-D3ewARZN11sDbcmZcfzNnau1HFVnAWKq7BWb4', 0, '2025-06-04 05:03:46', '2025-06-04 04:03:46', '2025-06-04 05:09:03'),
(2, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDkwMTA2NDksImV4cCI6MTc0OTAxNDI0OSwidXNlcl9pZCI6MSwicm9sZSI6ImFkbWluIiwidXNlcm5hbWUiOiJGYXJhaCIsImp0aSI6Ijc0YWFlODcwNmVkNGZkZTJmOGU3M2Q4M2UzZmU2NmFlIn0.hqmN4C_MvJtzntJzR8s8OWwOH9kxyB1lYOIR9ksSusw', 0, '2025-06-04 05:17:29', '2025-06-04 04:17:29', '2025-06-04 05:09:03'),
(3, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDkwMTA3NTUsImV4cCI6MTc0OTAxNDM1NSwidXNlcl9pZCI6Miwicm9sZSI6InB1YmxpYyIsInVzZXJuYW1lIjoiRmF0aW1hICIsImp0aSI6IjQ0MjA5ZDkyMzgwZjY0MWExY2ZjNDJmMmMxYzMzOGFmIn0.MsvnQmgqlruLjPfgrFtW4r6xJSGbYdgT1VdVqovrZAg', 0, '2025-06-04 05:19:15', '2025-06-04 04:19:15', '2025-06-04 05:26:42'),
(4, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6IkZhcmFoIiwicm9sZSI6ImFkbWluIiwiZGVwYXJ0bWVudF9pZCI6bnVsbCwiZGl2aXNpb25faWQiOm51bGwsImlhdCI6MTc0OTAxMzc0MywiZXhwIjoxNzQ5MTAwMTQzfQ.g5hP6QgVVy3uX7HdLSKRF_NJl79ymbWevHEwNmPvMPM', 0, '2025-06-04 23:39:03', '2025-06-04 05:09:03', '2025-06-04 05:26:24'),
(5, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6IkZhcmFoIiwicm9sZSI6ImFkbWluIiwiZGVwYXJ0bWVudF9pZCI6bnVsbCwiZGl2aXNpb25faWQiOm51bGwsImlhdCI6MTc0OTAxNDc4NCwiZXhwIjoxNzQ5MTAxMTg0fQ.Ew8ZXWoZSNkdp7sh3QOPoOegxiG-ZZHa3IuUAOXbOC0', 1, '2025-06-04 23:56:24', '2025-06-04 05:26:24', '2025-06-04 05:26:24'),
(6, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhdGltYSAiLCJyb2xlIjoicHVibGljIiwiZGVwYXJ0bWVudF9pZCI6MCwiZGl2aXNpb25faWQiOjAsImlhdCI6MTc0OTAxNDgwMiwiZXhwIjoxNzQ5MTAxMjAyfQ.ok4nL8oy7fgEqzgYpxkGQ1jakeBLFZijtRrrvgZvT9k', 0, '2025-06-04 23:56:42', '2025-06-04 05:26:42', '2025-06-04 05:31:04'),
(7, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhdGltYSAiLCJyb2xlIjoicHVibGljIiwiZGVwYXJ0bWVudF9pZCI6MCwiZGl2aXNpb25faWQiOjAsImlhdCI6MTc0OTAxNTA2NCwiZXhwIjoxNzQ5MTAxNDY0fQ.C8Nd_QjJEh9c8ezYpQSF9x5qSvQch5FQPxsqWPmxe5k', 0, '2025-06-05 00:01:04', '2025-06-04 05:31:04', '2025-06-04 07:08:25'),
(8, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhdGltYSAiLCJyb2xlIjoicHVibGljIiwiZGVwYXJ0bWVudF9pZCI6MCwiZGl2aXNpb25faWQiOjAsImlhdCI6MTc0OTAyMDkwNSwiZXhwIjoxNzQ5MTA3MzA1fQ.NAfR7jSK8v6V-YILEifLliO2SDyZo75h2nTpGVULgL0', 1, '2025-06-05 01:38:25', '2025-06-04 07:08:25', '2025-06-04 07:08:25'),
(9, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZGVwYXJ0bWVudF9pZCI6bnVsbCwiZGl2aXNpb25faWQiOm51bGwsImlhdCI6MTc0OTAyMTA2OCwiZXhwIjoxNzQ5MTA3NDY4fQ.QICRqR2zZ6DxSVQ5Prjk_eRTrloQURxx0AZHCpT2vxA', 0, '2025-06-05 01:41:08', '2025-06-04 07:11:08', '2025-06-04 07:21:50'),
(10, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZGVwYXJ0bWVudF9pZCI6bnVsbCwiZGl2aXNpb25faWQiOm51bGwsImlhdCI6MTc0OTAyMTcxMCwiZXhwIjoxNzQ5MTA4MTEwfQ.rUHzApGYVNejdVPCpS1R9WlD5CFtEkkmRttaI0F-Tgo', 1, '2025-06-05 01:51:50', '2025-06-04 07:21:50', '2025-06-04 07:21:50'),
(11, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhdGltYSAiLCJyb2xlIjoicHVibGljIiwiZXhwIjoxNzQ5MTE0NDEwfQ.N-YKmaY9wP-Er3EVAS5BA-TNbfY_tHobD3PFi2hoYWA', 1, '2025-06-05 09:06:50', '2025-06-04 09:06:50', '2025-06-04 09:06:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `public_user_id` (`public_user_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `staff_user_id` (`staff_user_id`),
  ADD KEY `idx_appointments_date` (`appointment_date`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `forms`
--
ALTER TABLE `forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `form_submissions`
--
ALTER TABLE `form_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `form_id` (`form_id`),
  ADD KEY `submitted_by` (`submitted_by`);

--
-- Indexes for table `id_card_logs`
--
ALTER TABLE `id_card_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_public_user_cards` (`public_user_id`,`created_at`),
  ADD KEY `idx_generator` (`generated_by`,`created_at`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_username_ip` (`username`,`ip_address`),
  ADD KEY `idx_attempt_time` (`attempt_time`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_login_time` (`login_time`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_recipient` (`recipient_id`,`recipient_type`);

--
-- Indexes for table `public_id_counter`
--
ALTER TABLE `public_id_counter`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `public_users`
--
ALTER TABLE `public_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `public_id` (`public_id`),
  ADD UNIQUE KEY `nic` (`nic`),
  ADD UNIQUE KEY `idx_username` (`username`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `idx_public_users_nic` (`nic`),
  ADD KEY `idx_public_users_mobile` (`mobile`),
  ADD KEY `idx_public_users_public_id` (`public_id`),
  ADD KEY `idx_public_users_name` (`name`);

--
-- Indexes for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `public_user_id` (`public_user_id`),
  ADD KEY `idx_public_user` (`public_user_id`);

--
-- Indexes for table `qr_scans`
--
ALTER TABLE `qr_scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `public_user_id` (`public_user_id`),
  ADD KEY `staff_user_id` (`staff_user_id`);

--
-- Indexes for table `qr_scan_logs`
--
ALTER TABLE `qr_scan_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_public_user_scans` (`public_user_id`,`created_at`),
  ADD KEY `idx_scanner` (`scanned_by`,`created_at`);

--
-- Indexes for table `service_history`
--
ALTER TABLE `service_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `staff_user_id` (`staff_user_id`),
  ADD KEY `idx_service_history_user` (`public_user_id`);

--
-- Indexes for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `idx_public_user_requests` (`public_user_id`,`status`),
  ADD KEY `idx_service_type` (`service_type`),
  ADD KEY `idx_status_date` (`status`,`created_at`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `public_user_id` (`public_user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `nic` (`nic`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`(250)),
  ADD KEY `idx_user_sessions` (`user_id`,`is_valid`,`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forms`
--
ALTER TABLE `forms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `form_submissions`
--
ALTER TABLE `form_submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `id_card_logs`
--
ALTER TABLE `id_card_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `public_id_counter`
--
ALTER TABLE `public_id_counter`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `public_users`
--
ALTER TABLE `public_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qr_scans`
--
ALTER TABLE `qr_scans`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qr_scan_logs`
--
ALTER TABLE `qr_scan_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_history`
--
ALTER TABLE `service_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
