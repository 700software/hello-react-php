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

$stmt = $conn->prepare("SELECT id, title from article");
header('Content-Type: application/json');
if ($stmt) {
  $stmt->execute();
  $result = $stmt->get_result();
  
  // output data of each row
  $inc = 0;
  echo "{";
  while($row = $result->fetch_assoc()) {
    if ($inc++) { echo ","; }
    echo '"' . $row['id'] . '":';
    echo "{";
    echo  '"id":' . $row['id'];
    echo  ',"title":' . json_encode($row["title"]);
    echo "}";
  }
  echo "}";
} else {
  if ($conn->errno != 1146) { die; } // expect table doesn't exists
  echo "{}";
}

$conn->close();


?>