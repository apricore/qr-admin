<?php 
header("Access-Control-Allow-Origin: *");
if ($_SERVER['REQUEST_METHOD'] === "GET") { exit; }
$origin = dirname(__DIR__);
$basedir = basename(__DIR__);
$action = $_GET["action"];

function getFiles($dirpath) {
  if ($dirpath === "\\/") $dirpath = "/";
  if ($dirpath === "//") $dirpath = "/";
  global $origin, $basedir;
  $location = $origin . $dirpath;
  $folders = [];
  $files = [];
  $handle = opendir($location);
  while ($file_name = readdir($handle)) {
    if ($file_name[0] === ".") continue;
    $fpath = $location . $file_name;
    if (is_file($fpath)) {
      Array_push($files, array("inode"=>"f" . fileinode($fpath), "name"=>basename($fpath), "location"=>str_replace($origin, "", $fpath)));
    } else if (is_dir($fpath) && basename($fpath) !== $basedir) {
      Array_push($folders, array("inode"=>"d" . fileinode($fpath), "name"=>basename($fpath), "location"=>str_replace($origin, "", $fpath) . "/"));
    }
  }
  return array("name"=>basename($location), "dirpath"=>$dirpath, "body"=>Array_merge($folders, $files));
}
function echoError($error) {
  echo json_encode(array("error"=>$error));
}
function echoJson($message) {
  echo json_encode($message);
}
function getMimeType($r, $t='file') {
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  return ($t =='str') ? $finfo->buffer($r) : $finfo->file($r);
}
function getFileType($r, $t='file') {
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  return strstr(($t =='str') ? $finfo->buffer($r) : $finfo->file($r), "/", true);
}
function isBinary($location) {
  $mimeType = getMimeType($location);
  $type = getFileType($location);
  if ($type === "text" || $mimeType === "image/svg+xml" || $mimeType === "application/octet-stream" ||
  $mimeType === "application/json" || $mimeType === "application/x-empty" || $mimeType === "node/x-empty") {
    return false;
  } else {
    return true;
  }
}
 
