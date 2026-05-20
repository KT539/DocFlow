# DocFlow

**DocFlow** est une application de bureau Windows qui automatise la conversion de documents Word (`.docx`) et Excel (`.xlsx`) en PDF. Elle permet de configurer des **Flows** — des règles associant un dossier source à un dossier de destination — qui peuvent être exécutés manuellement ou surveillés en temps réel pour convertir automatiquement tout nouveau fichier déposé.

> Projet réalisé dans le cadre de mon TPI.

---

## Fonctionnalités

- **Gestion des Flows** — Créer, modifier et supprimer des configurations de conversion (nom, dossier source, dossier destination, règles de conversion)
- **Conversion manuelle** — Lancer la conversion de tous les fichiers éligibles d'un Flow, avec suivi de progression en temps réel dans une modale
- **Conversion automatique** — Surveiller passivement un dossier source et convertir automatiquement tout nouveau fichier déposé
- **File d'attente** — Traitement séquentiel des conversions automatiques avec compteur en temps réel et bouton de vidage d'urgence
- **Historique** — Consultation de l'historique complet de chaque Flow (statut, horodatage, chemins de dossiers, type de déclenchement)
- **Vérifications au démarrage** — Contrôle automatique de l'environnement (OS, PHP, Microsoft Office, disponibilité des ports)

---

## Stack technologique

| Couche | Technologie |
|---|---|
| Interface | React 18, Tailwind CSS 4, Vite 5 |
| Application de bureau | Electron 30 |
| Backend | PHP 8 (serveur intégré) |
| Base de données | SQLite (via PDO) |
| Surveillance fichiers | Chokidar 3 |
| Conversion | PowerShell + objets COM Microsoft Office |
| Gestionnaire de paquets | npm |

---

## Prérequis

- **Windows** uniquement (dépendance aux objets COM Microsoft Office)
- **Node.js** ≥ 18 et **npm**
- **PHP 8** installé et accessible dans le PATH système
- **Microsoft Office** (Word et Excel) installé avec une licence valide

---

## Installation et démarrage

```bash
# 1. Cloner le dépôt
git clone https://github.com/KT539/DocFlow.git
cd DocFlow

# 2. Installer les dépendances Node.js
npm install

# 3. Lancer l'application (Vite + Electron en parallèle)
npm start
```

Au premier démarrage, DocFlow initialise automatiquement la base de données SQLite (`database/db.sqlite`).

> **Remarque** : les ports `5173` (Vite) et `8000` (PHP) doivent être disponibles sur la machine.

---

## Structure du projet

```
DocFlow/
│
├── index.html                  # Point d'entrée HTML, ancre React et définit la CSP
├── package.json                # Dépendances et script de démarrage
├── vite.config.js              # Configuration Vite : plugins React/Tailwind et proxy vers PHP
│
├── electron/
│   ├── main.cjs                # Main Process : orchestration, IPC, Chokidar, file d'attente
│   └── preload.cjs             # Passerelle sécurisée Main ↔ Renderer (contextBridge)
│
├── backend/
│   ├── db.php                  # Couche d'accès aux données (fonctions PDO/SQLite)
│   ├── db_init.php             # Initialisation des tables flows et conversions
│   ├── convert.php             # Logique de conversion (PowerShell, COM, timeout)
│   └── api/
│       ├── flows.php           # API REST pour la gestion des Flows (GET/POST/PATCH/DELETE)
│       ├── conversions.php     # API REST pour la consultation de l'historique (GET)
│       └── file_listing.php    # Liste les fichiers éligibles dans le dossier source d'un Flow
│
├── database/
│   └── db.sqlite               # Base de données embarquée (créée au premier démarrage)
│
└── src/
    ├── main.jsx                # Point d'entrée React
    ├── App.jsx                 # Composant racine, gestion de la navigation par état
    ├── styles.css              # Import Tailwind CSS
    ├── components/
    │   ├── nav.jsx             # Barre de navigation latérale
    │   └── ModalProgress.jsx   # Modale de suivi de la conversion manuelle
    └── pages/
        ├── flows.jsx           # Page principale : liste des Flows et compteur file d'attente
        ├── new_flows.jsx       # Formulaire de création d'un Flow
        ├── update_flows.jsx    # Formulaire de modification d'un Flow
        ├── history.jsx         # Historique et statistiques d'un Flow
        └── settings.jsx        # Page paramètres (à implémenter)
```

