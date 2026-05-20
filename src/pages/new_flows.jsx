/**
 * @file            src/pages/new_flows.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   19-05-2026
 */


import { useState } from 'react';

export default function NewFlows({ setCurrentPage }) {
    const [form, setForm] = useState({
        name: '',
        source_dir: '',
        dest_dir: '',
        auto_trigger: false,
        convert_docx: true,
        convert_xlsx: true,
    });
    const [status, setStatus] = useState(null);

    // generic input handler ; !! from AI !!
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target; // when handleChange is called, returns the characteristics of the new input received from the user
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value // keeps the old values with a spread operator, and adds to it the new value (or boolean if it is a checkbox)
        }));
    };

    const handleSubmit = async () => {
        setStatus(null);

        const hasFormat = form.convert_docx || form.convert_xlsx; // ensures at least 1 file format is selected
        if (!hasFormat) { 
            setStatus('error_no_format'); // or changes the status and stops the execution
            return; 
        }

        const isSourceValid = await window.electronAPI.isDirectory(form.source_dir);
        const isDestValid = await window.electronAPI.isDirectory(form.dest_dir); // checks if the source and dest foledrs are directories

        // if not, changes the status and stops the execution
        if (!isSourceValid) {
            setStatus('error_invalid_folder');
            return;
        }
        if (!isDestValid) {
            setStatus('error_invalid_folder');
            return;
        }

        try {
            const res = await fetch('/api/flows.php', {
                method: 'POST', // specifies the method (fetch has GET as its default method)
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form) // turns the form (javascript object) into a string to be sent to the PHP API
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error);
            }
            // refreshes the watchers
            if (window.electronAPI && window.electronAPI.refreshWatchers) {
                window.electronAPI.refreshWatchers();
            }
            setStatus('success');

            setForm({ name: '', source_dir: '', dest_dir: '', auto_trigger: false, convert_docx: true, convert_xlsx: true }); // resets the form
            setTimeout(() => setCurrentPage('flows'), 1500); // returns to main page after 1.5 seconds
        } catch (err) {
            if (err.message === 'Un Flow avec ce nom existe déjà') {
                setStatus('error_same_name');
            } else {
                setStatus('error');
            }
        }
    };

    // opens a file explorer window through Electron, and injects the selected path into the form
    const handleSourceDirSelection = async () => {
        const result = await window.electronAPI.selectDirectory();
        if (result !== null) {
            setForm(prev => ({ ...prev, source_dir: result }))
        }
    };

    const handleDestDirSelection = async () => {
        const result = await window.electronAPI.selectDirectory();
        if (result !== null) {
            setForm(prev => ({ ...prev, dest_dir: result }));
        }
    };


    return (
        <div className="w-full bg-neutral-200 text-black flex flex-col p-4">
            <div className="max-w-xl w-full mx-auto mt-5 bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6">
                <h1 className="text-2xl font-semibold mb-4">Nouveau Flow</h1>
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-neutral-700">Nom du Flow</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Ex: Factures mensuelles"
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-neutral-700">Dossier source</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="source_dir"
                            value={form.source_dir}
                            onChange={handleChange}
                            placeholder="C:\Documents\Source"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSourceDirSelection}
                            className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Parcourir les dossiers">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.31c-.195 0-.387-.078-.531-.22Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-neutral-700">Dossier destination</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="dest_dir"
                            value={form.dest_dir}
                            onChange={handleChange}
                            placeholder="C:\Documents\PDF"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleDestDirSelection}
                            className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Parcourir les dossiers">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.31c-.195 0-.387-.078-.531-.22Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <hr className="border-neutral-300" />
                <div className="flex flex-col gap-3">
                    <p className="text-xl font-semibold text-neutral-700">Règles de conversion</p>
                    <div className="max-w-xl w-full mx-auto bg-neutral-100 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-neutral-700">Déclenchement automatique</p>
                            <p className="text-sm text-neutral-500">Convertir automatiquement les nouveaux fichiers</p>
                        </div>
                        <button
                            // toggle : keeps the values of the other fields with the spread operator, and inverts the value of the auto_trigger boolean ; help from AI
                            onClick={() => setForm(prev => ({ ...prev, auto_trigger: !prev.auto_trigger }))}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.auto_trigger ? 'bg-blue-500' : 'bg-neutral-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.auto_trigger ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    <div className="max-w-xl w-full mx-auto bg-neutral-100 rounded-2xl p-4 flex flex-col gap-6">
                        <p className="font-semibold text-neutral-700">Types de fichiers</p>
                        {[
                            { name: 'convert_docx', label: 'Fichiers Word (.docx)' },
                            { name: 'convert_xlsx', label: 'Fichiers Excel (.xlsx)' },
                        // uses .map() to create a checkbox for each of the 2 options
                        ].map(option => (
                            // uses option.name as unique key
                            <label key={option.name} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name={option.name}
                                    checked={form[option.name]}
                                    onChange={handleChange}
                                    className="mt-0.5 accent-blue-500 w-4 h-4"
                                    />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{option.label}</p>
                            </div>
                            </label>
                        ))}
                    </div>
                    <hr className="border-neutral-300" />
                    {/* conditional rendering according to the status */}
                    {status === 'success' && (
                    <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                        Flow créé avec succès.
                    </p>
                    )}
                    {status === 'error' && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            Erreur lors de la création — vérifiez les champs.
                        </p>
                    )}
                    {status === 'error_no_format' && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            Veuillez sélectionner au moins un format de fichier.
                        </p>
                    )}
                    {status === 'error_same_name' && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            Un Flow avec ce nom existe déjà.
                        </p>
                    )}
                    {status === 'error_invalid_folder' && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            Dossiers sélectionnés invalides — vérifiez les champs.
                        </p>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setCurrentPage('flows')}
                            className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold py-3 rounded-lg transition-colors">
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors">
                            Créer le flow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}