<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];
    
    // Handle export requests
    if (strpos($request_uri, '/export') !== false) {
        handleExportRequest($db);
        exit;
    }

    switch ($method) {
        case 'GET':
            getRegistryEntries($db);
            break;
        case 'POST':
            createRegistryEntry($db);
            break;
        case 'PUT':
            updateRegistryEntry($db);
            break;
        case 'DELETE':
            deleteRegistryEntry($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Registry API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function generateRegistryId($db) {
    $stmt = $db->prepare("SELECT registry_id FROM public_registry WHERE registry_id LIKE 'REG%' ORDER BY CAST(SUBSTRING(registry_id, 4) AS UNSIGNED) DESC LIMIT 1");
    $stmt->execute();
    $lastId = $stmt->fetchColumn();
    
    if ($lastId) {
        $lastNumber = intval(substr($lastId, 3));
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return 'REG' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
}

function handleExportRequest($db) {
    try {
        $format = $_GET['export'] ?? 'csv';
        $date = $_GET['date'] ?? null;
        $department_id = $_GET['department_id'] ?? null;
        
        $query = "SELECT pr.*, pu.name as public_user_name, pu.public_user_id,
                        d.name as department_name, `div`.name as division_name
                 FROM public_registry pr 
                 LEFT JOIN public_users pu ON pr.public_user_id = pu.id
                 LEFT JOIN departments d ON pr.department_id = d.id 
                 LEFT JOIN divisions `div` ON pr.division_id = `div`.id 
                 WHERE pr.status = 'active'";
        
        $params = [];
        
        if ($date) {
            $query .= " AND DATE(pr.entry_time) = ?";
            $params[] = $date;
        }
        
        if ($department_id) {
            $query .= " AND pr.department_id = ?";
            $params[] = $department_id;
        }
        
        $query .= " ORDER BY pr.entry_time DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($format === 'csv') {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="registry_export.csv"');
            
            $output = fopen('php://output', 'w');
            
            // CSV headers
            fputcsv($output, [
                'Registry ID', 'Entry Time', 'Visitor Name', 'NIC', 'Address', 
                'Phone', 'Department', 'Division', 'Purpose', 'Remarks', 
                'Visitor Type', 'Status'
            ]);
            
            // CSV data
            foreach ($entries as $entry) {
                fputcsv($output, [
                    $entry['registry_id'],
                    $entry['entry_time'],
                    $entry['visitor_name'],
                    $entry['visitor_nic'],
                    $entry['visitor_address'],
                    $entry['visitor_phone'],
                    $entry['department_name'],
                    $entry['division_name'],
                    $entry['purpose_of_visit'],
                    $entry['remarks'],
                    $entry['visitor_type'],
                    $entry['status']
                ]);
            }
            
            fclose($output);
        } else if ($format === 'pdf') {
            // For PDF, return JSON that frontend can process
            header('Content-Type: application/json');
            sendResponse($entries, "Registry data for PDF export");
        }
        
    } catch (Exception $e) {
        error_log("Export error: " . $e->getMessage());
        sendError(500, "Failed to export data: " . $e->getMessage());
    }
}

function getRegistryEntries($db) {
    try {
        $date = $_GET['date'] ?? null;
        $id = $_GET['id'] ?? null;
        $department_id = $_GET['department_id'] ?? null;
        $division_id = $_GET['division_id'] ?? null;
        $visitor_type = $_GET['visitor_type'] ?? null;
        $status = $_GET['status'] ?? 'active';
        
        if ($id) {
            $query = "SELECT pr.*, pu.name as public_user_name, pu.public_user_id,
                            d.name as department_name, `div`.name as division_name
                     FROM public_registry pr 
                     LEFT JOIN public_users pu ON pr.public_user_id = pu.id
                     LEFT JOIN departments d ON pr.department_id = d.id 
                     LEFT JOIN divisions `div` ON pr.division_id = `div`.id 
                     WHERE pr.id = ? AND pr.status = ?";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$id, $status]);
            $entry = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$entry) {
                sendError(404, "Registry entry not found");
                return;
            }
            
            sendResponse($entry, "Registry entry retrieved successfully");
        } else {
            $query = "SELECT pr.*, pu.name as public_user_name, pu.public_user_id,
                            d.name as department_name, `div`.name as division_name
                     FROM public_registry pr 
                     LEFT JOIN public_users pu ON pr.public_user_id = pu.id
                     LEFT JOIN departments d ON pr.department_id = d.id 
                     LEFT JOIN divisions `div` ON pr.division_id = `div`.id 
                     WHERE pr.status = ?";
            
            $params = [$status];
            
            if ($date) {
                $query .= " AND DATE(pr.entry_time) = ?";
                $params[] = $date;
            }
            
            if ($department_id) {
                $query .= " AND pr.department_id = ?";
                $params[] = $department_id;
            }
            
            if ($division_id) {
                $query .= " AND pr.division_id = ?";
                $params[] = $division_id;
            }
            
            if ($visitor_type) {
                $query .= " AND pr.visitor_type = ?";
                $params[] = $visitor_type;
            }
            
            $query .= " ORDER BY pr.entry_time DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse($entries, "Registry entries retrieved successfully");
        }
    } catch (Exception $e) {
        error_log("Get registry entries error: " . $e->getMessage());
        sendError(500, "Failed to fetch registry entries: " . $e->getMessage());
    }
}

function createRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input);
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        $requiredFields = ['visitor_name', 'visitor_nic', 'department_id', 'purpose_of_visit'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty(trim($data->$field))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        $db->beginTransaction();
        
        // Generate registry ID
        $registry_id = generateRegistryId($db);
        
        $query = "INSERT INTO public_registry (registry_id, public_user_id, visitor_name, visitor_nic, visitor_address, visitor_phone, department_id, division_id, purpose_of_visit, remarks, entry_time, visitor_type, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'active')";
        
        $stmt = $db->prepare($query);
        $params = [
            $registry_id,
            isset($data->public_user_id) ? $data->public_user_id : null,
            $data->visitor_name,
            $data->visitor_nic,
            isset($data->visitor_address) ? $data->visitor_address : null,
            isset($data->visitor_phone) ? $data->visitor_phone : null,
            $data->department_id,
            isset($data->division_id) ? $data->division_id : null,
            $data->purpose_of_visit,
            isset($data->remarks) ? $data->remarks : null,
            isset($data->visitor_type) ? $data->visitor_type : 'new'
        ];
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to create registry entry");
        }
        
        $entryId = $db->lastInsertId();
        
        $db->commit();
        
        sendResponse([
            "registry_id" => $registry_id,
            "id" => $entryId
        ], "Registry entry created successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create registry entry error: " . $e->getMessage());
        sendError(500, "Failed to create registry entry: " . $e->getMessage());
    }
}

function updateRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "Registry entry ID is required");
            return;
        }
        
        $db->beginTransaction();
        
        $stmt = $db->prepare("SELECT id FROM public_registry WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Registry entry not found");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['visitor_name', 'visitor_nic', 'visitor_address', 'visitor_phone', 'department_id', 'division_id', 'purpose_of_visit', 'remarks', 'visitor_type', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data->$field)) {
                $updateFields[] = "$field = ?";
                $params[] = $data->$field;
            }
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE public_registry SET " . implode(", ", $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $params[] = $data->id;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $db->commit();
        sendResponse(["id" => $data->id], "Registry entry updated successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update registry entry error: " . $e->getMessage());
        sendError(500, "Failed to update registry entry: " . $e->getMessage());
    }
}

function deleteRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "Registry entry ID is required");
            return;
        }
        
        $db->beginTransaction();
        
        $stmt = $db->prepare("SELECT id FROM public_registry WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Registry entry not found or already deleted");
            return;
        }
        
        $query = "UPDATE public_registry SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data->id]);
        
        $db->commit();
        sendResponse(["id" => $data->id], "Registry entry deleted successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete registry entry error: " . $e->getMessage());
        sendError(500, "Failed to delete registry entry: " . $e->getMessage());
    }
}
?>