if ($action === "getFiles") {
  if (isset($_POST["location"]) && file_exists($origin ."/" . $_POST["location"])) {
    echoJson(getFiles($_POST["location"]));
  } else {
    echoError("Can't get files in {$_POST["location"]}: \nthe directory doesn't exist!");
  }
} else if ($action === "getContents") {
  if (isset($_POST["location"])) {
    $location = $origin . $_POST["location"];
    if (file_exists($location) && is_file($location)) {
      if (!isBinary($location)) {
        echoJson(array("contents"=>file_get_contents($location)));
      } else {
        echo("");
      }
    } else { 
      echoError("The file does not exists.");
    }
  } else {
    echoError("The file does not exists.");
  }
} else if ($action === "getInode") {
  if (isset($_POST["location"])) {
    $location = $origin . $_POST["location"];
    if (file_exists($location)) {
      echoJson((is_file($location) ? "f" : "d") . fileinode($location));
    } else { 
      echoJson("-1");
    }
  } else {
    echoJson("-1");
  }
} else if ($action === "searchFiles") {
  if (isset($_POST["inode"])) {
    function searchFiles($location, $fnum) {
      global $basedir;
      $handle = opendir($location);
      while ($file_name = readdir($handle)) {
        if ($file_name !== "." && $file_name !== "..") {
          $fpath = $location . $file_name;
          if (fileinode($fpath) === $fnum) return $fpath;
          if (is_dir($fpath) && basename($fpath) !== $basedir) {
            if ($result = searchFiles($fpath . "/", $fnum)) return $result;
          }
        }
      }
      closedir($handle);
      return false;
    }
    if ($filepath = searchFiles($origin . "/", (int) substr($_POST["inode"], 1))) {
      echoJson(array("filepath"=>str_replace($origin, "", $filepath)));
    } else {
      echoJson(array("filepath"=>null));
    }
  } else {
    echoJson(array("filepath"=>null));
  }
} else if ($action === "putContents") {
  if (isset($_POST["location"])) {
    $location = $origin . $_POST["location"];
    $contents = $_POST["contents"];
    $basename = basename($location);
    if (file_exists($location) && is_file($location)) {
      if (isBinary($location)) {
        echoError("Can't write into a binary file named $basename.");
      } else {
        file_put_contents($location, $contents);
      }
    } else {
      echoError("The file: $basename doesn't exist.");
    }
  } else {
    echoError("The file location is not specified.");
  }
} else if ($action === "moveFiles") {
  $message = "";
  if (isset($_POST["locations"])) {
    $locations = json_decode($_POST["locations"]);
    $folder = $origin . $_POST["location"];
    foreach ($locations as $location) {
      $location = $origin . $location;
      if (file_exists($location)) {
        $destination = $folder . basename($location);
        if (!file_exists($destination)) {
        } else {
          $message .= "A file or folder " . basename($location) . " already exists in the location.\n";
        }
      } else { 
        $message .= "The file " . basename($location) . " does not exist.\n";
      }
    }
    if (!$message) {
      foreach ($locations as $location) {
        $location = $origin . $location;
        $destination = $folder . basename($location);
        rename($location, $destination);
      }
    }
  } else {
    $message = "The file location is not specified.\n";
  }
  if ($message) {
    echoError($message);
  } else {
    echoJson(getFiles($_POST["location"]));
  }
} else if ($action === "renameFiles") {
  if (isset($_POST["location"])) {
    $location = $origin . $_POST["location"];
    $dirpath = dirname($location) . "/";
    $filepath = $dirpath . $_POST["fname"];
    if (file_exists($location)) {
      if (!file_exists($filepath)) {
        rename($location, $filepath);
        echoJson(getFiles(dirname($_POST["location"]) . "/"));
      } else {
        if (fileinode($location) === fileinode($filepath)) {
          rename($location, $filepath);
          echoJson(getFiles(dirname($_POST["location"]) . "/"));
        } else {
          $fname = basename($filepath);
          echoError("The destination already has a file named $fname.");
        }
      }
    } else { 
      echoError("The file does not exist.");
    }
  } else {
    echoError("The file location is not specified.");
  }
} else if ($action === "createFiles") {
  if (isset($_POST["location"])) {
    $location = $origin . $_POST["location"] . $_POST["fname"];
    if (!file_exists($location)) {
      $myfile = fopen($location, "w");
      fclose($myfile);
      echoJson(getFiles($_POST["location"]));
    } else { 
      echoError("A file or folder {$_POST["fname"]} already exists in the location.");
    }
  } else {
    echoError("The file location is not specified.");
  }
} else if ($action === "createFolders") {
  if (isset($_POST["location"])) {
    $location = $origin . $_POST["location"] . $_POST["fname"];
    if (!file_exists($location)) {
      mkdir($location);
      echoJson(getFiles($_POST["location"]));
    } else { 
      echoError("A file or folder {$_POST["fname"]} already exists in the location.");
    }
  } else {
    echoError("The file location is not specified.");
  }
} else if ($action === "deleteFiles") {
  if (isset($_POST["locations"])) {
    $locations = json_decode($_POST["locations"]);
    $deletedFiles = [];
    function deleteFolder($location) {
      $handle = opendir($location);
      while ($file_name = readdir($handle)) {
        if ($file_name !== "." && $file_name !== "..") {
          $fpath = $location . $file_name;
          if (is_file($fpath)) unlink($fpath);
          else if (is_dir($fpath)) deleteFolder($fpath . "/");
        }
      }
      closedir($handle);
      rmdir($location);
    }
    foreach ($locations as $location) {
      $location = $origin . $location;
      if (file_exists($location)) {
        if (is_dir($location)) deleteFolder($location);
        else unlink($location);
        Array_push($deletedFiles, str_replace($origin, "", $location));
      }
    }
    echoJson(Array("action"=>"deleteFiles", "deletedFiles"=>$deletedFiles));
  } else {
    echoError("The file location is not specified.");
  }
} else if ($action === "zipFiles") {
  try {
    class ZipArchiver {
      public static function zipFiles($files, $zipPath=null) {
        if (file_exists($zipPath)) unlink($zipPath);
        if (is_array($files)) foreach ($files as $a) self::zipF($a, $zipPath);
        else if (is_string($files)) return self::zipF($files, $zipPath);
      }
      private static function zipF($sourcePath, $outZipPath) {
        $pathInfo = pathinfo($sourcePath);
        $parentPath = $pathInfo['dirname'];
        $dirName = $pathInfo['basename'];
        $z = new ZipArchive();
        $z->open($outZipPath, ZipArchive::CREATE);
        if (is_dir($sourcePath)) {
          $z->addEmptyDir("$dirName");
          if ($sourcePath == $dirName) self::dirToZip($sourcePath, $z, 0);
          else self::dirToZip($sourcePath, $z, strlen("$parentPath/"));
        } else if (is_file($sourcePath)) $z->addFile($sourcePath, basename($sourcePath));
        $z->close();
        return true;
      }
      private static function dirToZip($folder, &$zipFile, $exclusiveLength){
        $handle = opendir($folder);
        while (FALSE !== $f = readdir($handle)) {
          if ($f != '.' && $f != '..') {
            $filePath = "$folder/$f";
            $localPath = substr($filePath, $exclusiveLength);
            if (is_file($filePath)) $zipFile->addFile($filePath, $localPath);
            elseif (is_dir($filePath)) {
              $zipFile->addEmptyDir($localPath);
              self::dirToZip($filePath, $zipFile, $exclusiveLength);
            }
          }
        }
        closedir($handle);
      }
    }
    if (isset($_POST["locations"])) {
      $zipper = new ZipArchiver;
      function mapDir($a) {
        global $origin;
        $a = $origin . $a;
        if (is_dir($a)) return dirname($a . "*");
        else if (is_file($a)) return $a;
        else return null;
      }
      $dirPath = json_decode($_POST["locations"]);
      $dirPath = array_map("mapDir", $dirPath);
      $location = $_POST["location"];
      $folder = dirname($location) . "/";
      $name = basename($location);
      if (is_file($origin . $location)) $name = pathinfo($name, PATHINFO_FILENAME);
      $zipPath = $folder . $name . ".zip";
      $zip = $zipper->zipFiles($dirPath, $origin . $zipPath);
      echoJson(getFiles($folder));
    } else {
      echoError("The file location is not specified.");
    }
  } catch (Throwable $e) {
    echoError("Failed to compress: " . $e->getMessage());
  }
} else if ($action === "extractFiles") {
  if (isset($_POST["location"])) {
    $archive = $origin . $_POST["location"];
    $destination = dirname($archive);
    try {
      $zip = new ZipArchive;
      if ($zip->open($archive) === TRUE) {
        $zip->extractTo($destination);
        $zip->close();
        $GLOBALS['status'] = array('success' => 'Files unzipped successfully');
        echoJson(getFiles(dirname($_POST["location"]) . "/"));
      } else {
        echoError("Failed to extract the archive file.");
      }
    } catch (Throwable $e) {
      echoError("Failed to extract: " . $e->getMessage());
    }
  } else {
    echoError("The file location is not specified.");
  }
} else if ($action === "uploadFiles") {
  if (isset($_GET["location"])) {
    $location = $origin . $_GET["location"];
    if (isset($_FILES["filetoupload"])) {
      $destination = $location . "/{$_FILES["filetoupload"]["name"]}";
      if (file_exists($destination)) {
        echoError("A file named " . basename($destination) . " already exits in the location.");
      } else if (file_exists($location) && is_dir($location)) {
        move_uploaded_file($_FILES["filetoupload"]["tmp_name"], $destination);
        echoJson(getFiles($_GET["location"]));
      } else {
        echoError("The folder does not exist in the location.");
      }
    }
  } else {
    echoError("The file location is not specified.");
  }
}
