<?php
/**
 * @file            backend/db.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   04-05-2026
 */

// used both AI and official doc to learn about PDO and its syntax


// connexion to the database
function getDb() {
    $dbPath = __DIR__ . '/../database/db.sqlite';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // set the PDO to error reporting mode and configure it to throw PDOExceptions
    return $pdo;
};

function getAllFlows() {
    $pdo = getDb();
    $stmt = $pdo->query("SELECT * FROM flows"); // no parameter, so using query() is safe
    return $stmt->fetchAll(PDO::FETCH_ASSOC); // returns only the associative array
};

function getFlow($id) {
    $pdo = getDb();
    $stmt = $pdo->prepare("SELECT * FROM flows WHERE id = :id"); // prepare() sends the structure of the query to the server
    $stmt->execute([':id' => $id]); // execute() sends the value of the parameters and executes the query
    return $stmt->fetch(PDO::FETCH_ASSOC);
};

function createFlow($name, $sourceDir, $destDir, $autoTrigger, $convertDocx, $convertXlsx) {
    $pdo = getDb();
    $stmt = $pdo->prepare("
        INSERT INTO flows (name, source_dir, dest_dir, auto_trigger, convert_docx, convert_xlsx)
        VALUES (:name, :source_dir, :dest_dir, :auto_trigger, :convert_docx, :convert_xlsx)
    ");
    // no native BOOLEAN type in SQLite, so the booleans are converted to 0/1
    $stmt->execute([
        ':name'          => $name,
        ':source_dir'    => $sourceDir,
        ':dest_dir'      => $destDir,
        ':auto_trigger'  => $autoTrigger ? 1 : 0,
        ':convert_docx'  => $convertDocx ? 1 : 0,
        ':convert_xlsx'  => $convertXlsx ? 1 : 0,
    ]);
    return $pdo->lastInsertId(); // returns the id of the created row
};

// !! code mostly from AI !!
function updateFlow($id, $fields) {
    $pdo = getDb();
    $allowed = ['name', 'source_dir', 'dest_dir', 'auto_trigger', 'convert_docx', 'convert_xlsx']; // only listed columns can be modified
    $sets = [];
    $params = [':id' => $id];

    // dynamically builds the set and add parameters to the param array
    // this loop turns a PHP array into SQL "fragments"
    foreach ($fields as $key => $value) {
        if (in_array($key, $allowed)) {
            $sets[] = "$key = :$key"; // prepares the SQL syntax "column = :marker"
            $params[":$key"] = $value; // stores the value for the execute() statement
        }
    }

    if (empty($sets)) return false;

    // implode(', ', $sets) joins the SQL "fragments" with commas
    $stmt = $pdo->prepare("UPDATE flows SET " . implode(', ', $sets) . " WHERE id = :id");
    $stmt->execute($params);
    return $stmt->rowCount() > 0;
};

function deleteFlow($id){
    $pdo = getDb();
    $stmt = $pdo->prepare("DELETE FROM flows WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->rowCount() > 0; // confirms at least 1 row was affected by the DELETE
};