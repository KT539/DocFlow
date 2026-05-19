/**
 * @file            src/main.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   19-05-2026
 */

import App from './App.jsx';
import ReactDOM from 'react-dom/client';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root')); // creates a React root tied to div#root, which will manage all rendering ; !! help from AI !!
root.render(<App />); // mounts and renders the App component into div#root