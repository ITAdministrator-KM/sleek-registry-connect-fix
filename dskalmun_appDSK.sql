-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 25, 2025 at 03:59 PM
-- Server version: 8.0.42-cll-lve
-- PHP Version: 8.3.22

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

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`dskalmun`@`localhost` PROCEDURE `sp_call_next_token` (IN `p_department_id` VARCHAR(36), IN `p_division_id` VARCHAR(36), IN `p_staff_id` VARCHAR(36), OUT `p_token_id` VARCHAR(36), OUT `p_token_number` VARCHAR(20))   BEGIN
    DECLARE v_current_date DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_current_date = CURDATE();

    -- Get next waiting token (priority: urgent, vip, then normal by creation time)
    SELECT id, token_number INTO p_token_id, p_token_number
    FROM service_tokens
    WHERE department_id = p_department_id 
      AND division_id = p_division_id
      AND DATE(created_at) = v_current_date
      AND status = 'waiting'
    ORDER BY 
        CASE priority_level 
            WHEN 'urgent' THEN 1 
            WHEN 'vip' THEN 2 
            ELSE 3 
        END,
        created_at ASC
    LIMIT 1;

    IF p_token_id IS NOT NULL THEN
        -- Update token status
        UPDATE service_tokens 
        SET status = 'called', 
            called_at = NOW(), 
            staff_id = p_staff_id,
            updated_by = p_staff_id
        WHERE id = p_token_id;

        -- Update queue management
        UPDATE token_queue_management 
        SET tokens_waiting = tokens_waiting - 1,
            last_called_token = p_token_number,
            updated_at = NOW()
        WHERE department_id = p_department_id 
          AND division_id = p_division_id 
          AND date = v_current_date;

        -- Log the action
        INSERT INTO token_audit_log (
            token_id, action_type, old_status, new_status, action_by
        )
        VALUES (
            p_token_id, 'called', 'waiting', 'called', p_staff_id
        );
    END IF;

    COMMIT;
END$$

CREATE DEFINER=`dskalmun`@`localhost` PROCEDURE `sp_cancel_token` (IN `p_token_id` VARCHAR(36), IN `p_staff_id` VARCHAR(36), IN `p_reason` TEXT)   BEGIN
    DECLARE v_department_id VARCHAR(36);
    DECLARE v_division_id VARCHAR(36);
    DECLARE v_current_date DATE;
    DECLARE v_old_status VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_current_date = CURDATE();

    -- Get token details
    SELECT department_id, division_id, status
    INTO v_department_id, v_division_id, v_old_status
    FROM service_tokens
    WHERE id = p_token_id AND status IN ('waiting', 'called');

    IF v_department_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Token not found or cannot be cancelled';
    END IF;

    -- Update token status
    UPDATE service_tokens 
    SET status = 'cancelled',
        cancelled_at = NOW(),
        notes = p_reason,
        updated_by = p_staff_id
    WHERE id = p_token_id;

    -- Update queue management
    UPDATE token_queue_management 
    SET tokens_cancelled = tokens_cancelled + 1,
        tokens_waiting = CASE WHEN v_old_status = 'waiting' THEN tokens_waiting - 1 ELSE tokens_waiting END,
        updated_at = NOW()
    WHERE department_id = v_department_id 
      AND division_id = v_division_id 
      AND date = v_current_date;

    -- Log the action
    INSERT INTO token_audit_log (
        token_id, action_type, old_status, new_status, action_by, notes
    )
    VALUES (
        p_token_id, 'cancelled', v_old_status, 'cancelled', p_staff_id, p_reason
    );

    COMMIT;
END$$

CREATE DEFINER=`dskalmun`@`localhost` PROCEDURE `sp_complete_token` (IN `p_token_id` VARCHAR(36), IN `p_staff_id` VARCHAR(36), IN `p_notes` TEXT)   BEGIN
    DECLARE v_department_id VARCHAR(36);
    DECLARE v_division_id VARCHAR(36);
    DECLARE v_current_date DATE;
    DECLARE v_service_time INT;
    DECLARE v_token_number VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_current_date = CURDATE();

    -- Get token details and calculate service time
    SELECT 
        department_id, division_id, token_number,
        CASE 
            WHEN serving_started_at IS NOT NULL THEN 
                TIMESTAMPDIFF(MINUTE, serving_started_at, NOW())
            WHEN called_at IS NOT NULL THEN 
                TIMESTAMPDIFF(MINUTE, called_at, NOW())
            ELSE 
                TIMESTAMPDIFF(MINUTE, created_at, NOW())
        END
    INTO v_department_id, v_division_id, v_token_number, v_service_time
    FROM service_tokens
    WHERE id = p_token_id AND status IN ('called', 'serving');

    IF v_department_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Token not found or not in valid status';
    END IF;

    -- Update token status
    UPDATE service_tokens 
    SET status = 'served',
        served_at = NOW(),
        actual_service_time = v_service_time,
        staff_id = p_staff_id,
        notes = p_notes,
        updated_by = p_staff_id
    WHERE id = p_token_id;

    -- Update queue management
    UPDATE token_queue_management 
    SET tokens_served = tokens_served + 1,
        current_serving_token = NULL,
        average_service_time = (
            SELECT AVG(actual_service_time) 
            FROM service_tokens 
            WHERE department_id = v_department_id 
              AND division_id = v_division_id
              AND DATE(created_at) = v_current_date
              AND status = 'served'
              AND actual_service_time IS NOT NULL
        ),
        updated_at = NOW()
    WHERE department_id = v_department_id 
      AND division_id = v_division_id 
      AND date = v_current_date;

    -- Log the action
    INSERT INTO token_audit_log (
        token_id, action_type, old_status, new_status, action_by, notes
    )
    VALUES (
        p_token_id, 'served', 'called', 'served', p_staff_id, p_notes
    );

    COMMIT;
END$$

CREATE DEFINER=`dskalmun`@`localhost` PROCEDURE `sp_generate_token` (IN `p_registry_id` VARCHAR(36), IN `p_department_id` VARCHAR(36), IN `p_division_id` VARCHAR(36), IN `p_service_type` VARCHAR(100), IN `p_priority_level` ENUM('normal','urgent','vip'), IN `p_created_by` VARCHAR(36), OUT `p_token_id` VARCHAR(36), OUT `p_token_number` VARCHAR(20), OUT `p_queue_position` INT, OUT `p_estimated_wait_time` INT)   BEGIN
    DECLARE v_dept_code VARCHAR(10);
    DECLARE v_div_code VARCHAR(10);
    DECLARE v_last_number INT DEFAULT 0;
    DECLARE v_current_date DATE;
    DECLARE v_token_id VARCHAR(36);
    DECLARE v_queue_pos INT DEFAULT 1;
    DECLARE v_avg_service_time DECIMAL(5,2) DEFAULT 15.00;
    DECLARE v_waiting_tokens INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_current_date = CURDATE();
    SET v_token_id = UUID();

    -- Get department and division codes
    SELECT 
        UPPER(LEFT(d.name, 3)), 
        UPPER(LEFT(dv.name, 2))
    INTO v_dept_code, v_div_code
    FROM departments d
    JOIN divisions dv ON dv.id = p_division_id
    WHERE d.id = p_department_id AND d.status = 'active' AND dv.status = 'active';

    IF v_dept_code IS NULL OR v_div_code IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid department or division';
    END IF;

    -- Initialize or update token sequence for today
    INSERT INTO token_sequences (
        department_id, division_id, date, last_token_number, 
        department_code, division_code
    )
    VALUES (
        p_department_id, p_division_id, v_current_date, 1, 
        v_dept_code, v_div_code
    )
    ON DUPLICATE KEY UPDATE 
        last_token_number = last_token_number + 1,
        updated_at = NOW();

    -- Get the new token number
    SELECT last_token_number INTO v_last_number
    FROM token_sequences
    WHERE department_id = p_department_id 
      AND division_id = p_division_id 
      AND date = v_current_date;

    -- Format token number: DEPTDIV-XXXX
    SET p_token_number = CONCAT(v_dept_code, v_div_code, '-', LPAD(v_last_number, 4, '0'));

    -- Calculate queue position and estimated wait time
    SELECT 
        COUNT(*) + 1,
        COALESCE(AVG(actual_service_time), 15)
    INTO v_queue_pos, v_avg_service_time
    FROM service_tokens st
    LEFT JOIN token_queue_management tqm ON (
        tqm.department_id = p_department_id AND 
        tqm.division_id = p_division_id AND 
        tqm.date = v_current_date
    )
    WHERE st.department_id = p_department_id 
      AND st.division_id = p_division_id
      AND DATE(st.created_at) = v_current_date
      AND st.status IN ('waiting', 'called', 'serving');

    -- Calculate waiting tokens for estimated time
    SELECT COUNT(*) INTO v_waiting_tokens
    FROM service_tokens
    WHERE department_id = p_department_id 
      AND division_id = p_division_id
      AND DATE(created_at) = v_current_date
      AND status = 'waiting';

    SET p_estimated_wait_time = v_waiting_tokens * v_avg_service_time;

    -- Create the token
    INSERT INTO service_tokens (
        id, token_number, registry_id, department_id, division_id,
        service_type, queue_position, status, priority_level,
        estimated_service_time, wait_time_minutes, created_by
    )
    VALUES (
        v_token_id, p_token_number, p_registry_id, p_department_id, p_division_id,
        p_service_type, v_queue_pos, 'waiting', p_priority_level,
        v_avg_service_time, p_estimated_wait_time, p_created_by
    );

    -- Update queue management
    INSERT INTO token_queue_management (
        department_id, division_id, date, total_tokens_issued, 
        tokens_waiting, estimated_wait_time
    )
    VALUES (
        p_department_id, p_division_id, v_current_date, 1, 1, p_estimated_wait_time
    )
    ON DUPLICATE KEY UPDATE 
        total_tokens_issued = total_tokens_issued + 1,
        tokens_waiting = tokens_waiting + 1,
        estimated_wait_time = p_estimated_wait_time,
        updated_at = NOW();

    -- Log the action
    INSERT INTO token_audit_log (
        token_id, action_type, new_status, action_by, notes
    )
    VALUES (
        v_token_id, 'created', 'waiting', p_created_by, 
        CONCAT('Token generated: ', p_token_number)
    );

    SET p_token_id = v_token_id;
    SET p_queue_position = v_queue_pos;

    COMMIT;
END$$

