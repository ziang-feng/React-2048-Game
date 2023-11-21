<?php
error_reporting(0);
header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
header('Access-Control-Allow-Credentials: true');
header("Access-Control-Allow-Methods: GET, POST");

date_default_timezone_set('America/Toronto');

const HOST = "localhost";
const USER = "inf452api";
const PASSWORD = "game@452A1";
const DB = "INF452A1";

try {
    switch ($_GET['request']) {
        case 'signup':
            echo signup();
            break;
        case 'signin':
            echo signin();
            break;
        case 'save':
            echo save();
            break;
        case 'load':
            echo load();
            break;
        case 'highscore':
            echo highscore();
            break;
        case 'logout':
            echo logout();
            break;
        case 'over':
            echo over();
            break;
        default:
            echo json_encode([""]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([""]);
}

function signup()
{
    $payload = json_decode(file_get_contents('php://input'));
    if (!$payload->username || !$payload->password) return json_encode(['']);

    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $username = mysqli_real_escape_string($link, $payload->username);

    $result = preg_replace('/[^0-9a-zA-Z]/', '', $username);
    if ($result != $username) return json_encode(['']);

    $sql = "SELECT id from users WHERE username = '$username';";
    $result = mysqli_query($link, $sql);
    if (mysqli_num_rows($result) != 0) return json_encode(["."]);

    $password = password_hash($payload->password, PASSWORD_BCRYPT);
    $token = getToken(32);
    $sql = "INSERT INTO users (username,password,identityKey) VALUE ('$username','$password','$token');";

    $result = mysqli_query($link, $sql);
    $id = mysqli_insert_id($link);

    foreach ([4, 5, 6] as $size) {
        $sql = "INSERT INTO saves (board,score,size,user) VALUE ('',score,$size,$id);";
        mysqli_query($link, $sql);
    }

    return json_encode([$username]);
}
function signin()
{
    $payload = json_decode(file_get_contents('php://input'));
    if (!$payload->username || !$payload->password) return json_encode(['']);

    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $username = mysqli_real_escape_string($link, $payload->username);
    $sessoinKey = getToken(32);

    $result = preg_replace('/[^0-9a-zA-Z]/', '', $username);
    if ($result != $username) return json_encode(['']);

    $sql = "SELECT password from users WHERE username = '$username';";
    $result = mysqli_query($link, $sql);
    if (mysqli_num_rows($result) == 0) return json_encode(['']);
    $row = mysqli_fetch_assoc($result);

    if (!password_verify($payload->password, $row['password'])) return json_encode(['']);
    $sql = "SELECT identityKey from users WHERE username = '$username';";
    $result = mysqli_query($link, $sql);
    $row = mysqli_fetch_assoc($result);
    $identityKey = $row['identityKey'];

    $sql = "UPDATE users SET sessionKey = '$sessoinKey' WHERE username = '$username';";
    $result = mysqli_query($link, $sql);

    setcookie("sessionKey", $sessoinKey, 0, "/", $_SERVER['HTTP_HOST'], false, true);
    setcookie("identityKey", $identityKey, 0, "/", $_SERVER['HTTP_HOST'], false, true);

    return json_encode([$username]);
}
function logout()
{
    setcookie("sessionKey", "", 0, "/", $_SERVER['HTTP_HOST'], false, true);
    setcookie("identityKey", "", 0, "/", $_SERVER['HTTP_HOST'], false, true);

    return json_encode([1]);
}
function save()
{
    $id = verifyKeys();
    if (!$id) return json_encode(['']);

    $payload = json_decode(file_get_contents('php://input'));
    if (!$payload->boardJSON || !$payload->size || !isset($payload->score)) return json_encode(['']);

    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $board = mysqli_real_escape_string($link, $payload->boardJSON);
    $size = intval($payload->size);
    $score = intval($payload->score);

    $dt = new DateTime();
    $dtStr = $dt->format('Y-m-d H:i:s');

    $sql = "UPDATE saves SET board='$board', savetime='$dtStr', score=$score WHERE user=$id and size=$size;";
    mysqli_query($link, $sql);

    return json_encode([1]);
}
function over()
{
    $id = verifyKeys();
    if (!$id) return json_encode(['']);

    $payload = json_decode(file_get_contents('php://input'));
    if (!isset($payload->score) || !isset($payload->size)) return json_encode(['']);

    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $score = intval($payload->score);
    $size = intval($payload->size);

    $sql = "INSERT INTO scores (score,size,user) VALUE ($score,$size,$id);";
    mysqli_query($link, $sql);

    return json_encode([1]);
}
function load()
{
    $id = verifyKeys();
    if (!$id) return json_encode(['']);

    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $sql = "SELECT board,size,score,savetime FROM saves WHERE user = $id;";
    $result = mysqli_query($link, $sql);

    $saves = [];
    while ($row = mysqli_fetch_row($result)) $saves[] = $row;

    return json_encode(['load',$saves]);
}

function highscore()
{
    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $result = [];
    foreach ([4, 5, 6] as $size) {
        $sql = "SELECT score,size,username FROM scores AS S JOIN users As U ON S.user = U.id WHERE size=$size ORDER BY score DESC LIMIT 10;";
        $resultsql = mysqli_query($link, $sql);
        $scores = [];
        while ($row = mysqli_fetch_row($resultsql)) $scores[] = $row;
        $result[] = $scores;
    }

    return json_encode(['score',$result]);
}

function verifyKeys()
{

    $link = mysqli_connect(HOST, USER, PASSWORD, DB);
    $sessionKey = mysqli_real_escape_string($link, $_COOKIE['sessionKey']);
    $identityKey = mysqli_real_escape_string($link, $_COOKIE['identityKey']);

    $sql = "SELECT id FROM users WHERE sessionKey = '$sessionKey' AND identityKEy = '$identityKey';";
    $result = mysqli_query($link, $sql);
    if (mysqli_num_rows($result) == 0) return False;

    $row = mysqli_fetch_assoc($result);
    $id = $row['id'];

    return $id;
}

function getToken($length)
{
    $token = "";
    $codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $codeAlphabet .= "abcdefghijklmnopqrstuvwxyz";
    $codeAlphabet .= "0123456789";
    $max = strlen($codeAlphabet);

    for ($i = 0; $i < $length; $i++) {
        $token .= $codeAlphabet[random_int(0, $max - 1)];
    }

    return $token;
}
