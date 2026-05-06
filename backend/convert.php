<?php
/**
 * @file            backend/convert.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @last_modified   05-05-2026
 */

// the whole conversion script was written by myself, but with help from AI, specially the commands themselves

header('Content-Type: application/json');
require_once 'db.php'; // imports the file only once


// gets the Flow's ID
$id = $_GET['id'] ?? null;
if (!$id) {
    echo json_encode(['error' => 'ID du Flow manquant']);
    exit;
};

// gets the Flow
$flow = getFlow($id);
if (!$flow) {
    echo json_encode(['error' => 'Flow introuvable']);
    exit;
};

// gets the Flow's directories, and ensures they exist
$sourceDir = $flow['source_dir'];
$destDir = $flow['dest_dir'];
if (!is_dir($sourceDir) || !is_dir($destDir)) {
    echo json_encode(['error' => 'Dossier source ou destination inaccessible']);
    exit;
};


$files = scandir($sourceDir); // lists the content of the sourceDir
$successCount = 0;
$errorCount = 0;

foreach ($files as $file) {
    // ignores the folders . and .. returned by scandir()
    if ($file === '.' || $file === '..') {
        continue;
    }
    // checks the file is a file, and not a folder
    $fullPath = $sourceDir . DIRECTORY_SEPARATOR . $file;
    if (!is_file($fullPath)) {
        continue;
    }
    // extract the file extension
    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    // ensures it only works with docx and xlsx
    $isDocx = ($extension === 'docx' && $flow['convert_docx']);
    $isXlsx = ($extension === 'xlsx' && $flow['convert_xlsx']);
    if (!$isDocx && !$isXlsx) {
        continue;
    }

    $inputPath = realPath($fullPath); // realPath : converts relative paths into absolute ones
    // if a file is inaccessible, logs the error in the PHP log and continues with the next one without crashing the app
    if (!$inputPath) {
        error_log("DocFlow Error: Impossible de résoudre le chemin absolu pour le fichier : " . $file);
        continue; 
    }
    $outputPath = $destDir . DIRECTORY_SEPARATOR . pathinfo($file, PATHINFO_FILENAME) . ".pdf";

    // double the single ', to prevent security risk via injections
    $safeInput = str_replace("'", "''", $inputPath); // uses str_replace() to escape the variable
    $safeOutput = str_replace("'", "''", $outputPath);

    $partialCommand = "";

    // prepare the partial command depending on the extension
    // uses simple '' instead of double "", so that the $variables intented for PowerShell aren't interpreted by PHP
    if ($isDocx) {
        $partialCommand = '$word = New-Object -ComObject Word.Application; ' . // opens Word in the background
                     '$word.Visible = $false; ' . // ensures the app stays hidden in the background
                     '$doc = $word.Documents.Open(\'' . $safeInput . '\'); ' .
                     '$doc.ExportAsFixedFormat(\'' . $safeOutput . '\', 17); ' . // executes the conversion ; 17 = internal code for PDF format in Word
                     '$doc.Close(0); ' . // closes Word after the conversion ; (0) doesn't save the changes, to avoid opening a contextual window
                     '$word.Quit();';
    }
    elseif ($isXlsx) {
        $partialCommand = '$excel = New-Object -ComObject Excel.Application; ' .
                     '$excel.Visible = $false; ' .
                     '$excel.DisplayAlerts = $false; ' . // avoids opening contextual windows
                     '$wb = $excel.Workbooks.Open(\'' . str_replace("'", "''", $inputPath) . '\'); ' .
                     '$wb.ExportAsFixedFormat(0, \'' . str_replace("'", "''", $outputPath) . '\'); ' . // 0 = internal code for PDF format in Excel
                     '$wb.Close($false); ' .
                     '$excel.Quit();';
    }

    if ($partialCommand !== "") {
        // wraps the partial command in a Windows-executable system command
        $fullCommand = "powershell -ExecutionPolicy Bypass -Command \"$partialCommand\"";
        
        $output = []; // resets the output
        exec($fullCommand, $output, $returnVar); // output = array that will receive everything PowerShell-related ; returnVar = outpput code (0 = success, other = error)

        // with every iteration, insert a new row in the conversions table of the db
        if ($returnVar === 0) {
            $successCount++;
            logConversion($id, $file, 'SUCCESS');
        } else {
            $errorCount++;
            $errorDetail = !empty($output) ? implode(" ", $output) : "Erreur PowerShell";
            logConversion($id, $file, 'ERROR', $errorDetail);
        }
    }
}

echo json_encode(['success' => $successCount, 'errors' => $errorCount]);