
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

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
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getAppointments($db) {
    try {
        $date = $_GET['date'] ?? null;
        $status = $_GET['status'] ?? null;
        
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
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($appointments);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
}

function createAppointment($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->public_user_id) || !isset($data->department_id) || !isset($data->division_id) || 
        !isset($data->appointment_date) || !isset($data->appointment_time) || !isset($data->purpose)) {
        http_response_code(400);
        echo json_encode(array("message" => "All required fields must be provided"));
        return;
    }
    
    try {
        $query = "INSERT INTO appointments (public_user_id, department_id, division_id, appointment_date, appointment_time, purpose, description) 
                  VALUES (:public_user_id, :department_id, :division_id, :appointment_date, :appointment_time, :purpose, :description)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":public_user_id", $data->public_user_id);
        $stmt->bindParam(":department_id", $data->department_id);
        $stmt->bindParam(":division_id", $data->division_id);
        $stmt->bindParam(":appointment_date", $data->appointment_date);
        $stmt->bindParam(":appointment_time", $data->appointment_time);
        $stmt->bindParam(":purpose", $data->purpose);
        $stmt->bindParam(":description", $data->description ?? null);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Appointment created successfully"));
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Failed to create appointment"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
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
