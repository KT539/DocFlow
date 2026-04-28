<?php
/**
 * @file            backend/db_init.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


// used both AI and official doc to learn about PDO
$dbPath = __DIR__ . '/../database/db.sqlite';

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "
    CREATE TABLE IF NOT EXISTS flows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        source_dir TEXT NOT NULL,
        dest_dir TEXT NOT NULL,
        auto_trigger BOOLEAN DEFAULT 0,
        convert_docx BOOLEAN DEFAULT 1,
        convert_xlsx BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS conversions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flow_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        status TEXT CHECK(status IN ('SUCCESS', 'ERROR')),
        error_msg TEXT,
        converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
    );";

    $pdo->exec($sql);
    echo "Base de données initialisée avec succès";
} catch (PDOException $e) {
    die("Erreur : " . $e->getMessage());
}