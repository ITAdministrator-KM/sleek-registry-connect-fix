
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // Validate request headers
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "";
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && !str_contains($contentType, 'application/json')) {
        throw new Exception("Invalid Content-Type. Expected application/json");
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getAppointments($db);
            break;
        case 'POST':
            createAppointment($db);
            break;
        case 'PUT':
            updateAppointment($db);
            break;
        case 'DELETE':
            deleteAppointment($db);
            break;
        default:
            throw new Exception("Method not allowed", 405);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error",
        "details" => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

function getAppointments($db) {
    try {
        $date = $_GET['date'] ?? null;
        $status = $_GET['status'] ?? null;
        
        // Validate status if provided
        $validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
        if ($status && !in_array($status, $validStatuses)) {
            throw new Exception("Invalid status value. Allowed values: " . implode(', ', $validStatuses), 400);
        }

        // Validate date format if provided
        if ($date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new Exception("Invalid date format. Use YYYY-MM-DD", 400);
        }
        
        $query = "SELECT a.*, pu.name as public_user_name, pu.public_id, 
                         d.name as department_name, dv.name as division_name
                  FROM appointments a 
                  LEFT JOIN public_users pu ON a.public_user_id = pu.id 
                  LEFT JOIN departments d ON a.department_id = d.id 
                  LEFT JOIN divisions dv ON a.division_id = dv.id 
                  WHERE 1=1";
        
        $params = array();
        
        if ($date) {
            $query .= " AND a.appointment_date = :date";
            $params[':date'] = $date;
        }
        
        if ($status) {
            $query .= " AND a.status = :status";
            $params[':status'] = $status;
        }
        
        $query .= " ORDER BY a.appointment_date, a.appointment_time";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($appointments === false) {
            throw new Exception("Failed to fetch appointments");
        }
        
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => $appointments,
            "meta" => [
                "total" => count($appointments),
                "filters" => [
                    "date" => $date,
                    "status" => $status
                ]
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database error",
            "details" => $e->getMessage()
        ]);
    } catch (Exception $e) {
        $code = $e->getCode() ?: 500;
        http_response_code($code);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}

function createAppointment($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON payload", 400);
        }
        
        // Validate required fields
        $requiredFields = ['public_user_id', 'department_id', 'division_id', 'appointment_date', 'appointment_time', 'purpose'];
        $missingFields = array_filter($requiredFields, fn($field) => !isset($data->$field));
        
        if (!empty($missingFields)) {
            throw new Exception("Missing required fields: " . implode(', ', $missingFields), 400);
        }

        // Validate date and time formats
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data->appointment_date)) {
            throw new Exception("Invalid appointment_date format. Use YYYY-MM-DD", 400);
        }

        if (!preg_match('/^([01][0-9]|2[0-3]):[0-5][0-9]$/', $data->appointment_time)) {
            throw new Exception("Invalid appointment_time format. Use HH:MM in 24-hour format", 400);
        }

        // Validate IDs exist in respective tables
        $validations = [
            ["SELECT id FROM public_users WHERE id = ? AND status = 'active'", [$data->public_user_id], "Invalid public_user_id"],
            ["SELECT id FROM departments WHERE id = ? AND status = 'active'", [$data->department_id], "Invalid department_id"],
            ["SELECT id FROM divisions WHERE id = ? AND status = 'active'", [$data->division_id], "Invalid division_id"]
        ];

        foreach ($validations as [$sql, $params, $error]) {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            if ($stmt->rowCount() === 0) {
                throw new Exception($error, 400);
            }
        }

        // Check for existing appointments at the same time
        $stmt = $db->prepare("SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'");
        $stmt->execute([$data->appointment_date, $data->appointment_time]);
        if ($stmt->rowCount() > 0) {
            throw new Exception("Time slot is already booked", 409);
        }
        
        $query = "INSERT INTO appointments (public_user_id, department_id, division_id, appointment_date, appointment_time, purpose, description, status) 
                  VALUES (:public_user_id, :department_id, :division_id, :appointment_date, :appointment_time, :purpose, :description, 'scheduled')";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }

        $stmt->bindParam(":public_user_id", $data->public_user_id);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        $stmt->bindParam(":appointment_date", $data->appointment_date);
        $stmt->bindParam(":appointment_time", $data->appointment_time);
        $stmt->bindParam(":purpose", $data->purpose);
        $stmt->bindParam(":description", $data->description ?? null);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create appointment");
        }

        $appointmentId = $db->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Appointment created successfully",
            "data" => [
                "id" => $appointmentId,
                "appointment_date" => $data->appointment_date,
                "appointment_time" => $data->appointment_time
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database error",
            "details" => $e->getMessage()
        ]);
    } catch (Exception $e) {
        $code = $e->getCode() ?: 500;
        http_response_code($code);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}

function updateAppointment($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(array("message" => "Appointment ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE appointments SET status = :status, notes = :notes, staff_user_id = :staff_user_id WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":notes", $data->notes ?? null);
        $stmt->bindParam(":staff_user_id", $data->staff_user_id ?? null);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Appointment updated successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to update appointment"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function deleteAppointment($db) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "Appointment ID is required"));
        return;
    }
    
    try {
        $query = "UPDATE appointments SET status = 'cancelled' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Appointment cancelled successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to cancel appointment"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}
?>