CREATE DEFINER=`dskalmun`@`localhost` PROCEDURE `sp_generate_token_number` (IN `p_department_id` INT, IN `p_division_id` INT, OUT `p_token_number` VARCHAR(20), OUT `p_queue_position` INT)   BEGIN
    DECLARE v_dept_code VARCHAR(10);
    DECLARE v_div_code VARCHAR(10);
    DECLARE v_last_number INT;
    DECLARE v_current_date DATE;
    
    SET v_current_date = CURDATE();
    
    -- Get department and division codes
    SELECT UPPER(LEFT(d.name, 3)), UPPER(LEFT(dv.name, 2))
    INTO v_dept_code, v_div_code
    FROM departments d
    JOIN divisions dv ON dv.id = p_division_id
    WHERE d.id = p_department_id;
    
    -- Get or create token sequence for today
    INSERT INTO token_sequences (department_id, division_id, date, last_token_number, department_code, division_code)
    VALUES (p_department_id, p_division_id, v_current_date, 0, v_dept_code, v_div_code)
    ON DUPLICATE KEY UPDATE last_token_number = last_token_number;
    
    -- Increment and get new token number
    UPDATE token_sequences 
    SET last_token_number = last_token_number + 1,
        updated_at = NOW()
    WHERE department_id = p_department_id 
      AND division_id = p_division_id 
      AND date = v_current_date;
    
    -- Get the new token number
    SELECT last_token_number INTO v_last_number
    FROM token_sequences
    WHERE department_id = p_department_id 
      AND division_id = p_division_id 
      AND date = v_current_date;
    
    -- Format token number: DEPTDIV-001
    SET p_token_number = CONCAT(v_dept_code, v_div_code, '-', LPAD(v_last_number, 3, '0'));
    
    -- Get queue position (count of waiting tokens for this department/division today)
    SELECT COUNT(*) + 1 INTO p_queue_position
    FROM service_tokens st
    WHERE st.department_id = p_department_id 
      AND st.division_id = p_division_id
      AND DATE(st.created_at) = v_current_date
      AND st.status IN ('waiting', 'called');
      
END$$

CREATE DEFINER=`dskalmun`@`localhost` PROCEDURE `sp_get_queue_status` (IN `p_department_id` VARCHAR(36), IN `p_division_id` VARCHAR(36))   BEGIN
    DECLARE v_current_date DATE;
    SET v_current_date = CURDATE();

    SELECT 
        tqm.total_tokens_issued,
        tqm.tokens_served,
        tqm.tokens_waiting,
        tqm.tokens_cancelled,
        tqm.average_service_time,
        tqm.estimated_wait_time,
        tqm.current_serving_token,
        tqm.last_called_token,
        COUNT(st.id) as active_tokens,
        d.name as department_name,
        dv.name as division_name
    FROM token_queue_management tqm
    LEFT JOIN service_tokens st ON (
        st.department_id = tqm.department_id AND 
        st.division_id = tqm.division_id AND 
        DATE(st.created_at) = tqm.date AND 
        st.status IN ('waiting', 'called', 'serving')
    )
    LEFT JOIN departments d ON d.id = tqm.department_id
    LEFT JOIN divisions dv ON dv.id = tqm.division_id
    WHERE tqm.department_id = p_department_id 
      AND tqm.division_id = p_division_id 
      AND tqm.date = v_current_date
    GROUP BY tqm.id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `application_timeline`
--

CREATE TABLE `application_timeline` (
  `id` int NOT NULL,
  `service_request_id` int NOT NULL,
  `status` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci,
  `staff_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

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
  `dept_id` varchar(10) COLLATE utf8mb3_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb3_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `dept_id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'DEP001', 'Administration', 'Issuing of Permits\r\nCertifying  and Counter signing of Grama Niladari Certificates\r\nRenewing Licenses\r\nCollecting Revenue\r\n', 'active', '2025-05-26 04:38:32', '2025-06-12 05:46:17'),
(14, 'DEP005', 'SSO', 'Provision of Aids and Equipment\'s.\nIssuing Senior Citizenship Identity Cards\nIssuing Dry Rations', 'active', '2025-06-12 05:48:29', '2025-06-12 05:48:29'),
(13, 'DEP004', 'ADR', 'BC,DC,MC provides', 'active', '2025-06-12 05:48:02', '2025-06-12 05:48:02'),
(12, 'DEP003', 'Accounts Division', 'Preparing the Procurement Plan of the Year\nAll the activities related to payments\nConducting Board of Surveys\nHandling Audit Queries\nPreparing Financial Statements', 'active', '2025-06-12 05:47:33', '2025-06-12 05:47:33'),
(11, 'DEP002', 'Planning Division', 'Identifying the Development Needs\nEvaluation the Progress of the Projects\nUpdating PMCS\nMaintaining and Updating Resources Profile of the Division', 'active', '2025-06-12 05:47:02', '2025-06-12 05:47:02'),
(15, 'DEP006', 'NIC', 'Provides NIC', 'active', '2025-06-12 05:48:50', '2025-06-12 05:48:50');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `id` int NOT NULL,
  `div_id` varchar(10) COLLATE utf8mb3_unicode_ci NOT NULL,
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

