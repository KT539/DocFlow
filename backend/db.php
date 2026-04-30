<?php
/**
 * @file            backend/db.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */

// used both AI and official doc to learn about PDO


function getDb() {
    $dbPath = __DIR__ . '/../database/db.sqlite';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
};

function getAllFlows() {
    $pdo = getDb();
    $stmt = $pdo->query("SELECT * FROM flows");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
};

function getFlow($id) {
    $pdo = getDb();
    $stmt = $pdo->prepare("SELECT * FROM flows WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
};

function createFlow($name, $sourceDir, $destDir, $autoTrigger, $convertDocx, $convertXlsx) {
    $pdo = getDb();
    $stmt = $pdo->prepare("
        INSERT INTO flows (name, source_dir, dest_dir, auto_trigger, convert_docx, convert_xlsx)
        VALUES (:name, :source_dir, :dest_dir, :auto_trigger, :convert_docx, :convert_xlsx)
    ");
    $stmt->execute([
        ':name'          => $name,
        ':source_dir'    => $sourceDir,
        ':dest_dir'      => $destDir,
        ':auto_trigger'  => $autoTrigger ? 1 : 0,
        ':convert_docx'  => $convertDocx ? 1 : 0,
        ':convert_xlsx'  => $convertXlsx ? 1 : 0,
    ]);
    return $pdo->lastInsertId();
};

// !! code mostly from AI !!
function updateFlow($id, $fields) {
    $pdo = getDb();
    $allowed = ['name', 'source_dir', 'dest_dir', 'auto_trigger', 'convert_docx', 'convert_xlsx'];
    $sets = [];
    $params = [':id' => $id];

    foreach ($fields as $key => $value) {
        if (in_array($key, $allowed)) {
            $sets[] = "$key = :$key";
            $params[":$key"] = $value;
        }
    }

    if (empty($sets)) return false;

    $stmt = $pdo->prepare("UPDATE flows SET " . implode(', ', $sets) . " WHERE id = :id");
    $stmt->execute($params);
    return $stmt->rowCount() > 0;
};

function deleteFlow($id){
    $pdo = getDb();
    $stmt = $pdo->prepare("DELETE FROM flows WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->rowCount() > 0;
};