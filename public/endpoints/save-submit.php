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

$id = preg_match('%^/((?!0\d)\d+)$%i', $_SERVER['PATH_INFO'], $regs) ? $regs[1] : die;

if ($id != '0') {
  if ($stmt = $conn->prepare("SELECT 1 from article where id=?")) {
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if(!$result->fetch_assoc()) {
      http_response_code(410);
      header('Content-Type: text/plain');
      echo "This article no longer exists and cannot be edited.";
      return;
    }
  } else {
    if ($conn->errno != 1146) { die; } // expect table doesn't exists
    http_response_code(410);
    header('Content-Type: text/plain');
    echo "No articles have been created yet.";
    return;
  }
}


if (!preg_match('/\S/i', $_POST['title'])) {
  http_response_code(418);
  header('Content-Type: text/plain');
  echo "Title is required for all articles.";
  return;
}


$sql = ($id != '0' ? "update" : "insert") . " article set title=?, content=?" . ($id != '0' ? " where id=$id" : '');
$stmt = $conn->prepare($sql);
if (!$stmt) {
  $conn->query("create table if not exists article (id int primary key auto_increment, title varchar(100) not null, content text not null, created timestamp(3) not null default current_timestamp(3))");
  $stmt = $conn->prepare($sql);
}
$stmt->bind_param("ss", $_POST['title'], $_POST['content']);
$stmt->execute() or die($stmt->error);

if ($id == '0')
  $id = $stmt->insert_id;

$result = $stmt->get_result();

header('Content-Type: application/json');
echo '{"id":' . $id . ',"title":' . json_encode($_POST['title']) . '}'; // success

?>