INSERT INTO `divisions` (`id`, `div_id`, `name`, `department_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
(17, 'DIV007', 'Senior Citizenship Identity Cards', 14, 'Issuing Senior Citizenship Identity Cards', 'active', '2025-06-12 05:53:08', '2025-06-12 05:53:08'),
(16, 'DIV006', 'Aids and Equipment\'s', 14, 'Provision of Aids and Equipment\'s.', 'inactive', '2025-06-12 05:52:48', '2025-06-23 08:38:50'),
(15, 'DIV005', 'Animal Permit', 1, 'Give Animal Permits for the public', 'active', '2025-06-12 05:52:17', '2025-06-12 05:52:17'),
(14, 'DIV004', 'Collecting Revenue', 1, 'Collecting Revenue', 'active', '2025-06-12 05:51:51', '2025-06-12 05:51:51'),
(13, 'DIV003', 'Licenses', 1, 'Renewing Licenses', 'active', '2025-06-12 05:51:35', '2025-06-12 05:51:35'),
(12, 'DIV002', 'Grama Niladari Certificates', 1, 'Certifying  and Counter signing of Grama Niladari Certificates', 'active', '2025-06-12 05:51:18', '2025-06-12 05:51:18'),
(11, 'DIV001', 'Permits', 1, 'Issuing of Permits', 'active', '2025-06-12 05:50:56', '2025-06-12 05:50:56'),
(18, 'DIV008', 'Dry Rations', 14, 'Issuing Dry Rations', 'active', '2025-06-12 05:53:23', '2025-06-12 05:53:23'),
(19, 'DIV009', 'Aswesume', 11, 'Public services like Asuwesuma, Samurdhi', 'active', '2025-06-12 05:54:29', '2025-06-12 05:54:29'),
(20, 'DIV010', 'Shroff', 12, 'All the activities related to payments', 'active', '2025-06-12 05:55:01', '2025-06-12 05:55:01'),
(21, 'DIV011', 'Fine Payments', 12, 'Payments related to all', 'active', '2025-06-12 05:55:56', '2025-06-12 05:55:56'),
(22, 'DIV012', 'Birth Certificate', 13, 'BC provides', 'active', '2025-06-12 05:56:50', '2025-06-12 05:56:50'),
(23, 'DIV013', 'Marriage Certificate', 13, 'MC', 'active', '2025-06-12 05:57:08', '2025-06-12 05:57:08'),
(24, 'DIV014', 'Death Certificate', 13, 'DC provides', 'active', '2025-06-12 05:57:24', '2025-06-12 05:57:24'),
(25, 'DIV015', 'NIC', 15, 'Provides NIC', 'active', '2025-06-12 05:57:50', '2025-06-12 05:57:50');

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
-- Table structure for table `document_templates`
--

CREATE TABLE `document_templates` (
  `id` int NOT NULL,
  `template_name` varchar(200) COLLATE utf8mb3_unicode_ci NOT NULL,
  `template_code` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `division_id` int DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `file_type` enum('pdf','doc','docx','xlsx') COLLATE utf8mb3_unicode_ci DEFAULT 'pdf',
  `description` text COLLATE utf8mb3_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enhanced_tokens`
--

CREATE TABLE `enhanced_tokens` (
  `id` int NOT NULL,
  `token_number` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `division_id` int DEFAULT NULL,
  `service_request_id` int DEFAULT NULL,
  `public_user_id` int DEFAULT NULL,
  `status` enum('waiting','called','serving','completed','cancelled','no_show') COLLATE utf8mb3_unicode_ci DEFAULT 'waiting',
  `estimated_wait_time` int DEFAULT '15',
  `called_at` datetime DEFAULT NULL,
  `served_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `counter_number` varchar(10) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `staff_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb3_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `excel_edits`
--

CREATE TABLE `excel_edits` (
  `id` int NOT NULL,
  `document_id` int NOT NULL,
  `edited_by_user_id` int NOT NULL,
  `edit_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `version_number` int DEFAULT '1',
  `edit_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `category` enum('service_update','appointment','payment','general','urgent') COLLATE utf8mb3_unicode_ci DEFAULT 'general',
  `action_url` varchar(500) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_id`, `recipient_type`, `title`, `message`, `type`, `category`, `action_url`, `expires_at`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 1, 'public', 'Service Completed', 'Your birth certificate application has been completed and is ready for collection.', 'success', 'general', NULL, NULL, 0, '2025-05-27 10:55:59', '2025-05-27 10:55:59'),
(2, 2, 'public', 'Appointment Reminder', 'You have an appointment scheduled for tomorrow at 10:00 AM.', 'info', 'general', NULL, NULL, 0, '2025-05-27 10:55:59', '2025-05-27 10:55:59');

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
(1, 7497500);

-- --------------------------------------------------------

--
-- Table structure for table `public_registry`
--

CREATE TABLE `public_registry` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `visitor_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitor_nic` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitor_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `division_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `division_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose_of_visit` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `entry_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `exit_time` timestamp NULL DEFAULT NULL,
  `status` enum('active','checked_out','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `public_users`
--

CREATE TABLE `public_users` (
  `id` int NOT NULL,
  `public_user_id` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
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

INSERT INTO `public_users` (`id`, `public_user_id`, `public_id`, `name`, `nic`, `address`, `mobile`, `qr_code_data`, `qr_code_url`, `email`, `photo_url`, `department_id`, `division_id`, `status`, `created_at`, `updated_at`, `username`, `password_hash`, `qr_code`, `last_login`) VALUES
(1, 'PUB00001', 'PUB001', 'T.M.Mohemed Anzar', '853421669V', '167A, Gafoor Lane, F.C Road, Kattankudy 02', '+94777930531', NULL, NULL, 'anzar@example.com', NULL, 1, 0, 'active', '2025-05-27 10:55:59', '2025-06-25 05:49:07', 'Anzar', '$2y$12$pPx/uSy9T/hVPeRx8nMVhuGu6pHKhsD8EpHAkCH9ozkZGdU/4LM3m', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAsQAAALECAIAAACAN7HUAAAACXBIWXMAAA7EAAAOxAGVKw4bAAATaUlEQVR4nO3dS3IlOZIAweFI3v/KOftelEDaMF6OoOoBGN8XNMEC/vP379//AQD4b/3vv30CAMDbxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACD5M3mwn5+fycOt8vfv3yt/59Y9PDmfbce6dQ9PbLv2yWNN3ucTk+f81W/U5Lux7R376jM9MXmfrUwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJKOzOU5smwtw4sW93yf34X/x/kzO1Lhl22yFbffnFnNAum3zO/zf6axMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACTrZnOcmNyTfNue7dvmAmyb9TD5d05M3ucT2347k+fz4syRbc/9xXt4y4vPfZKVCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIDkydkc7PHiHvuTJvfYf3Heyi2T5zM5L2PbbJcTL87QobMyAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCYzfFBt/bz3zbr4cSL+/lvm2+y7VlsO59bJq/9lsnz2fY75Z9ZmQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBInpzN8dU92ydnYZzYNstg0ovzILY9r5Pz+er8l0nmicz46rfuFisTAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAMm62Rxf3df9llt742+b0TB5XV/9O7dMns9XZz28+P785vfwxXdsGysTAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAMnobI7Jfd1f5P502+YUbJt3cGLb/IVbf2fbfZ60bd7KpG3n81VWJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACS0dkck/vDT85WOLHtWLf+zm+eYXFi27XfescmvTgrZNJXv5knfH/2sDIBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkPy8uO/9i3uk/+Zrn7RttsKL8022zWh48Z2ffA9/8+yJF9/Vbe/GLVYmAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAAJLR2RyTXtyz/cTkHvu/eT//E9vm2rz4LG7ZNlth27yMbfdnmxf/F2xjZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgGZ3NsW2+wLbzuWXb3vjb5hTc8tW9+r86M2Kbyd/pizNHXpwnsu3+TP4urEwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJKOzOU5s22/8hHPuts1o2LZX/61j3bLt/TmxbWbEiW3PdNJXr33b7+IWKxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAyZ9/+wT+G9vmJrw4D+Kr+97fcuvdeHEexDYvzgGZ/CZs+45N+upcmxPbnpeVCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIDkZ9ue5C/Oufjq/IVte79v29P+q89r23Wd2DYLY/JY274/274bt2y7P9vmrViZAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEj+/Nsn8J8m5wJs2/f+xf3zX7yuyT3tX5yX8dV348WZI9vu4bZ345Zt78a28zlhZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAg+Znc//yrJveZ37Znu7kk3eS1n/jNz+LEV+dTnNh2n1/8Hn6VlQkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAZHQ2x7YZFr95rsQt2/bqP7FtJsJXZ3zcsu13uu093PY+3/LiN3Pb72vy2q1MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACR/Jg/21X3mf/N+/p7FzLEm/862eSvb5uO8+I06sW0WxrZ3lX9mZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgGZ3N8eKe9pPnMzk74JYXZ4V8dS7JLZOzS7a59f5sm29y6+989dpPTM4uefF/pZUJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgGR0NseLXtxnftu8jMl95l8851u2zcK4dZ9vmTyfyWO5hzN/55avfqOsTAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkP9vmC5zYtif5iRf3qz/x4j7zk89i0lefxbbZCtue+wn3p9v2+9r2f9DKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEDy598+gf8v5gt02/Z+nzT5vCaPte0du/X+vDgTYfL3te18tr2Ht/zmGShWJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACSdbM5Xpx3sG3uxrbzuWXynLfdn8l9+Ldd+zaT8zJueXGeyC1fnSey7VlYmQAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIfrbto35icp/5bbbt53/ixXds0ovv4S3bfqfbfl/b7s8tv/m6vsrKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAyOpvj1l70t451Ytv9OTG57/2Lx9r2TLfdw1u2nfNXZ3ycePF3cWLbOU++q9veMSsTAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAMmff/sE/tPk/vm3bNtH3R7y3a3r+s3XfmLy/rw42+XEb57/cmLbM711n7ddl5UJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgGTdbI4XvThfYHIGyrZZD9tml2yzbU7B5DPd9txvnfOL7+Et22aFbDufW6xMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACQ/2/YJ/817yJ/46j782+ZB3LJt1sM2274/k7bNJZn01ff5xLZncYuVCQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIDkydkck/vVT/6dW7bNudh2f26ZvK4Xj/Wb/84t234XL/6/ODE5Q+fFY52wMgEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQ/Pm3T+A/3dpLfHKWwbY90k9M7vm/bX7H5LN48bpefJ9vefEeTp7zb343Tkw+i22sTAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAk62ZznPjqvvfb5ji8eKxJ22ZqnJj87Uw+023v863z2XZdk/OMbtn2LLb9b7rFygQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBA8uRsjm17kk/ux37Csf7Zree1bYbFV8958nmdHGvbfJMXj7VtzsUtX50DcsLKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEDyM7l39639/E9s29t827VP+upe9CcmZ1i86MVnestv/v5MfhNuefF/pdkcAMAzxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAZnc1xYtsch8m9309s26v/xfPZ9o5NMg9ixovvz7bz2Wbb+7ONlQkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCA5LOzOW4d68Tk+WybPXHCnIKZY704R+bFeQcv3ucTL/4GJ217n09MPi8rEwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAADJutkcJ16cZbBtT/tt53PixbkkzPjq/JcT22aObLuHXz2fbdduZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAg+TN5sBdnNEzads7bnte2Y92yba/+bfNNtv1OT3z1t3zLb55hceLFc7YyAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCMzua4tZ//rX3mJ/erP7n2bXv1b9v7/ZZt93ny70x6cU7KiRdnoGybZzT5d279T5n8bmx7XiesTAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAko7M5tnlxRsO2Pe23nc+tY03aNp9i2/25Zduci1u2fcdunc+L93Dy2rf9Tq1MAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACSjszm27bVuJsI/2zbL4KszCLaZnIHy4jPd9t24dV3bnsWJF5/XLdu+UVYmAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAAJLR2RwnJvda/+rMiMm/s20+xYv78E++85Pv84vv2Iv3Z/JYt679q9/5F78/t1iZAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEh+tu17f+LFPdK3zQHZ9iy2vYcv3ucTv/m5n5ic0fDitZ948bpefKbbzsfKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAyOpvjhP3h9xzrxTkOkzNZts3LuGXbdb34u9g262HbHIcTv/mcX7x2KxMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAybrZHLd8dd/7bcc68eJMjW3zMn4z36g9f+eWbeezzYvzO6xMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACSfnc3xom1745/YNr/jxT3tX3zuJ7a9G7e8+M3cdn8m341bts0K2fYeWpkAABIxAQAkYgIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASP5MHmzb3uaTTvZR3zaf4sTk/vAvzt04sW1Oyov38MSt92fbd2zbt+XE5Dfqq9e1jZUJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBAIiYAgGR0NseJF/f837aH/Lb5HS/Oeth2zpP7+W+bt3Lr72ybRzP5+9rmq+/zb2ZlAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACBZN5vjxFf3dZ+cLzBp2974X52BcuLF92dyTsq2d/XEi7NCbv0uXnyfJ5/X5PtsZQIASMQEAJCICQAgERMAQCImAIBETAAAiZgAABIxAQAkYgIASMQEAJCICQAgeXI2x1fd2md+cj/2bfvDT87CMMdh5lhfnZNyYts7tu33fsu2d+PF+2xlAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAxm2ORW/vD39rX/TfP+Jic37Ftj/1t8ylOfHX+y7Y5Mi/Odjkx+bxe/CacsDIBACRiAgBIxAQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkDw5m+PFfcsn3Zod8OI+/NvmSmw7nxe9eA8n53dsm2Hx4uyJ3/zNvMXKBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAECybjbHi/vw33JrP/Ztf+eWyXdj22yFF4+1bY7DttkKJyZ/X9t+y9ueBf/MygQAkIgJACAREwBAIiYAgERMAACJmAAAEjEBACRiAgBIxAQAkIgJACAREwBA8jO5HzsA8D1WJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAAASMQEAJGICAEjEBACQiAkAIBETAEAiJgCAREwAAImYAACS/wNniv2gvNJqDgAAAABJRU5ErkJggg==', NULL),
(6, 'PUB00002', 'PUB74974', 'Farhana Sulaima Lebbe', '937080590V', '212A,Cassim Road, Kalmunai Kudy 11', '0775560909', NULL, NULL, 'itdskalmunai@gmail.com', NULL, 1, 0, 'active', '2025-06-12 10:05:36', '2025-06-12 10:06:11', 'Farhana', '$2y$12$cheM6qwkUeQQh21zgrq7zuoTfggcwL2YM3KawgYUe6vb12Fa3x8ai', '', NULL),
(7, 'PUB00003', 'PUB74975', 'Front desk', '200080789v', ' Kalmunai', '0112223852', NULL, NULL, 'desk@gmail.com', NULL, 1, 23, 'active', '2025-06-19 08:59:58', '2025-06-25 09:43:43', 'PUB008', '$2y$12$c0l20MBGpaTKSQhsBZYZ7.MQotPTdw.hQAHjwflTXy0VXKqu613ci', '', NULL);

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

--
-- Dumping data for table `qr_codes`
--

INSERT INTO `qr_codes` (`id`, `public_user_id`, `qr_code_data`, `qr_code_url`, `created_at`, `updated_at`) VALUES
(1, 6, '{\"public_id\":\"PUB00002\",\"name\":\"Farhana Sulaima Lebbe\",\"nic\":\"937080590V\",\"created_at\":\"2025-06-12 10:05:36\"}', 'https://dskalmunai.lk/qr-scan/PUB00002', '2025-06-12 10:05:36', '2025-06-12 10:05:36'),
(2, 7, '{\"public_id\":\"PUB00003\",\"name\":\"Front desk\",\"nic\":\"200080789v\",\"created_at\":\"2025-06-19 08:59:58\"}', 'https://dskalmunai.lk/qr-scan/PUB00003', '2025-06-19 08:59:58', '2025-06-19 08:59:58');

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
-- Table structure for table `request_documents`
--

CREATE TABLE `request_documents` (
  `id` int NOT NULL,
  `service_request_id` int NOT NULL,
  `document_type` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_catalog`
--

CREATE TABLE `service_catalog` (
  `id` int NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `department_id` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 0xF09F9384,
  `fee_amount` decimal(10,2) DEFAULT '0.00',
  `required_documents` text COLLATE utf8mb4_unicode_ci,
  `processing_time_days` int DEFAULT '7',
  `eligibility_criteria` text COLLATE utf8mb4_unicode_ci,
  `form_template_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_catalog`
--

INSERT INTO `service_catalog` (`id`, `service_name`, `service_code`, `description`, `department_id`, `division_id`, `icon`, `fee_amount`, `required_documents`, `processing_time_days`, `eligibility_criteria`, `form_template_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Marriage Registration', 'MR-001', 'Registration of marriages', NULL, NULL, '📄', 0.00, NULL, 7, NULL, NULL, 'active', '2025-06-23 09:02:39', '2025-06-23 09:02:39'),
(2, 'Birth Certificate', 'BC-001', 'Application for birth certificate', NULL, NULL, '📄', 0.00, NULL, 7, NULL, NULL, 'active', '2025-06-23 09:02:39', '2025-06-23 09:02:39'),
(3, 'Death Certificate', 'DC-001', 'Application for death certificate', NULL, NULL, '📄', 0.00, NULL, 7, NULL, NULL, 'active', '2025-06-23 09:02:39', '2025-06-23 09:02:39'),
(4, 'Business License', 'BL-001', 'Business registration and licensing', NULL, NULL, '📄', 0.00, NULL, 7, NULL, NULL, 'active', '2025-06-23 09:02:39', '2025-06-23 09:02:39'),
(5, 'Building Permit', 'BP-001', 'Application for building construction permit', NULL, NULL, '📄', 0.00, NULL, 7, NULL, NULL, 'active', '2025-06-23 09:02:39', '2025-06-23 09:02:39');

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
-- Table structure for table `service_tokens`
--

CREATE TABLE `service_tokens` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `token_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registry_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `division_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General Service',
  `queue_position` int DEFAULT '0',
  `status` enum('waiting','called','serving','served','cancelled','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `priority_level` enum('normal','urgent','vip') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `estimated_service_time` int DEFAULT '15' COMMENT 'Estimated service time in minutes',
  `actual_service_time` int DEFAULT NULL COMMENT 'Actual service time in minutes',
  `wait_time_minutes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `called_at` timestamp NULL DEFAULT NULL,
  `serving_started_at` timestamp NULL DEFAULT NULL,
  `served_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `staff_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Staff member who served',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `subject_staff`
--

CREATE TABLE `subject_staff` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `staff_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `post` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_department_id` int NOT NULL,
  `assigned_division_id` int NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `called_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`id`, `token_number`, `department_id`, `division_id`, `public_user_id`, `status`, `created_at`, `updated_at`, `called_at`) VALUES
(1, 1, 1, 1, NULL, 'active', '2025-05-29 07:32:35', '2025-05-29 07:32:35', NULL),
(2, 1, 1, 2, NULL, 'active', '2025-05-29 08:15:37', '2025-05-29 08:15:37', NULL),
(3, 2, 1, 1, NULL, 'active', '2025-05-29 09:12:17', '2025-05-29 09:12:17', NULL),
(4, 3, 1, 1, NULL, 'active', '2025-05-29 09:28:09', '2025-05-29 09:28:09', NULL),
(5, 1, 1, 2, NULL, 'active', '2025-05-30 03:23:46', '2025-05-30 03:23:46', NULL),
(6, 2, 1, 2, NULL, 'active', '2025-05-30 03:25:25', '2025-05-30 03:25:25', NULL),
(7, 1, 1, 1, NULL, 'active', '2025-05-30 03:52:14', '2025-05-30 03:52:14', NULL),
(8, 2, 1, 1, NULL, 'active', '2025-05-30 03:53:01', '2025-05-30 03:53:01', NULL),
(9, 1, 3, 6, NULL, 'active', '2025-05-30 05:28:46', '2025-05-30 05:28:46', NULL),
(10, 1, 1, 2, NULL, 'active', '2025-06-03 07:50:58', '2025-06-03 07:50:58', NULL),
(11, 1, 7, 9, NULL, 'active', '2025-06-03 07:51:30', '2025-06-03 07:51:30', NULL),
(12, 1, 7, 9, NULL, 'active', '2025-06-04 09:16:12', '2025-06-04 09:16:12', NULL),
(13, 2, 7, 9, NULL, 'active', '2025-06-04 09:28:11', '2025-06-04 09:28:11', NULL),
(14, 1, 1, 1, NULL, 'active', '2025-06-04 09:29:27', '2025-06-04 09:29:27', NULL),
(15, 2, 1, 1, NULL, 'active', '2025-06-04 09:30:54', '2025-06-04 09:30:54', NULL),
(16, 3, 7, 9, NULL, 'active', '2025-06-04 10:01:22', '2025-06-04 10:01:22', NULL),
(17, 4, 7, 9, NULL, 'active', '2025-06-04 10:02:19', '2025-06-04 10:02:19', NULL),
(18, 1, 1, 2, NULL, 'active', '2025-06-05 03:56:33', '2025-06-05 03:56:33', NULL),
(19, 2, 1, 2, NULL, 'active', '2025-06-05 03:57:31', '2025-06-05 03:57:31', NULL),
(20, 3, 1, 2, NULL, 'active', '2025-06-05 04:00:18', '2025-06-05 04:00:18', NULL),
(21, 1, 2, 3, NULL, 'active', '2025-06-05 04:20:19', '2025-06-05 04:20:19', NULL),
(22, 2, 2, 3, NULL, 'active', '2025-06-05 04:20:34', '2025-06-05 04:20:34', NULL),
(23, 1, 1, 1, NULL, 'active', '2025-06-06 04:47:01', '2025-06-06 04:47:01', NULL),
(24, 1, 1, 1, NULL, 'active', '2025-06-11 05:06:54', '2025-06-11 05:06:54', NULL),
(25, 2, 1, 1, NULL, 'active', '2025-06-11 05:07:07', '2025-06-11 05:07:07', NULL),
(26, 3, 1, 1, NULL, 'active', '2025-06-11 05:07:11', '2025-06-11 05:07:11', NULL),
(27, 1, 10, 10, NULL, 'active', '2025-06-12 05:41:22', '2025-06-12 05:41:22', NULL),
(28, 1, 12, 21, NULL, 'active', '2025-06-12 08:59:21', '2025-06-12 08:59:21', NULL),
(29, 1, 11, 19, NULL, 'active', '2025-06-12 09:00:03', '2025-06-12 09:00:03', NULL),
(30, 1, 12, 21, NULL, 'active', '2025-06-19 09:14:44', '2025-06-19 09:14:44', NULL),
(31, 2, 12, 21, NULL, 'active', '2025-06-19 09:34:18', '2025-06-19 09:34:18', NULL),
(32, 1, 12, 21, NULL, 'active', '2025-06-20 06:58:47', '2025-06-20 06:58:47', NULL),
(33, 1, 13, 24, NULL, 'active', '2025-06-20 06:59:09', '2025-06-20 06:59:09', NULL),
(34, 1, 1, 14, NULL, 'active', '2025-06-20 07:21:00', '2025-06-20 07:21:00', NULL),
(35, 1, 11, 19, NULL, 'active', '2025-06-20 07:21:13', '2025-06-20 07:21:13', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `token_audit_log`
--

CREATE TABLE `token_audit_log` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `token_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` enum('created','called','serving','served','cancelled','status_change') COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `token_queue_management`
--

CREATE TABLE `token_queue_management` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `department_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `division_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `total_tokens_issued` int DEFAULT '0',
  `tokens_served` int DEFAULT '0',
  `tokens_waiting` int DEFAULT '0',
  `tokens_cancelled` int DEFAULT '0',
  `average_service_time` decimal(5,2) DEFAULT '0.00',
  `longest_wait_time` int DEFAULT '0',
  `current_serving_token` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_called_token` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_wait_time` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `token_sequences`
--

CREATE TABLE `token_sequences` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `department_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `division_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `last_token_number` int DEFAULT '0',
  `department_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `division_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `nic` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL COMMENT 'Supports both old (12 digits) and new (10 chars) NIC formats',
  `email` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `role` enum('admin','staff','public','subject_staff') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'public',
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
(11, 'PUB001', 'Public One', '901234571V', 'public1@example.com', 'public1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'public', NULL, NULL, 'active', '2025-06-06 04:24:48', '2025-06-06 04:24:48'),
(9, 'STF001', 'Staff One', '901234569V', 'staff1@example.com', 'staff1', '$argon2id$v=19$m=65536,t=4,p=1$cURZMVVrRUxudzI5REtlYw$FgiiXoyx6UhRotTEUVLM/gFQ27BPiDIhFIPbuO9sa5k', 'staff', 1, 1, 'active', '2025-06-06 04:24:48', '2025-06-24 04:52:52'),
(7, 'ADM001', 'Admin One', '901234567V', 'admin1@example.com', 'admin1', '$argon2id$v=19$m=65536,t=4,p=1$WVhNb3pkQzFjbmFFdUgwMg$/4UMR7Xxmge0Vz6E2HyLeB6IMxxcBoBJdgVkAcfSzkA', 'admin', NULL, NULL, 'active', '2025-06-06 04:24:48', '2025-06-13 04:55:40'),
(14, 'ADM002', 'Farhana', '9012345967V', 'farhana@admin.com', 'farhana', '$argon2id$v=19$m=65536,t=4,p=1$T0lFYWZmYVNQbkFSWUxHdA$1PV7f0OdhGhPEqqZoNKw8fdwMPfwyuJzo5rYjBrSA2g', 'admin', NULL, NULL, 'active', '2025-06-25 05:46:42', '2025-06-25 05:48:20'),
(15, 'STA17508418222202', 'Reception', '853421234V', 'reception@gmail.com', 'Reception', '$argon2id$v=19$m=65536,t=4,p=1$RUduUWR4UGVudjFnTFdkSA$tp8kiD7G4WBYOrcwJ4xWwWLIXPmQgDOAi22PXnsOYUA', 'staff', 1, NULL, 'active', '2025-06-25 08:57:02', '2025-06-25 08:57:02');

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
(11, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhdGltYSAiLCJyb2xlIjoicHVibGljIiwiZXhwIjoxNzQ5MTE0NDEwfQ.N-YKmaY9wP-Er3EVAS5BA-TNbfY_tHobD3PFi2hoYWA', 1, '2025-06-05 09:06:50', '2025-06-04 09:06:50', '2025-06-04 09:06:50'),
(12, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTE0OTYyfQ.ZInB1Sqsp93hUI6JQfoUYhQvQ8MrDidtYKLpetjPOIU', 1, '2025-06-05 09:16:02', '2025-06-04 09:16:02', '2025-06-04 09:16:02'),
(13, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTE1NzI3fQ.EpYmfEslUuMYf_GRAhpA7oG6cgrmFWe6Dg_7wi5_7Ls', 1, '2025-06-05 09:28:47', '2025-06-04 09:28:47', '2025-06-04 09:28:47'),
(14, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTgyMTc0fQ.FzSAgc9OtH2DN18A27PyUR0ZCpHvPgZ_Cdt1yTymOEQ', 1, '2025-06-06 03:56:14', '2025-06-05 03:56:14', '2025-06-05 03:56:14'),
(15, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTg0MDE5fQ.tZbwAmuebMEfdJ10KWB2bsaJzyp2xwCkQXxul8nRNXw', 1, '2025-06-06 04:26:59', '2025-06-05 04:26:59', '2025-06-05 04:26:59'),
(16, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODYwNDR9.yiM5Wgscf-vP3BQQhu_vHUPA10rJkMawhVrGGn8aig4', 1, '2025-06-06 05:00:44', '2025-06-05 05:00:44', '2025-06-05 05:00:44'),
(17, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODYyNjl9.YWGUmk0Hg--fSbsk588oE6_2hrBqsR8878Ef7ezlaU0', 1, '2025-06-06 05:04:29', '2025-06-05 05:04:29', '2025-06-05 05:04:29'),
(18, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODYyNzZ9.25ZRfn5QBnd-HXLtH6oOctKDID_VxPpmrdG6JIvwo2o', 1, '2025-06-06 05:04:36', '2025-06-05 05:04:36', '2025-06-05 05:04:36'),
(19, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODYyODd9.IsQyt5IHEm3WCTP0SCO0o3aTgH_de8mI0oYKe7M6WdE', 1, '2025-06-06 05:04:47', '2025-06-05 05:04:47', '2025-06-05 05:04:47'),
(20, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODYyOTF9.PpK_ZD2s4hkIh7QxuEOvDOGr1j26WaXf0NSPr8cgs60', 1, '2025-06-06 05:04:51', '2025-06-05 05:04:51', '2025-06-05 05:04:51'),
(21, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODYzMDB9.DASFQ2MyC9R0kytrEyLaK_4LeGOlgkPtIiuIPcTonDE', 1, '2025-06-06 05:05:00', '2025-06-05 05:05:00', '2025-06-05 05:05:00'),
(22, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODY3NTN9.hfNcmOdG7LSyHXa4bi_2r2EqfOiesV6NbpXqU89O5XQ', 1, '2025-06-06 05:12:33', '2025-06-05 05:12:33', '2025-06-05 05:12:33'),
(23, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODcwODl9.Dz2La3ixm_74YcVqP4FcaG2qAOzUr8tgBJmJyKB-2zA', 1, '2025-06-06 05:18:09', '2025-06-05 05:18:09', '2025-06-05 05:18:09'),
(24, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODcyMTR9.oVxQxiK5WsYvcbckmoJxEG_2nsk1q02QPeOaJbkBjss', 1, '2025-06-06 05:20:14', '2025-06-05 05:20:14', '2025-06-05 05:20:14'),
(25, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODcyOTd9.QGewND80c4YdbKEyglCYeZSOqpYLw5IdXErEyQmNy2Q', 1, '2025-06-06 05:21:37', '2025-06-05 05:21:37', '2025-06-05 05:21:37'),
(26, 4, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Ik1hcmxpeWEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkxODc5NzR9.7bUOlo0qNt144SNi-mOtGpaPwdN_YXE3xSvqvBswJ1A', 1, '2025-06-06 05:32:54', '2025-06-05 05:32:54', '2025-06-05 05:32:54'),
(27, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTg4MDE5fQ.pKu3PkG3JKOYwRIi1TL05Jfi9kd8Yot18e8UkEhw8DQ', 1, '2025-06-06 05:33:39', '2025-06-05 05:33:39', '2025-06-05 05:33:39'),
(28, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJwdWJsaWNfaWQiOiJQVUIwMDIiLCJ1c2VybmFtZSI6IkZhdGltYSAiLCJyb2xlIjoicHVibGljIiwiZXhwIjoxNzQ5MTg4MDM0fQ.lAzVJaPZoRupSN8URik3iBYNwdBf4xp0BL0if8DpGM8', 1, '2025-06-06 05:33:54', '2025-06-05 05:33:54', '2025-06-05 05:33:54'),
(29, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTkwMDU0fQ.-15Eoey7emZceTWdDtGT602ylwKviBdS2uNzoBFBxfY', 1, '2025-06-06 06:07:34', '2025-06-05 06:07:34', '2025-06-05 06:07:34'),
(30, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTkwNTc4fQ.BRYODiN99SwKrHsY2NyO8jLckIPBIqhM-JuXZfMhXJk', 1, '2025-06-06 06:16:18', '2025-06-05 06:16:18', '2025-06-05 06:16:18'),
(31, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MTkxMTA4fQ.l0V2XMoEfUs8docGQ-LG5wmPaOE-6EiIxFpowi9rhZ8', 1, '2025-06-06 06:25:08', '2025-06-05 06:25:08', '2025-06-05 06:25:08'),
(32, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhcmhhbmEiLCJyb2xlIjoic3RhZmYiLCJleHAiOjE3NDkxOTExNTZ9.jGJR_5hH5pVTklH65PWvigQ-tcR0ITihHky6i3dVKAE', 1, '2025-06-06 06:25:56', '2025-06-05 06:25:56', '2025-06-05 06:25:56'),
(33, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhcmhhbmEiLCJyb2xlIjoic3RhZmYiLCJleHAiOjE3NDkxOTE4MTV9.aBPxjBe905-x5_PouxR5dbLvOTQ4SUj6OAc4tBF0lEw', 1, '2025-06-06 06:36:55', '2025-06-05 06:36:55', '2025-06-05 06:36:55'),
(34, 2, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6IkZhcmhhbmEiLCJyb2xlIjoic3RhZmYiLCJleHAiOjE3NDkyNjcyMTV9.KdYuE-NWQsvz5naC8vV3xA-oOgA-pHSqWqZ27AXnaMw', 1, '2025-06-07 03:33:35', '2025-06-06 03:33:35', '2025-06-06 03:33:35'),
(35, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MjY3NzczfQ.DFISbCFeaOS29vbVAG8cr0pONdv_hjLWwayDjYabiCQ', 1, '2025-06-07 03:42:53', '2025-06-06 03:42:53', '2025-06-06 03:42:53'),
(36, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MjY4MTg1fQ.rgn4ZVnfZSrQnd0bJVGEzcxY1-9syh1QbFwMKeYv8fE', 1, '2025-06-07 03:49:45', '2025-06-06 03:49:45', '2025-06-06 03:49:45'),
(37, 5, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1LCJ1c2VybmFtZSI6InN0YWZmIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5MjY5NjQ5fQ.t5buwcyC6IV4KZXm0dbc8lPGSyUe-ACoapu5cB0CuRw', 1, '2025-06-07 04:14:09', '2025-06-06 04:14:09', '2025-06-06 04:14:09'),
(38, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3MDMzN30.cQrl_l6qM60Mu6qp2F8Wcf5VDtN2VO1KZwVYa0WRkE0', 1, '2025-06-07 04:25:37', '2025-06-06 04:25:37', '2025-06-06 04:25:37'),
(39, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3MDQwNn0.va_1bstOkze2GyG7abUQsW7MRuwEpdYjB36ExMtbRSU', 1, '2025-06-07 04:26:46', '2025-06-06 04:26:46', '2025-06-06 04:26:46'),
(40, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3MDg3NX0.SXPASydks9LvHMKDVgKjDcLb9r0v8Edwuhb4gF_-ZD0', 1, '2025-06-07 04:34:35', '2025-06-06 04:34:35', '2025-06-06 04:34:35'),
(41, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTI3MTcyNn0.GHH92Gg_2pXtLP01xdbC3Ta71JjCtIgi7ne9L3ACLTw', 1, '2025-06-07 04:48:46', '2025-06-06 04:48:46', '2025-06-06 04:48:46'),
(42, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3MTg3OX0.iIhfQ16wzBbF-GS_Md4egsXZjhMmDPnD9DVlgYjy1XM', 1, '2025-06-07 04:51:19', '2025-06-06 04:51:19', '2025-06-06 04:51:19'),
(43, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3MTkyOH0.vRTjopNSjnh_83JxMCognnk-jrn0kAKLYvHPtvqPd-k', 1, '2025-06-07 04:52:08', '2025-06-06 04:52:08', '2025-06-06 04:52:08'),
(44, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTI3MTk1M30.8sM3gC6f18j72fduMEx5a-gM4qPjhDwKXroVudiAlFs', 1, '2025-06-07 04:52:33', '2025-06-06 04:52:33', '2025-06-06 04:52:33'),
(45, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTI3MjIzMH0.CoNjRLr62ViJI4lVDADPEM532qzSNVOwI4UtLfgKfvA', 1, '2025-06-07 04:57:10', '2025-06-06 04:57:10', '2025-06-06 04:57:10'),
(46, 13, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMywidXNlcm5hbWUiOiJ0ZXN0c3RhZmYiLCJyb2xlIjoic3RhZmYiLCJleHAiOjE3NDkyNzI3NDR9.Lsh_-81A0WnJjmTlaGIHGJjcnuMg6MGFwVag_ym0eC8', 1, '2025-06-07 05:05:44', '2025-06-06 05:05:44', '2025-06-06 05:05:44'),
(47, 13, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMywidXNlcm5hbWUiOiJ0ZXN0c3RhZmYiLCJyb2xlIjoic3RhZmYiLCJleHAiOjE3NDkyNzM5NjV9.rzlCLIGZ4MBFGV2a9tthTsV4EzeG30OrUWpbubp8FZI', 1, '2025-06-07 05:26:05', '2025-06-06 05:26:05', '2025-06-06 05:26:05'),
(48, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3NTY0N30.mg2HMgOKaqown-qq6jrI4SXn2plw0HWXkM2ml0QwxVc', 1, '2025-06-07 05:54:07', '2025-06-06 05:54:07', '2025-06-06 05:54:07'),
(49, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTI3NTcxMn0.Q2hLeWnESmlORxGxtA8NfEnouh3Ze-aShg3j2GoTPy0', 1, '2025-06-07 05:55:12', '2025-06-06 05:55:12', '2025-06-06 05:55:12'),
(50, 13, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMywidXNlcm5hbWUiOiJ0ZXN0c3RhZmYiLCJyb2xlIjoic3RhZmYiLCJleHAiOjE3NDkyNzU3NDZ9.IRIdQnEUtfq2S5v3qH2F9Q3d81h417ASrs1mqhM6iOA', 1, '2025-06-07 05:55:46', '2025-06-06 05:55:46', '2025-06-06 05:55:46'),
(51, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTcwMTYxN30.kAf8cxd-OFiIAO0NRUZth-JdA0YMaghFDosH4leE6HQ', 1, '2025-06-12 04:13:37', '2025-06-11 04:13:37', '2025-06-11 04:13:37'),
(52, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTcwNDY3OH0.Z_zytuHwNmYclt7AkzJEZETVpbORwbtmkEKM1BHpuio', 1, '2025-06-12 05:04:38', '2025-06-11 05:04:38', '2025-06-11 05:04:38'),
(53, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTcwNDcwM30.TdAWvg2SsPP7xAl0XqmkILZq8Oqe6LRskgYYYfVggDM', 1, '2025-06-12 05:05:03', '2025-06-11 05:05:03', '2025-06-11 05:05:03'),
(54, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTcwNDczNn0.T7u3O4n8FARKnBQqjS4hw2mQr9R35tdNhp0v8R8OmyA', 1, '2025-06-12 05:05:36', '2025-06-11 05:05:36', '2025-06-11 05:05:36'),
(55, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTc4NzQ5M30.KDXtmLBbQaFb8N1o6AlHLNG-uOYxpHTT7VlwZeMdMes', 1, '2025-06-13 04:04:53', '2025-06-12 04:04:53', '2025-06-12 04:04:53'),
(56, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTc5Mjk5N30.xQp4CnvThaom-YL4ky6qbKPuLpooxZvW4ShuwYHXi5c', 1, '2025-06-13 05:36:37', '2025-06-12 05:36:37', '2025-06-12 05:36:37'),
(57, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTc5MzI2Nn0.sJbZaI2aTh8RASWGMkor8DL2v7WFO6bXxCZOikfveDY', 1, '2025-06-13 05:41:06', '2025-06-12 05:41:06', '2025-06-12 05:41:06'),
(58, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTc5MzU5MX0.6DU9-nLN7zAj8wN9rKV5fv8SRE2-cl-6eUWA1fNK2S0', 1, '2025-06-13 05:46:31', '2025-06-12 05:46:31', '2025-06-12 05:46:31'),
(59, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc0OTgwNTEyN30.qb4uc18RRUlhYiM3wwAITTIOL7t1QdOiDLtCDavKxlM', 1, '2025-06-13 08:58:47', '2025-06-12 08:58:47', '2025-06-12 08:58:47'),
(60, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTgwNTI2OX0.ULiFgkSEMwADATe5b8p0AanPehCEvWk_gZ9_yfXW5e0', 1, '2025-06-13 09:01:09', '2025-06-12 09:01:09', '2025-06-12 09:01:09'),
(61, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTgwODM3OH0.2HLn8QvHre9kyeEzwA1BPfHHVfP4rNR8enaCl3Qoo3c', 1, '2025-06-13 09:52:58', '2025-06-12 09:52:58', '2025-06-12 09:52:58'),
(62, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc0OTgwODUwM30.pBu0c3AnP50S6_LW8KhEcpxmv33w2JdwCqHJrlrbz7o', 1, '2025-06-13 09:55:03', '2025-06-12 09:55:03', '2025-06-12 09:55:03'),
(63, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTgwODU1MX0.7fhUXeXg-FsZMuyEvTt7o_19iqL7lBz9ltu3FF0tXR0', 1, '2025-06-13 09:55:51', '2025-06-12 09:55:51', '2025-06-12 09:55:51'),
(64, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo5LCJ1c2VybmFtZSI6InN0YWZmMSIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc0OTgwODYwNn0.bGbKfHEfd-n3BoA0G6ucPr7C3Y5MWOccizjFn9sZhYQ', 1, '2025-06-13 09:56:46', '2025-06-12 09:56:46', '2025-06-12 09:56:46'),
(65, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzQ5ODczNzUyfQ.NQrlEpopwmKbcBA8xb_FNQjfQ91X7QJPM65aqJiIgK0', 1, '2025-06-14 04:02:32', '2025-06-13 04:02:32', '2025-06-13 04:02:32'),
(66, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc0OTg3Mzg0MH0.Do7zBgIxkSNh7yAv3b9N_vBBKihlyzSBHrsAZbAeqA0', 1, '2025-06-14 04:04:00', '2025-06-13 04:04:00', '2025-06-13 04:04:00'),
(67, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5ODczODg4fQ.nwFMoN4ct6GYKftJ3rJV5WkWwuF8su2G54bI9p8QVlw', 1, '2025-06-14 04:04:48', '2025-06-13 04:04:48', '2025-06-13 04:04:48'),
(68, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzQ5ODc2OTE3fQ.tgOFZrAQ771ydDR3d4lI-oDGVtwPCon949hbssQGvcM', 1, '2025-06-14 04:55:17', '2025-06-13 04:55:17', '2025-06-13 04:55:17'),
(69, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzQ5ODc3MTQwfQ.6kmB9ym0gbTv9pkH-i77-UbfnFcHpvAu3ghp4TgtobA', 1, '2025-06-14 04:59:00', '2025-06-13 04:59:00', '2025-06-13 04:59:00'),
(70, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5ODc3MTUzfQ.LDSqLCORKyrslaZ-PgWdfe56SaSZw-at4VpSQXHbp_s', 1, '2025-06-14 04:59:13', '2025-06-13 04:59:13', '2025-06-13 04:59:13'),
(71, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc0OTg3NzI4N30.Se-dth7KPrdbYlOpFID4xDFGtBbp7tCHiiEOwRVadj0', 1, '2025-06-14 05:01:27', '2025-06-13 05:01:27', '2025-06-13 05:01:27'),
(72, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5ODc5NDQ2fQ.zLn8B8CnIAK8wlG8LZ0kxtw7_8np78uOMJjAZ20mB8E', 1, '2025-06-14 05:37:26', '2025-06-13 05:37:26', '2025-06-13 05:37:26'),
(73, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5ODc5NDk1fQ.O2FxSDEK__265LMa2t6nYAuzcR2COR1sYcNX_skhi5U', 1, '2025-06-14 05:38:15', '2025-06-13 05:38:15', '2025-06-13 05:38:15'),
(74, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzQ5ODc5NjEwfQ.yglxj0R8ZYQz5FZe9GfK0tHZ_lR1U0gTEPmPhqkiqxU', 1, '2025-06-14 05:40:10', '2025-06-13 05:40:10', '2025-06-13 05:40:10'),
(75, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzQ5ODgyNDA4fQ.1qumzAt-uOhGrt6vN_phwJnqOlANVeso0UlqxTmTNdI', 1, '2025-06-14 06:26:48', '2025-06-13 06:26:48', '2025-06-13 06:26:48'),
(76, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc0OTg4MjQyOX0.AZdIYDhSlHUeNWrl2m9-B6mCMcuJA7DD96Yu5xu7a6o', 1, '2025-06-14 06:27:09', '2025-06-13 06:27:09', '2025-06-13 06:27:09'),
(77, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzQ5ODgyNDQyfQ.PO_ubVqT50qvP5Sat58IDvAY_tTlef0BXcSzNTPNY8s', 1, '2025-06-14 06:27:22', '2025-06-13 06:27:22', '2025-06-13 06:27:22'),
(78, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMTMxNDY3fQ.l3zUeseIjDy9N6GSldA-YtfetvsgX37UkoLUz_JhLKE', 1, '2025-06-17 03:37:47', '2025-06-16 03:37:47', '2025-06-16 03:37:47'),
(79, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMTMxNjY4fQ.hO0qBGT8xVXU9ln1z0-aqJRI1W4OG30rq5Rdr3AfTLQ', 1, '2025-06-17 03:41:08', '2025-06-16 03:41:08', '2025-06-16 03:41:08'),
(80, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDEzMzgxN30.pu6c_kEM5jRXG5HzI9dVU6R4KQEtvL8i6erOW8mtD2M', 1, '2025-06-17 04:16:57', '2025-06-16 04:16:57', '2025-06-16 04:16:57'),
(81, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMTMzODk2fQ.6OQvofVWv2lP8snYVNNTlTynNCoQ1SVpBU9yx0XNfa8', 1, '2025-06-17 04:18:16', '2025-06-16 04:18:16', '2025-06-16 04:18:16'),
(82, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMTM4MTE0fQ.6zKEZDX6Nsc7gwQri5V0mIk7czm6c8DUpBloMbOSjoY', 1, '2025-06-17 05:28:34', '2025-06-16 05:28:34', '2025-06-16 05:28:34'),
(83, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMTQwNjU0fQ.dzneoCkRL6dXrgCbbOUtXXmdGmw2pqUYuO8WBP11lv4', 1, '2025-06-17 06:10:54', '2025-06-16 06:10:54', '2025-06-16 06:10:54'),
(84, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMTQwNjY1fQ.i4DsGDZuvVfK3_LSR-H_hfJC6Jr3gsOsOtqU1x1tpXU', 1, '2025-06-17 06:11:05', '2025-06-16 06:11:05', '2025-06-16 06:11:05'),
(85, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMTQxNzc0fQ.iRVvDkL8mP7HXxITSU94e2dcuQsL8MMQbV92KCJ60-A', 1, '2025-06-17 06:29:34', '2025-06-16 06:29:34', '2025-06-16 06:29:34'),
(86, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMTQyMTE3fQ.jLun4tWoFm4zspml0nkTqqzifYNff302kPIY6sXO3gY', 1, '2025-06-17 06:35:17', '2025-06-16 06:35:17', '2025-06-16 06:35:17'),
(87, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMTUwMjc4fQ.YDR4ftceUCeBo3sapwPED-LXu5rnJJj5kNhCBMTXNDQ', 1, '2025-06-17 08:51:18', '2025-06-16 08:51:18', '2025-06-16 08:51:18'),
(88, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMTU1OTg2fQ.RKH9U8HzRZIDg1Rl8QvtZU2BL12rbF-GQ-94VAwGIoE', 1, '2025-06-17 10:26:26', '2025-06-16 10:26:26', '2025-06-16 10:26:26'),
(89, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMjE3NDQ0fQ._XB9sMQKN_suukP6_CWIXVALzCrchCXzE014cT0Ih7w', 1, '2025-06-18 03:30:44', '2025-06-17 03:30:44', '2025-06-17 03:30:44'),
(90, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMjE5MDMxfQ.X5YuOrOYfZyjoAmS7ah1QmtKQT5QeCjHFNaB7Y9m_rc', 1, '2025-06-18 03:57:11', '2025-06-17 03:57:11', '2025-06-17 03:57:11'),
(91, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMjI1NDgyfQ.on8l2Q8ciI_YZg6sB_NUllEk1Z0S2-u7rxkXw8zaxvw', 1, '2025-06-18 05:44:42', '2025-06-17 05:44:42', '2025-06-17 05:44:42'),
(92, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMjI1NzEwfQ.0qg3crVoIlHu_nkqWrGrstBV_NzrJ0opCRhnt-9qgF0', 1, '2025-06-18 05:48:30', '2025-06-17 05:48:30', '2025-06-17 05:48:30'),
(93, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMjI4MzU3fQ.UCIYv_Mh4nbH-DGgaJoHQWjtnHr2UBDJqzB7k39m9iM', 1, '2025-06-18 06:32:37', '2025-06-17 06:32:37', '2025-06-17 06:32:37'),
(94, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDIyODM3N30.KGl71_l8zRNd2pNyDDfFu0wR1QkeM6iWNAqesXRRuoQ', 1, '2025-06-18 06:32:57', '2025-06-17 06:32:57', '2025-06-17 06:32:57'),
(95, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMjM5NDEwfQ.Lx5ocatE76Oi2VnHZu53SnKenGuiJkOWiyvdBBHEL7U', 1, '2025-06-18 09:36:50', '2025-06-17 09:36:50', '2025-06-17 09:36:50'),
(96, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDMwNTE5Nn0.3G29KxvzM3VBPCX7SYzdEADmfk4Ri62McX3nY2K8-qI', 1, '2025-06-19 03:53:16', '2025-06-18 03:53:16', '2025-06-18 03:53:16'),
(97, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDMwNTc1NH0.btWxHKwK51rZ38xSR1D1Lkgknqn27NmMwXD8IcLgvMs', 1, '2025-06-19 04:02:34', '2025-06-18 04:02:34', '2025-06-18 04:02:34'),
(98, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDMwNjk3N30.wuSh9fDyDIK4qBni1cc9vscUUCK3tm8-zSMA0mg3qVQ', 1, '2025-06-19 04:22:57', '2025-06-18 04:22:57', '2025-06-18 04:22:57'),
(99, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMzA2OTk2fQ.VhtiO1CKTzW49Dz1os0kDCPw0IatV7kGESam9S2YNmE', 1, '2025-06-19 04:23:16', '2025-06-18 04:23:16', '2025-06-18 04:23:16'),
(100, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDMwNzU3NH0.6cmfHYf0dET7ePnCPuvZA1WYpVWGxgHa454UQ3Z8GvA', 1, '2025-06-19 04:32:54', '2025-06-18 04:32:54', '2025-06-18 04:32:54'),
(101, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMzA4MDcwfQ.3azbPoZkV8V18ZrXfCS6o0mCcdpJ7NiVKtYQQp--LKk', 1, '2025-06-19 04:41:10', '2025-06-18 04:41:10', '2025-06-18 04:41:10'),
(102, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMzExNTQ1fQ.vHo5r1fQ7nrMR670x7IXrFumZ8Dm29wwzrL4OqfmU0M', 1, '2025-06-19 05:39:05', '2025-06-18 05:39:05', '2025-06-18 05:39:05'),
(103, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwMzExNTUxfQ.uGBXpawxW65SkaBHhSRmEFvsAtAPPT4PKpz2yXH9j40', 1, '2025-06-19 05:39:11', '2025-06-18 05:39:11', '2025-06-18 05:39:11'),
(104, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDMxMTU2Mn0.iKBqjL3Dsy-kmzbkNyS0FLhWUD3aUMJtLIjIFpA8wQo', 1, '2025-06-19 05:39:22', '2025-06-18 05:39:22', '2025-06-18 05:39:22'),
(105, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwMzk4MTI1fQ.kgLi4Orjhj4nr_Wqj86QKZjG4pPVbjyyfOH8uJExJSo', 1, '2025-06-20 05:42:05', '2025-06-19 05:42:05', '2025-06-19 05:42:05'),
(106, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDAwMjA4fQ.Y_Su038di49bbJ8_e1uA61IWKnTt-SJXATBR2ktnXkI', 1, '2025-06-20 06:16:48', '2025-06-19 06:16:48', '2025-06-19 06:16:48'),
(107, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDA5MDYxfQ.HCt679bZPlRZAaGCoBUUc_qKVloSTMYgxkuLv3dXDCs', 1, '2025-06-20 08:44:21', '2025-06-19 08:44:21', '2025-06-19 08:44:21'),
(108, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNDA5MDg3fQ.4Gde-TnFvLyTn0n_SM2_Daun1kuqLkJpTtEFYh4e-GA', 1, '2025-06-20 08:44:47', '2025-06-19 08:44:47', '2025-06-19 08:44:47'),
(109, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDE1NzYzfQ.10XvGxgvfEv0_1MHNBNLHK3qNdqwh8rgngsuCOPPbT4', 1, '2025-06-20 10:36:03', '2025-06-19 10:36:03', '2025-06-19 10:36:03'),
(110, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDE1NzczfQ.zu8O0AAi3eHZtmGWxf56x99dZv_3u8_plbD87EEiu6w', 1, '2025-06-20 10:36:13', '2025-06-19 10:36:13', '2025-06-19 10:36:13'),
(111, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNDE1ODQzfQ.V7dq5n0X5KSsiPmLaFQMKO3SX3Z3K5nmdBj_EsrhWjg', 1, '2025-06-20 10:37:23', '2025-06-19 10:37:23', '2025-06-19 10:37:23'),
(112, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNDc4Njg4fQ.ANm12VqX-i10LFrQWublwLPwDCl0u3gevQgoER3KEMQ', 1, '2025-06-21 04:04:48', '2025-06-20 04:04:48', '2025-06-20 04:04:48'),
(113, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDc4NzgwfQ.AolfLtKSGUA7KuK8KUzzk8LHiICzP5IyOrZldMvWjr8', 1, '2025-06-21 04:06:20', '2025-06-20 04:06:20', '2025-06-20 04:06:20'),
(114, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDc4ODIxfQ.opkSyEfMTcgEDawOWhawB2mhtLsCsKoMRswPFcXFkxo', 1, '2025-06-21 04:07:01', '2025-06-20 04:07:01', '2025-06-20 04:07:01'),
(115, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNDgxMDk0fQ.Kzh86CSoMf1I_lhsgr2Wr2mkXHm2HGOQjpQrs9RbR4c', 1, '2025-06-21 04:44:54', '2025-06-20 04:44:54', '2025-06-20 04:44:54'),
(116, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNDgxMTc4fQ.lv0_NkEopi-LB8sD1JHNaWPl2FbUUQRgeTQUgDiEcbI', 1, '2025-06-21 04:46:18', '2025-06-20 04:46:18', '2025-06-20 04:46:18'),
(117, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNDg3NjQ4fQ.5YbPn5l9aBuuJ_ogSgqp6i2i3BN0jEzO9pVgzwk--XY', 1, '2025-06-21 06:34:08', '2025-06-20 06:34:08', '2025-06-20 06:34:08'),
(118, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzM4MDE3fQ.Z_6qfJjTOZPRXism90URpqY3Z5wp3q3-3xBTxM2RKKo', 1, '2025-06-24 04:06:57', '2025-06-23 04:06:57', '2025-06-23 04:06:57'),
(119, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNzM4MDYwfQ.FD37Dz5AK6YCShOC8UtuTZQWKQObjv7NJYp54HlLhJk', 1, '2025-06-24 04:07:40', '2025-06-23 04:07:40', '2025-06-23 04:07:40'),
(120, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzQ2Mzk1fQ.m54A4JtycqdVcFw6ivE8jJVT9uYD5IpIlLr0CKQr9CU', 1, '2025-06-24 06:26:35', '2025-06-23 06:26:35', '2025-06-23 06:26:35'),
(121, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzU0Mjk2fQ.BqFQBoum5eWZlUZj-0tR-G2HDQrwoJeQH20c5B1aARU', 1, '2025-06-24 08:38:16', '2025-06-23 08:38:16', '2025-06-23 08:38:16'),
(122, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzU0Mzg3fQ.6Gi4o3vz3Ebhx4cNturUr3t1fVmLBx_yShU82X2T0Xw', 1, '2025-06-24 08:39:47', '2025-06-23 08:39:47', '2025-06-23 08:39:47'),
(123, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNzU0NDI3fQ.-Q0oB9GJq0r6c0gwIJEGi_ueoCMFseJGeviv7LWDlls', 1, '2025-06-24 08:40:27', '2025-06-23 08:40:27', '2025-06-23 08:40:27'),
(124, 1, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJwdWJsaWNfaWQiOiJQVUIwMDEiLCJ1c2VybmFtZSI6ImFuemFyIiwicm9sZSI6InB1YmxpYyIsImV4cCI6MTc1MDc1NTMzNH0.X7WBg3Ua2BW8qC96GF-PjaeEvSzdkPVukCyYu21tVRU', 1, '2025-06-24 08:55:34', '2025-06-23 08:55:34', '2025-06-23 08:55:34'),
(125, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzU1NDQwfQ.iCgSxxJPBMYm8ZblxGE39li9KIxqNUGGppdVjcqvwUY', 1, '2025-06-24 08:57:20', '2025-06-23 08:57:20', '2025-06-23 08:57:20'),
(126, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzU2MjEwfQ.O2nkZJr1a6IKfEet122G9MvmWa3gIf-kfMbC72kmEDA', 1, '2025-06-24 09:10:10', '2025-06-23 09:10:10', '2025-06-23 09:10:10'),
(127, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzU4ODk0fQ.HLUk2QH1WrR3AZJPIOM8q3ZyiDg476JuJrCheK49PI8', 1, '2025-06-24 09:54:54', '2025-06-23 09:54:54', '2025-06-23 09:54:54'),
(128, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzU4ODk0fQ.HLUk2QH1WrR3AZJPIOM8q3ZyiDg476JuJrCheK49PI8', 1, '2025-06-24 09:54:54', '2025-06-23 09:54:54', '2025-06-23 09:54:54'),
(129, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzYyMzg4fQ.2aijR4Srqy_W4gmZWBrL0m64mt1BiV647ceHuo2JGwU', 1, '2025-06-24 10:53:08', '2025-06-23 10:53:08', '2025-06-23 10:53:08'),
(130, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzYyMzk4fQ.sxM8m8_ZxHltnahwPTuHdwVg4Uec_x-yD7PKacFlp4s', 1, '2025-06-24 10:53:18', '2025-06-23 10:53:18', '2025-06-23 10:53:18'),
(131, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwNzYyNDEwfQ.3x6VMGlmq9TROHvDHIKFBaLMshit2ZW0U1CkoSVRiTA', 1, '2025-06-24 10:53:30', '2025-06-23 10:53:30', '2025-06-23 10:53:30'),
(132, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwNzYyNDIxfQ.ii85_uyJgkgU_7ZVXVlD1OP5waXB4s4qI2hUpM44E5A', 1, '2025-06-24 10:53:41', '2025-06-23 10:53:41', '2025-06-23 10:53:41'),
(133, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwODIyMjU0fQ.WHGsfpZWKjK6OwcC3aBChw94xF_h_KJzEBe_WhOZpVU', 1, '2025-06-25 03:30:54', '2025-06-24 03:30:54', '2025-06-24 03:30:54'),
(134, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwODIyMjcyfQ.GBTLwrWuVeEiiIZ_nxjAlfSbt78i6TAOfLTdL3ZNeoY', 1, '2025-06-25 03:31:12', '2025-06-24 03:31:12', '2025-06-24 03:31:12'),
(135, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwODIyNjQ0fQ.7dTib08sheBEPJ-NNe4N1OJ-dxsPfH9lE8lzCLtZOjM', 1, '2025-06-25 03:37:24', '2025-06-24 03:37:24', '2025-06-24 03:37:24'),
(136, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwODI1ODk2fQ.k2FJ4TBYXRNcCZhs4S4JC7nCm09TTDIKUqm-eRG6tR4', 1, '2025-06-25 04:31:36', '2025-06-24 04:31:36', '2025-06-24 04:31:36'),
(137, 9, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOSIsInVzZXJuYW1lIjoic3RhZmYxIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzUwODI2Nzg4fQ.DN4Ll48XJCiHYAGm_LQzYdm6fQzqXNDB_hd0SwAUGpw', 1, '2025-06-25 04:46:28', '2025-06-24 04:46:28', '2025-06-24 04:46:28'),
(138, 7, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNyIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUwOTEwMTQwfQ.MeVsLXqXCLkfBzZ0mFzKQv90gKXDe4oQ5JfaOIrFFHA', 1, '2025-06-26 03:55:40', '2025-06-25 03:55:40', '2025-06-25 03:55:40'),
(139, 14, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTQiLCJ1c2VybmFtZSI6ImZhcmhhbmEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NTA5MTY4MTl9.BvtpqOTc4SZmkaXeHjnCnb8kcZMEE4QwzdRb21tQoJ4', 1, '2025-06-26 05:46:59', '2025-06-25 05:46:59', '2025-06-25 05:46:59'),
(140, 14, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTQiLCJ1c2VybmFtZSI6ImZhcmhhbmEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NTA5MjAzNjF9.qCvg-XISuE3uk-LnAnIx9nbSqjU-8R9HNH9l4s-FO24', 1, '2025-06-26 06:46:01', '2025-06-25 06:46:01', '2025-06-25 06:46:01'),
(141, 14, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTQiLCJ1c2VybmFtZSI6ImZhcmhhbmEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NTA5MjgxNzJ9.kEAuSZiObO8UaSSluVBOyfv7Yjv5_GDjY_GI_W0DOtQ', 1, '2025-06-26 08:56:12', '2025-06-25 08:56:12', '2025-06-25 08:56:12'),
(142, 15, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTUiLCJ1c2VybmFtZSI6IlJlY2VwdGlvbiIsInJvbGUiOiJzdGFmZiIsImV4cCI6MTc1MDkyODI0NX0.4B_XWkPCX7P0ylTChWBg7D_8WVJi0h8-3uGq1NG-DM8', 1, '2025-06-26 08:57:25', '2025-06-25 08:57:25', '2025-06-25 08:57:25');

-- --------------------------------------------------------

--
-- Table structure for table `visitor_qr_scans`
--

CREATE TABLE `visitor_qr_scans` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `public_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_by_staff_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scan_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `registry_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scan_result` enum('success','failed','duplicate','invalid') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_active_tokens`
-- (See below for the actual view)
--
CREATE TABLE `vw_active_tokens` (
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `application_timeline`
--
ALTER TABLE `application_timeline`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `idx_timeline_request` (`service_request_id`,`created_at`);

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
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dept_id` (`dept_id`),
  ADD UNIQUE KEY `dept_id_2` (`dept_id`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `div_id` (`div_id`),
  ADD UNIQUE KEY `div_id_2` (`div_id`),
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
-- Indexes for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_code` (`template_code`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`);

--
-- Indexes for table `enhanced_tokens`
--
ALTER TABLE `enhanced_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_token_department` (`token_number`,`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `service_request_id` (`service_request_id`),
  ADD KEY `public_user_id` (`public_user_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `idx_token_status` (`status`),
  ADD KEY `idx_token_created` (`created_at`),
  ADD KEY `idx_token_department_status` (`department_id`,`status`,`created_at`);

--
-- Indexes for table `excel_edits`
--
ALTER TABLE `excel_edits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_excel_edits_document` (`document_id`),
  ADD KEY `idx_excel_edits_user` (`edited_by_user_id`);

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
  ADD KEY `idx_notifications_recipient` (`recipient_id`,`recipient_type`),
  ADD KEY `idx_notification_recipient` (`recipient_id`,`recipient_type`,`is_read`,`created_at`),
  ADD KEY `idx_notification_expires` (`expires_at`);

--
-- Indexes for table `public_id_counter`
--
ALTER TABLE `public_id_counter`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `public_registry`
--
ALTER TABLE `public_registry`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_visitor_id` (`visitor_id`),
  ADD KEY `idx_department_division` (`department_id`,`division_id`),
  ADD KEY `idx_entry_time` (`entry_time`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_visitor_nic` (`visitor_nic`);

--
-- Indexes for table `public_users`
--
ALTER TABLE `public_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `public_id` (`public_id`),
  ADD UNIQUE KEY `nic` (`nic`),
  ADD UNIQUE KEY `idx_username` (`username`),
  ADD UNIQUE KEY `public_user_id` (`public_user_id`),
  ADD UNIQUE KEY `public_user_id_2` (`public_user_id`),
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
-- Indexes for table `request_documents`
--
ALTER TABLE `request_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_doc_request` (`service_request_id`);

--
-- Indexes for table `service_catalog`
--
ALTER TABLE `service_catalog`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `service_code` (`service_code`);

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
-- Indexes for table `service_tokens`
--
ALTER TABLE `service_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_number` (`token_number`),
  ADD KEY `idx_token_number` (`token_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_department_division` (`department_id`,`division_id`),
  ADD KEY `idx_queue_position` (`queue_position`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_priority_level` (`priority_level`),
  ADD KEY `registry_id` (`registry_id`),
  ADD KEY `idx_tokens_dept_div_date_status` (`department_id`,`division_id`,`created_at`,`status`),
  ADD KEY `idx_tokens_priority_created` (`priority_level`,`created_at`);

--
-- Indexes for table `subject_staff`
--
ALTER TABLE `subject_staff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subject_staff_user` (`user_id`),
  ADD KEY `idx_subject_staff_department` (`assigned_department_id`),
  ADD KEY `idx_subject_staff_division` (`assigned_division_id`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `public_user_id` (`public_user_id`);

--
-- Indexes for table `token_audit_log`
--
ALTER TABLE `token_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token_id` (`token_id`),
  ADD KEY `idx_action_type` (`action_type`),
  ADD KEY `idx_action_timestamp` (`action_timestamp`),
  ADD KEY `idx_audit_token_action` (`token_id`,`action_type`,`action_timestamp`);

--
-- Indexes for table `token_queue_management`
--
ALTER TABLE `token_queue_management`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dept_div_date_queue` (`department_id`,`division_id`,`date`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_department_division` (`department_id`,`division_id`);

--
-- Indexes for table `token_sequences`
--
ALTER TABLE `token_sequences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dept_div_date` (`department_id`,`division_id`,`date`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_department_division` (`department_id`,`division_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nic` (`nic`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `user_id_2` (`user_id`),
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
-- Indexes for table `visitor_qr_scans`
--
ALTER TABLE `visitor_qr_scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_public_user` (`public_user_id`),
  ADD KEY `idx_scan_timestamp` (`scan_timestamp`),
  ADD KEY `idx_scan_result` (`scan_result`),
  ADD KEY `registry_id` (`registry_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `application_timeline`
--
ALTER TABLE `application_timeline`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_templates`
--
ALTER TABLE `document_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enhanced_tokens`
--
ALTER TABLE `enhanced_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `excel_edits`
--
ALTER TABLE `excel_edits`
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT for table `request_documents`
--
ALTER TABLE `request_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_catalog`
--
ALTER TABLE `service_catalog`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
-- AUTO_INCREMENT for table `subject_staff`
--
ALTER TABLE `subject_staff`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=143;

-- --------------------------------------------------------

--
-- Structure for view `vw_active_tokens`
--
DROP TABLE IF EXISTS `vw_active_tokens`;

CREATE ALGORITHM=UNDEFINED DEFINER=`dskalmun`@`localhost` SQL SECURITY DEFINER VIEW `vw_active_tokens`  AS SELECT `st`.`id` AS `id`, `st`.`token_number` AS `token_number`, `st`.`queue_position` AS `queue_position`, `st`.`status` AS `status`, `st`.`estimated_time` AS `estimated_time`, `st`.`created_at` AS `created_at`, `pr`.`visitor_name` AS `visitor_name`, `pr`.`visitor_nic` AS `visitor_nic`, `pr`.`purpose_of_visit` AS `purpose_of_visit`, `d`.`name` AS `department_name`, `dv`.`name` AS `division_name`, timestampdiff(MINUTE,`st`.`created_at`,now()) AS `waiting_minutes` FROM (((`service_tokens` `st` join `public_registry` `pr` on((`st`.`registry_id` = `pr`.`id`))) join `departments` `d` on((`st`.`department_id` = `d`.`id`))) join `divisions` `dv` on((`st`.`division_id` = `dv`.`id`))) WHERE ((`st`.`status` in ('waiting','called','serving')) AND (cast(`st`.`created_at` as date) = curdate())) ORDER BY `st`.`department_id` ASC, `st`.`division_id` ASC, `st`.`queue_position` ASC ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `service_tokens`
--
ALTER TABLE `service_tokens`
  ADD CONSTRAINT `service_tokens_ibfk_1` FOREIGN KEY (`registry_id`) REFERENCES `public_registry` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `token_audit_log`
--
ALTER TABLE `token_audit_log`
  ADD CONSTRAINT `token_audit_log_ibfk_1` FOREIGN KEY (`token_id`) REFERENCES `service_tokens` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `visitor_qr_scans`
--
ALTER TABLE `visitor_qr_scans`
  ADD CONSTRAINT `visitor_qr_scans_ibfk_1` FOREIGN KEY (`registry_id`) REFERENCES `public_registry` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