---

## Détails du développement

### Conversion via objets COM Microsoft Office

La conversion repose sur les objets COM `Word.Application` et `Excel.Application`, pilotés par des commandes PowerShell générées dynamiquement par PHP. Cette approche garantit une fidélité maximale au rendu d'origine, Word et Excel effectuant eux-mêmes l'export PDF.

Les instances Office sont forcées en mode non-interactif (`Visible = $false`, `DisplayAlerts = 0`) pour rester invisibles à l'utilisateur. Un bloc `try/finally` PowerShell libère systématiquement les objets COM et force l'arrêt du processus Office ciblé par son PID à la fin de chaque conversion, qu'elle ait réussi ou échoué — sans jamais affecter les éventuelles instances Office déjà ouvertes par l'utilisateur.

### Gestion du timeout avec `proc_open()`

PHP lance PowerShell via `proc_open()`, qui ouvre des pipes `stdout` et `stderr` en mode non-bloquant pour lire la sortie en temps réel. Si la conversion dépasse 30 secondes (fichier corrompu, fenêtre contextuelle bloquante), le processus est interrompu de force via `taskkill /F /T`, l'erreur est consignée en base de données et la conversion passe au fichier suivant.

### Architecture Electron : Main Process, Renderer Process et IPC

Electron sépare l'application en deux processus isolés. Le **Main Process** a accès à Node.js et aux API système ; le **Renderer Process** exécute l'interface React dans Chromium, sans accès direct à Node.js. La communication entre les deux s'effectue via l'**IPC** (Inter-Process Communication) :

- `ipcMain.handle` / `ipcRenderer.invoke` pour les appels avec réponse (ex. ouverture de l'explorateur de fichiers)
- `ipcMain.on` / `ipcRenderer.send` pour les messages sans réponse attendue (ex. rafraîchissement des watchers)
- `win.webContents.send` / `ipcRenderer.on` pour les messages du Main vers le Renderer (ex. compteur de file d'attente toutes les 100 ms)

Le fichier `preload.cjs` expose ces canaux de manière sécurisée via `contextBridge`, sans jamais donner au Renderer Process un accès direct à Node.js.

### Surveillance automatique avec Chokidar

La fonction `setupAutoTriggers()` instancie un watcher Chokidar sur chaque Flow automatique, configuré avec :

- `persistent: true` — reste actif pour toute la durée de vie de l'application
- `ignoreInitial: true` — ignore les fichiers déjà présents au démarrage de la surveillance
- `depth: 0` — surveille uniquement le répertoire racine, sans récursion
- `awaitWriteFinish: true` — attend la fin de l'écriture avant de déclencher l'événement, évitant de tenter de convertir un fichier encore en cours de copie

Les watchers sont fermés et réinstanciés à chaque modification de Flow, pour éviter toute surveillance en double.

### File d'attente de conversion automatique

Les fichiers détectés par Chokidar sont ajoutés à un tableau `conversionQueue` dans le Main Process. La fonction récursive `convQueue()` traite les entrées une par une via un verrou booléen `isConverting`, garantissant qu'une seule instance PowerShell est active à la fois. La file est plafonnée à 500 éléments, au-delà desquels une alerte est envoyée au Renderer Process via l'IPC.

### Proxy Vite et CORS

Le frontend (port `5173`) et le backend PHP (port `8000`) tournant sur des ports différents, les requêtes seraient bloquées par la Same-Origin Policy de Chromium. Vite est configuré comme proxy pour intercepter les requêtes vers `/api` et `/convert.php` et les rediriger vers `localhost:8000`, contournant cette restriction de manière transparente.

### Hooks React : `useState`, `useEffect`, `useRef`

L'interface utilise trois Hooks React principaux. `useState` gère l'état affiché (liste des Flows, progression, logs). `useEffect` déclenche les appels réseau au montage des composants. `useRef` est utilisé dans `ModalProgress` pour le bouton d'annulation : la valeur d'un `useState` capturée dans la closure de la fonction récursive `processFile()` serait figée à sa valeur initiale ; le `useRef` permet au contraire de lire la valeur courante depuis n'importe quelle itération récursive.

---

## Auteurs

**Kilian Testard** — Développement  
**Pascal Hurni** — Responsable de projet
**Flavio Pacifico** — Expert 
**Mathieu Meylan** — Expert
