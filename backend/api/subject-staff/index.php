<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/response_handler.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getSubjectStaff($db);
            break;
        case 'POST':
            createSubjectStaff($db);
            break;
        case 'PUT':
            updateSubjectStaff($db);
            break;
        case 'DELETE':
            deleteSubjectStaff($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Subject Staff API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function getSubjectStaff($db) {
    try {
        $userId = $_GET['user_id'] ?? null;
        
        if ($userId) {
            $query = "SELECT ss.*, u.name as user_name, d.name as department_name, dv.name as division_name
                     FROM subject_staff ss
                     JOIN users u ON ss.user_id = u.id
                     JOIN departments d ON ss.assigned_department_id = d.id
                     JOIN divisions dv ON ss.assigned_division_id = dv.id
                     WHERE ss.user_id = ? AND ss.status = 'active'";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $subjectStaff = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$subjectStaff) {
                sendError(404, "Subject staff not found");
                return;
            }
            
            sendResponse($subjectStaff, "Subject staff data retrieved successfully");
        } else {
            $query = "SELECT ss.*, u.name as user_name, d.name as department_name, dv.name as division_name
                     FROM subject_staff ss
                     JOIN users u ON ss.user_id = u.id
                     JOIN departments d ON ss.assigned_department_id = d.id
                     JOIN divisions dv ON ss.assigned_division_id = dv.id
                     WHERE ss.status = 'active'
                     ORDER BY u.name ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $subjectStaffList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse($subjectStaffList, "Subject staff list retrieved successfully");
        }
    } catch (Exception $e) {
        error_log("Get subject staff error: " . $e->getMessage());
        sendError(500, "Failed to fetch subject staff: " . $e->getMessage());
    }
}

function createSubjectStaff($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        $requiredFields = ['user_id', 'post', 'assigned_department_id', 'assigned_division_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        // Get user name for staff_name
        $userQuery = "SELECT name FROM users WHERE id = ?";
        $userStmt = $db->prepare($userQuery);
        $userStmt->execute([$data['user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            sendError(400, "User not found");
            return;
        }
        
        $query = "INSERT INTO subject_staff (user_id, staff_name, post, assigned_department_id, assigned_division_id, status, created_at) 
                  VALUES (?, ?, ?, ?, ?, 'active', NOW())";
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute([
            $data['user_id'],
            $user['name'],
            $data['post'],
            $data['assigned_department_id'],
            $data['assigned_division_id']
        ]);
        
        if (!$result) {
            throw new Exception("Failed to create subject staff");
        }
        
        $subjectStaffId = $db->lastInsertId();
        
        sendResponse([
            "id" => intval($subjectStaffId),
            "staff_name" => $user['name']
        ], "Subject staff created successfully");
        
    } catch (Exception $e) {
        error_log("Create subject staff error: " . $e->getMessage());
        sendError(500, "Failed to create subject staff: " . $e->getMessage());
    }
}

function updateSubjectStaff($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['id'])) {
            sendError(400, "Subject staff ID is required");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['post', 'assigned_department_id', 'assigned_division_id', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        // Update staff_name if user_id is being changed
        if (isset($data['user_id'])) {
            $userQuery = "SELECT name FROM users WHERE id = ?";
            $userStmt = $db->prepare($userQuery);
            $userStmt->execute([$data['user_id']]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $updateFields[] = "user_id = ?";
                $updateFields[] = "staff_name = ?";
                $params[] = $data['user_id'];
                $params[] = $user['name'];
            }
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE subject_staff SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = ?";
        $params[] = $data['id'];
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute($params);
        
        if (!$result) {
            throw new Exception("Failed to update subject staff");
        }
        
        sendResponse(["id" => intval($data['id'])], "Subject staff updated successfully");
        
    } catch (Exception $e) {
        error_log("Update subject staff error: " . $e->getMessage());
        sendError(500, "Failed to update subject staff: " . $e->getMessage());
    }
}

function deleteSubjectStaff($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError(400, "Subject staff ID is required");
            return;
        }
        
        $query = "UPDATE subject_staff SET status = 'inactive', updated_at = NOW() WHERE id = ?";
        $stmt = $db->prepare($query);
        $result = $stmt->execute([intval($id)]);
        
        if (!$result) {
            throw new Exception("Failed to delete subject staff");
        }
        
        sendResponse(["id" => intval($id)], "Subject staff deleted successfully");
        
    } catch (Exception $e) {
        error_log("Delete subject staff error: " . $e->getMessage());
        sendError(500, "Failed to delete subject staff: " . $e->getMessage());
    }
}
?>
