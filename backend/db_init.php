<?php
/**
 * @file            backend/db_init.php
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   18-05-2026
 */

// used both AI and official doc to learn about PDO and its syntax


require_once 'db.php'; // imports the file a single time

try {
    $pdo = getDb(); // gets the PDO instance

    /* if the tables already exist, the instruction is ignored ;
    ON DELETE CASCADE allows to automatically delete conversion history when a flow is deleted ;
    TEXT CHECK is a sql constraint, ensuring the status can only be SUCCESS or ERROR */
    $sql = "
    CREATE TABLE IF NOT EXISTS flows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
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
        status TEXT CHECK(status IN ('SUCCESS', 'ERROR', 'SKIPPED')),
        trigger_type TEXT CHECK(trigger_type IN ('MANUAL', 'AUTO')) DEFAULT 'MANUAL',
        error_msg TEXT,
        converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
    );";

    $pdo->exec($sql);
    echo "Base de données initialisée avec succès";
} catch (PDOException $e) {
    die("Erreur : " . $e->getMessage()); // die stops the script ; execSync in electron/main.js will then stop the program from executing
}