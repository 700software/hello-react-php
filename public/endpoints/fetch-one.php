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

$stmt = $conn->prepare("SELECT id, title, content from article where id=?");
if ($stmt) {
  $id = substr($_SERVER['PATH_INFO'], 1);
  $stmt->bind_param("s", $id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  // output data of each row
  $inc = 0;
  if($row = $result->fetch_assoc()) {
    header('Content-Type: application/json');
    echo "{";
    echo  '"id":' . $row['id'];
    echo  ',"title":' . json_encode($row["title"]);
    echo  ',"content":' . json_encode($row["content"]);
    echo "}";
  } else {
    http_response_code(410);
    header('Content-Type: text/plain');
    echo "This article does not exist.";
  }
} else {
  if ($conn->errno != 1146) { die; } // expect table doesn't exists
  http_response_code(410);
  header('Content-Type: text/plain');
  echo "No articles have been created yet.";
}

$conn->close();


?>