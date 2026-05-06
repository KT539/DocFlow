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
    // uses simple '' instead of double "", so that the $variables intended for PowerShell aren't interpreted by PHP
    
    /*  
        New-Object opens Word in the background ;
        Get-Process gets the process's ID, so it can be killed later ; !! from AI !! ;
        $word.Visible = $false ensures Word remains hidden in the background and runs in "non-interactive mode" ;
        17 is the internal code for PDF format in Word ; 
        .Close(0) closes Word without saving the changes, to avoid opening a contextual window
        the Start-Sleep block forces a kill on the process if it is still silently running after 2 seconds ; !! from AI !! ;
        the finally block frees the COM object by force, and cleans up the RAM ; !! from AI !! ;
    */

    if ($isDocx) {
        $partialCommand = '
            try {
                $word = New-Object -ComObject Word.Application;
                $word_pid = (Get-Process -Name "Winword" | Select-Object -ExpandProperty Id | Sort-Object -Descending)[0];
                $word.Visible = $false;
                $doc = $word.Documents.Open(\'' . $safeInput . '\');
                $doc.ExportAsFixedFormat(\'' . $safeOutput . '\', 17);
                $doc.Close(0);
                $word.Quit();
                Start-Sleep -Seconds 2;
                if (Get-Process -Id $word_pid -ErrorAction SilentlyContinue) {
                    Stop-Process -Id $word_pid -Force
                };
            } finally {
                if ($doc) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null };
                if ($word) {
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null;
                    [System.GC]::Collect();
                    [System.GC]::WaitForPendingFinalizers();
                };
            };';
    }

    /*  
        $excel.DisplayAlerts = $false avoids opening contextual windows ;
        0 = internal code for PDF format in Excel ;
        .Close($false) closes Excel without saving the changes, to avoid opening a contextual window ;
    */

    elseif ($isXlsx) {
        $partialCommand = '
            try {
                $excel = New-Object -ComObject Excel.Application;
                $excel_pid = (Get-Process -Name "Excel" | Select-Object -ExpandProperty Id | Sort-Object -Descending)[0];
                $excel.Visible = $false;
                $excel.DisplayAlerts = $false;
                $wb = $excel.Workbooks.Open(\'' . $safeInput . '\');
                $wb.ExportAsFixedFormat(0, \'' . $safeOutput . '\');
                $wb.Close($false);
                $excel.Quit();
                Start-Sleep -Seconds 2;
                if (Get-Process -Id $excel_pid -ErrorAction SilentlyContinue) {
                    Stop-Process -Id $excel_pid -Force
                };
            } finally {
                if ($wb) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null };
                if ($excel) {
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null;
                    [System.GC]::Collect();
                    [System.GC]::WaitForPendingFinalizers();
                };
            };';
    };

    if ($partialCommand !== "") {
        // replace the returns-to-line with spaces, to stop Windows's CMD from trunking the command
        $cleanCommand = str_replace(["\r", "\n"], ' ', $partialCommand);
        
        // wraps the partial command in a Windows-executable system command
        $fullCommand = "powershell -ExecutionPolicy Bypass -Command \"$cleanCommand\" 2>&1"; // 2>&1 redirects STDERR to STDOUT, so that PowerShell system errors are received by PHP ($output only receives the data on STDOUT) ; help from AI
        
        $output = []; // resets the output
        exec($fullCommand, $output, $returnVar); // output = array that will receive everything PowerShell-related ; returnVar = outpput code (0 = success, other = error)

        // with every iteration, insert a new row in the conversions table of the db
        if ($returnVar === 0) {
            $successCount++;
            logConversion($id, $file, 'SUCCESS');
        } else {
            $errorCount++;
            $errorDetail = !empty($output) ? implode(" ", $output) : "Erreur PowerShell"; // converts the content of the $output array into a string with implode(), or gives a generic error message if $output is empty
            logConversion($id, $file, 'ERROR', $errorDetail);
        }
    }
}

echo json_encode(['success' => $successCount, 'errors' => $errorCount]);