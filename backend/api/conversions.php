<?php
/**
 * @file            backend/api/conversions.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   06-05-2026
 */


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // allows any origin to call the API
header('Access-Control-Allow-Methods: GET'); // accepted methods

require_once '../db.php'; // imports the file only once

// tracks which method is used and whether there is a flowId or not
$method = $_SERVER['REQUEST_METHOD'];
$flowId = $_GET['flow_id'] ?? null;

if ($method === 'GET') {
    if (!$flowId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du Flow requis']);
        exit;
    }
    echo json_encode(getConversionByFlow($flowId), JSON_INVALID_UTF8_SUBSTITUTE); // ensures JSON validation between PHP and PowerShell ; !! from AI !!
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}