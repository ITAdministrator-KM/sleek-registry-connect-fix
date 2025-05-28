
<?php
class Database {
    private $host = "162.214.204.205";
    private $db_name = "dskalmun_appDSK";
    private $username = "dskalmun_Admin";
    private $password = "Itadmin@1993";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            // Set DSN with charset
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                )
            );
            
            error_log("Database connection successful");
            return $this->conn;
            
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
            throw new Exception("Database connection error: " . $exception->getMessage());
        }
    }
}
?>
