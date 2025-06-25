
-- Stored Procedures for Token Management System
-- Comprehensive token lifecycle management with error handling

DELIMITER //

-- Generate new token procedure
DROP PROCEDURE IF EXISTS sp_generate_token//
CREATE PROCEDURE sp_generate_token(
    IN p_registry_id VARCHAR(36),
    IN p_department_id VARCHAR(36),
    IN p_division_id VARCHAR(36),
    IN p_service_type VARCHAR(100),
    IN p_priority_level ENUM('normal', 'urgent', 'vip'),
    IN p_created_by VARCHAR(36),
    OUT p_token_id VARCHAR(36),
    OUT p_token_number VARCHAR(20),
    OUT p_queue_position INT,
    OUT p_estimated_wait_time INT
)
BEGIN
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
END//

-- Call next token procedure
DROP PROCEDURE IF EXISTS sp_call_next_token//
CREATE PROCEDURE sp_call_next_token(
    IN p_department_id VARCHAR(36),
    IN p_division_id VARCHAR(36),
    IN p_staff_id VARCHAR(36),
    OUT p_token_id VARCHAR(36),
    OUT p_token_number VARCHAR(20)
)
BEGIN
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
END//

-- Complete token service procedure
DROP PROCEDURE IF EXISTS sp_complete_token//
CREATE PROCEDURE sp_complete_token(
    IN p_token_id VARCHAR(36),
    IN p_staff_id VARCHAR(36),
    IN p_notes TEXT
)
BEGIN
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
END//

-- Cancel token procedure
DROP PROCEDURE IF EXISTS sp_cancel_token//
CREATE PROCEDURE sp_cancel_token(
    IN p_token_id VARCHAR(36),
    IN p_staff_id VARCHAR(36),
    IN p_reason TEXT
)
BEGIN
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
END//

-- Get queue status procedure
DROP PROCEDURE IF EXISTS sp_get_queue_status//
CREATE PROCEDURE sp_get_queue_status(
    IN p_department_id VARCHAR(36),
    IN p_division_id VARCHAR(36)
)
BEGIN
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
END//

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_tokens_dept_div_date_status ON service_tokens(department_id, division_id, created_at, status);
CREATE INDEX idx_tokens_priority_created ON service_tokens(priority_level, created_at);
CREATE INDEX idx_audit_token_action ON token_audit_log(token_id, action_type, action_timestamp);
