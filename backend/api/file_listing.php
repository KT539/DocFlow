<?php
/**
 * @file            backend/api/file_listing.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   06-05-2026
 */


header('Content-Type: application/json');

require_once '../db.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    echo json_encode(['error' => 'ID manquant']);
    exit;
}

$flow = getFlow($id);
if (!$flow) {
    echo json_encode(['error' => 'Flow introuvable']);
    exit;
}

$sourceDir = $flow['source_dir'];
if (!is_dir($sourceDir)) {
    echo json_encode(['error' => 'Dossier source inaccessible', 'path' => $sourceDir]);
    exit;
}

$files = scandir($sourceDir);
$toConvert = [];

foreach ($files as $file) {
    // ignores the folders . and .. returned by scandir()
    if ($file === '.' || $file === '..') {
        continue;
    }

    // if a file is either a docx or a xlsx, adds it to the toConvert array
    $fullPath = $sourceDir . DIRECTORY_SEPARATOR . $file;
    if (!is_file($fullPath)) {
        continue;
    }

    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $isDocx = ($extension === 'docx' && $flow['convert_docx']);
    $isXlsx = ($extension === 'xlsx' && $flow['convert_xlsx']);

    if ($isDocx || $isXlsx) {
        array_push($toConvert, $file);
    }
}

echo json_encode(['files' => $toConvert]);