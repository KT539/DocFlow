<?php
/**
 * @file            backend/api/flows.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */

// used both AI and official doc to learn about PDO


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE');

require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $flow = getFlow($id);
            if (!$flow) {
                http_response_code(404);
                echo json_encode(['error' => 'Flow introuvable']);
                exit;
            }
            echo json_encode($flow);
        } else {
            echo json_encode(getAllFlows());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['source_dir']) || empty($data['dest_dir'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Champs manquants']);
            exit;
        }

        $id = createFlow(
            $data['name'],
            $data['source_dir'],
            $data['dest_dir'],
            $data['auto_trigger'] ?? false,
            $data['convert_docx'] ?? true,
            $data['convert_xlsx'] ?? true
        );

        echo json_encode(['success' => true, 'id' => $id]);
        break;

    case 'PATCH':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID manquant']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $updated = updateFlow($id, $data);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Flow introuvable ou aucune modification']);
            exit;
        }
        echo json_encode(['success' => true]);
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

