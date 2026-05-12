<?php
/**
 * @file            backend/convert.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @last_modified   12-05-2026
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

// gets a specific filename
$filename = $_GET['filename'] ?? null;

// gets the trigger_type
$triggerType = $_GET['trigger_type'] ?? 'MANUAL';

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

// checks if the user has the persmission to write in the destDir
if (!is_writable($destDir)) {
    echo json_encode(['error' => 'Permissions insuffisantes ou dossier de destination inexistant']);
    exit;
};

// checks if the destination drive has enough free space
$freeSpace = disk_free_space($destDir);
if ($freeSpace < 10 * 1024 * 1024) { // checks for at least 10 free Mo
    echo json_encode(['error' => 'Espace disque insuffisant']);
    exit;
}

$files = $filename ? [$filename] : scandir($sourceDir); // processes either the content of the source dir or a single file if a filname is received

$successCount = 0;
$errorCount = 0;
$skippedCount = 0;
$lastStatus = 'SKIPPED';


foreach ($files as $file) {
    // ignores the folders . and .. returned by scandir() and the temporary Office files
    if ($file === '.' || $file === '..' || str_starts_with($file, '~$')) {
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

    // checks if the pdf already exists in the destDir ; then checks its last modification date ; suggestion from AI
    // if the docx/xlsx is more recent than the pdf, converts it and overwrites the pdf ; if not, stops the duplicated conversion
    if (file_exists($outputPath) && filemtime($fullPath) <= filemtime($outputPath)) {
        $skippedCount++;
        $lastStatus = 'SKIPPED';
        logConversion($id, $file, 'SKIPPED', null, $triggerType);
        continue;
    }

    // double the single ', to prevent security risk via injections
    $safeInput = str_replace("'", "''", $inputPath); // uses str_replace() to escape the variable
    $safeOutput = str_replace("'", "''", $outputPath);
    $partialCommand = "";

    // prepare the partial command depending on the extension
    // uses simple '' instead of double "", so that the $variables intended for PowerShell aren't interpreted by PHP
    
    /*  
        Both PowerShell commands were written with heavy help from AI
        New-Object opens Word in the background ;
        Get-Process gets the process's ID, so it can be killed later ; !! from AI !! ;
        $word.Visible = $false ensures Word remains hidden in the background and runs in "non-interactive mode" ;
        $ DisplayAlerts = 0 turns off pop-up windows
        opens the documents in Read-only
        17 is the internal code for PDF format in Word ; 
        .Close(0) closes Word without saving the changes, to avoid opening a contextual window
        the finally block frees the COM object, and cleans up the RAM, and then forces a kill on the process if it is still openend ; !! from AI !! ;
    */

    if ($isDocx) {
        $partialCommand = '
            try {
                $word = New-Object -ComObject Word.Application;
                $word_pid = (Get-Process -Name "Winword" | Where-Object { $_.MainWindowHandle -eq 0 } | Sort-Object -Descending | Select-Object -ExpandProperty Id -First 1);
                $word.Visible = $false;
                $word.DisplayAlerts = 0;
                $doc = $word.Documents.Open(\'' . $safeInput . '\', $false, $true);
                $doc.ExportAsFixedFormat(\'' . $safeOutput . '\', 17);
                $doc.Close(0);
                $word.Quit();
                Start-Sleep -Seconds 2;
            } finally {
                if ($doc) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null };
                if ($word) {
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null;
                    [System.GC]::Collect();
                    [System.GC]::WaitForPendingFinalizers();
                };
                if ($word_pid -and (Get-Process -Id $word_pid -ErrorAction SilentlyContinue)) {
                    Stop-Process -Id $word_pid -Force -ErrorAction SilentlyContinue;
                }
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
                $excel_pid = (Get-Process -Name "Excel" | Where-Object { $_.MainWindowHandle -eq 0 } | Sort-Object -Descending | Select-Object -ExpandProperty Id -First 1);
                $excel.Visible = $false;
                $excel.DisplayAlerts = $false;
                $wb = $excel.Workbooks.Open(\'' . $safeInput . '\', 0, $true);
                $wb.ExportAsFixedFormat(0, \'' . $safeOutput . '\');
                $wb.Close($false);
                $excel.Quit();
                Start-Sleep -Seconds 2;
            } finally {
                if ($wb) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null };
                if ($excel) {
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null;
                    [System.GC]::Collect();
                    [System.GC]::WaitForPendingFinalizers();
                };
                if ($excel_pid -and (Get-Process -Id $excel_pid -ErrorAction SilentlyContinue)) {
                    Stop-Process -Id $excel_pid -Force -ErrorAction SilentlyContinue;
                }
            };';
    };

    if ($partialCommand !== "") {
        // replace the returns-to-line with spaces, to stop Windows's CMD from trunking the command
        $cleanCommand = str_replace(["\r", "\n"], ' ', $partialCommand);
        // wraps the partial command in a Windows-executable system command
        $fullCommand = "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$cleanCommand\" 2>&1"; // 2>&1 redirects STDERR to STDOUT, so that PowerShell system errors are received by PHP ($output only receives the data on STDOUT) ; help from AI

        // configures the descriptors (stdin = 0, stdout = 1, stderr = 3) ; !! from AI !!
        $descriptorspec = [
            0 => ["pipe", "r"], // PHP writes, PS reads
            1 => ["pipe", "w"], // PS writes, PHP reads
            2 => ["pipe", "w"] // PS writes, PHP reads
        ];

        // switched from exec() to proc_open() on AI suggestion, in order to set up a timeout
        $process = proc_open($fullCommand, $descriptorspec, $pipes);

        if (is_resource($process)) {
            $isTimeout = false;
            $timeout = 30;
            $startTime = time();

            while (true) {
                $status = proc_get_status($process); // gets status-related info in real time
                if (!$status['running']) { // if the process is no longer running, breaks the loop
                    break;
                }

                if ((time() - $startTime) > $timeout) { // checks if the timeout is reached
                    $isTimeout = true;
                    exec("taskkill /F /T /PID " . $status['pid']); // forced cleanup /Force /Tree : kills the PS process and its sub-processes like Word/Excel ; !! from AI !!
                    break;
                }
                usleep(100000); // wait 0.1 second before checking again, to stop CPU overloads
            }

            $stdout = stream_get_contents($pipes[1]); // reads the info in the output pipe
            $stderr = stream_get_contents($pipes[2]);

            foreach ($pipes as $pipe) { 
                fclose($pipe); // closes the pipes
            }
            $returnVar = proc_close($process); // defines returnVar with the PS exit code

            if ($isTimeout) {
                $errorCount++;
                $lastStatus = 'ERROR';
                $errorDetail = "Timeout : La conversion a pris trop de temps (fichier bloqué ou trop lourd).";
                logConversion($id, $file, 'ERROR', $errorDetail, $triggerType);
                continue;
            }

            // with every iteration, insert a new row in the conversions table of the db
            if ($returnVar === 0) { // returnVar = output code (0 = success, other = error)
                $successCount++;
                $lastStatus = 'SUCCESS';
                logConversion($id, $file, 'SUCCESS', null, $triggerType);
            } else {
                $errorCount++;
                $lastStatus = 'ERROR';
                $errorDetail = !empty($stdout) ? trim($stdout) : "Erreur PowerShell"; // converts the content of the $output array into a string with implode(), or gives a generic error message if $output is empty
                logConversion($id, $file, 'ERROR', $errorDetail, $triggerType);
            }
        }
    }
};

if ($filename) {
    echo json_encode(['status' => $lastStatus, 'file' => $filename]);
} else {
    echo json_encode(['success' => $successCount, 'errors' => $errorCount, 'skipped' => $skippedCount]);
}