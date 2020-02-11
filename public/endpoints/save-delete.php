<?php 

//header('Access-Control-Allow-Origin: http://localhost:3000'); // for development purposes only

header('Cache-Control: no-cache');

$servername = "localhost";
$username = "helloreact";
$password = "EoJe0jJWXsAe";
$dbname = "helloreact";

$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$id = preg_match('%^/((?!0)\d+)$%i', $_SERVER['PATH_INFO'], $regs) ? $regs[1] : die;

if ($stmt = $conn->prepare("SELECT 1 from article where id=?")) {
  $stmt->bind_param("s", $id);
  $stmt->execute();
  $result = $stmt->get_result();
  if($result->fetch_assoc()) { // not already deleted
    $conn->query("delete from article where id=$id");
  }
  header('Content-Type: application/json');
  echo "{}"; // success
} else {
  if ($conn->errno != 1146) { die; } // expect table doesn't exists
  http_response_code(410);
  header('Content-Type: text/plain');
  echo "No articles have been created yet.";
}

?>