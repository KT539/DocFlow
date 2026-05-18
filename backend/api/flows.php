<?php
/**
 * @file            backend/api/flows.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   04-05-2026
 */


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // allows any origin to call the API
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE'); // accepted methods

require_once '../db.php'; // imports the file only once

// tracks which method is used and whether there is an ID or not
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $flow = getFlow($id); // if there is an ID, calls getFlow()
            if (!$flow) {
                http_response_code(404);
                echo json_encode(['error' => 'Flow introuvable']);
                exit;
            }
            echo json_encode($flow);
        } else {
            $flows = getAllFlows(); // if there is no ID, calls getAllFlows()
            echo json_encode($flows);
        }
        break;

    case 'POST':
        // decodes the data from the raw body of the query and builds a PHP array
        $data = json_decode(file_get_contents('php://input'), true); // !! from AI !!

        // checks that mandatory fields are filled in
        if (empty($data['name']) || empty($data['source_dir']) || empty($data['dest_dir'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Champs manquants']);
            exit;
        }

        $hasFormat = ($data['convert_docx'] || $data['convert_xlsx']);
        if (!$hasFormat) {
            http_response_code(400);
            echo json_encode(['error' => 'Veuillez sélectionner au moins un format de fichiers']);
            exit;
        }
        try {
            $id = createFlow(
            $data['name'],
            $data['source_dir'],
            $data['dest_dir'],
            $data['auto_trigger'] ?? false,
            $data['convert_docx'] ?? true,
            $data['convert_xlsx'] ?? true);

            echo json_encode(['success' => true, 'id' => $id]);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) { // checks if e.getMessage() contains the string 'UNIQUE constraint failed'
                http_response_code(409);
                echo json_encode(['error' => 'Un Flow avec ce nom existe déjà']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur serveur']);
            }
            exit;
        }
        break;

    case 'PATCH':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID manquant']);
            exit;
        }
        // decodes the data from the rwa body of the query and builds a PHP array
        $data = json_decode(file_get_contents('php://input'), true); // !! from AI !!
        try {    
            $updated = updateFlow($id, $data);
            if (!$updated) {
                http_response_code(404);
                echo json_encode(['error' => 'Flow introuvable ou aucune modification']);
                exit;
            }
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                http_response_code(409);
                echo json_encode(['error' => 'Un Flow avec ce nom existe déjà']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur serveur']);
            }
            exit;
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID manquant']);
            exit;
        }
        $deleted = deleteFlow($id);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['error' => 'Flow introuvable']);
            exit;
        }
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
}

