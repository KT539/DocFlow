/**
 * @file            src/pages/new_flows.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        setStatus(null);
        try {
            const res = await fetch('/api/flows.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus('success');
            setForm({ name: '', source_dir: '', dest_dir: '', auto_trigger: false, convert_docx: true, convert_xlsx: true });
        } catch (err) {
            setStatus('error');
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
                    <input
                        type="text"
                        name="source_dir"
                        value={form.source_dir}
                        onChange={handleChange}
                        placeholder="C:\Documents\Source"
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-neutral-700">Dossier destination</label>
                    <input
                        type="text"
                        name="dest_dir"
                        value={form.dest_dir}
                        onChange={handleChange}
                        placeholder="C:\Documents\PDF"
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                        ].map(option => (
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
                    {status === 'success' && (
                    <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                        Flow créé avec succès
                    </p>
                    )}
                    {status === 'error' && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            Erreur lors de la création — vérifiez les champs
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