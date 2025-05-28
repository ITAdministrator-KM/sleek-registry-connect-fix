
<?php
include_once __DIR__ . '/error_handler.php';

class Database {
    private $host = "162.214.204.205"; // or "node238.r-usdatacenter.register.lk"
    private $db_name = "dskalmun_appDSK";
    private $username = "dskalmun_Admin";
    private $password = "Itadmin@1993";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8",
                    PDO::ATTR_EMULATE_PREPARES => false,
                )
            );
            return $this->conn;
        } catch(PDOException $exception) {
            throw new Exception("Database connection error: " . $exception->getMessage());
        }
    }
}
?>
