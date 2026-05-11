/**
 * @file            src/components/ModalProgress.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   11-05-2026
 */

// the modal was written by myself, with help from AI

import { useState, useEffect, useRef } from 'react';

export default function ModalProgress({ flowId, onClose }) {
    const [files, setFiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logs, setLogs] = useState([]); // [{name, status}]
    const [isFinished, setIsFinished] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);

    const isCancelledRef = useRef(false);

    const queue_limit = 50;
    
    useEffect(() => {
        // // creates an internal function inside the useEffect, as useEffect itself can't be async
        const processFile = async (index, filesList) => { // takes the index of the current file, and the array of all files, as parameters
            // cancel logic
            if (isCancelledRef.current) {
                setLogs(prev => [...prev, { name: "INFO", status: "Annulé par l'utilisateur."}]);
                setIsFinished(true);
                return;
            }
            
            const fileName = filesList[index]; // name of the current file
            
            try {
                // converts a single file by feeding a filename to the conversion script
                const res = await fetch(`/convert.php?id=${flowId}&filename=${encodeURIComponent(fileName)}&trigger_type=MANUAL`); // encodeURIComponent ensures no special character breaks the URL
                const result = await res.json();
                
                setLogs(prev => [...prev, { name: fileName, status: result.status }]); // updates the logs state by adding the new line to the previous logs
            } catch (err) {
                setLogs(prev => [...prev, { name: fileName, status: 'ERROR' }]); // if the fetch fails, adds an error lign to the logs
            }

            if (index + 1 < filesList.length) { // checks if there are other files to convert
                setCurrentIndex(index + 1);
                await processFile(index + 1, filesList); // recursive call : the function calls itself to convert the next file in the list
            } else {
                setIsFinished(true); // if there are no more files, sets the isFinished state to true
            }
        };
        
        
        const startConversion = async () => {
            try {
                const res = await fetch(`/api/file_listing.php?id=${flowId}`); // gets the files list
                const data = await res.json(); // extracts the json data from the response
                let fileList = data.files || [];

                if (fileList.length > queue_limit) {
                    setLogs([{ name: "SYSTÈME", status: `Limit de ${queue_limit} fichiers atteinte.`}]);
                    fileList = fileList.slice(0, queue_limit)
                }

                setFiles(fileList); // updates the files state with the list
                
                if (fileList.length > 0) {
                    await processFile(0, fileList); // if the list isn't empty, starts converting the first file (index 0)
                } else {
                    setIsFinished(true); // if the list is empty, marks it as finished
                }
            } catch (err) {
                console.error("Erreur lors de l'initialisation : ", err);
                setLogs(prev => [...prev, { name: "ERREUR", status: "Impossible de lister les fichiers." }]);
                setIsFinished(true);
            }
        };

        startConversion(); // executes the internal function
    }, [flowId]); // depdencies array : runs when the modal is opened, and then again if flowId is changed while the modal is opened


    const handleCancel = () => {
        isCancelledRef.current = true;
        setIsCancelled(true);
    }

    // if there are other files to convert, sets the progress bar to : the current index + 1 once it's finished, divided by the list's length and then turned into a percentage
    const progress = files.length > 0 ? ((currentIndex + (isFinished ? 1 : 0)) / files.length) * 100 : 0; // !! math formula from AI !!

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-neutral-700">
                        {isFinished ? 'Conversion terminée' : isCancelled ? 'Annulation...' : 'Conversion en cours...'}
                    </h2>
                    {files.length > 0 && (
                        <span className="text-sm font-mono text-neutral-500">
                            {currentIndex + 1} / {files.length}
                        </span>
                    )}
                </div>
                
                <div className="p-6">
                    <div className="w-full bg-neutral-200 h-4 rounded-full overflow-hidden mb-4">
                        <div 
                            className="bg-blue-500 h-full transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="h-64 overflow-y-auto bg-neutral-50 rounded-lg border p-4 space-y-2 text-sm font-mono">
                        {/* maps the logs to display each log with its name and status */}
                        {logs.map((log, i) => (
                            <div key={i} className="flex justify-between border-b border-neutral-200 pb-1">
                                <span className="truncate mr-2">{log.name}</span>
                                <span className={log.status === 'SUCCESS' ? 'text-green-600' : log.status === 'SKIPPED' ? 'text-neutral-500' : 'text-red-600'}>
                                    {log.status}
                                </span>
                            </div>
                        ))}
                        {!isFinished && files.length > 0 && !isCancelled &&(
                            <div className="italic text-neutral-400 animate-pulse">
                                Traitement de : {files[currentIndex]}...
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-neutral-50 flex justify-between items-center gap-3">
                    <div>   
                        {/* cancel button is only visible during the conversion */}
                        {!isFinished && !isCancelled && (
                            <button onClick={handleCancel}
                            className="px-6 py-2 rounded-lg font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                                Annuler
                            </button>
                        )}
                    </div>
                    {/* disables the button if the conversion isn't finished */}
                    <button 
                        onClick={onClose}
                        disabled={!isFinished}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isFinished ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-neutral-300 text-neutral-600 cursor-not-allowed'}`}
                    >
                        {isFinished ? 'Terminer' : isCancelled ? 'Arrêt...' : 'Conversion...'}
                    </button>
                </div>
            </div>
        </div>
    );
}