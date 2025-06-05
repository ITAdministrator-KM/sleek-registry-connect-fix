<?php
require_once 'backend/config/database.php';

// Function to check database connection and list users
function checkDatabaseConnection() {
    $database = new Database();
    
    try {
        $conn = $database->getConnection();
        echo "✅ Successfully connected to the database.\n";
        
        // Check if users table exists
        $stmt = $conn->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Found 'users' table.\n";
            
            // Get list of columns in users table
            $columns = $conn->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
            echo "\n📋 Users table columns: " . implode(', ', $columns) . "\n";
            
            // Count users
            $count = $conn->query("SELECT COUNT(*) FROM users")->fetchColumn();
            echo "\n👥 Total users: " . $count . "\n";
            
            // List first 10 users
            if ($count > 0) {
                echo "\n🔍 First 10 users:\n";
                $users = $conn->query("SELECT id, username, role, status, created_at FROM users LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
                
                // Print table header
                echo str_pad("ID", 8) . str_pad("Username", 20) . str_pad("Role", 10) . str_pad("Status", 10) . "Created At\n";
                echo str_repeat("-", 60) . "\n";
                
                // Print each user
                foreach ($users as $user) {
                    echo str_pad($user['id'], 8) . 
                         str_pad($user['username'], 20) . 
                         str_pad($user['role'], 10) . 
                         str_pad($user['status'], 10) . 
                         $user['created_at'] . "\n";
                }
            } else {
                echo "\n❌ No users found in the database.\n";
            }
            
        } else {
            echo "❌ 'users' table not found in the database.\n";
            
            // List all tables for debugging
            echo "\n📋 All tables in database:\n";
            $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            foreach ($tables as $table) {
                echo "- $table\n";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
}

// Run the check
echo "🔍 Checking database connection and users...\n";
checkDatabaseConnection();
