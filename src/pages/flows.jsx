/**
 * @file            src/pages/flows.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


import { useState, useEffect } from 'react';

export default function Flows() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFlows = async () => {
        try {
            const res = await fetch('/api/flows.php');
            const data = await res.json();
            // return a single object or an array ; syntax from AI
            setFlows(Array.isArray(data) ? data : (data ? [data] : []));
        } catch (err) {
            console.error("Erreur lors du chargement des Flows :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFlows(); }, []);

    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce Flow ?")) return;
        await fetch(`/api/flows.php?id=${id}`, { method: 'DELETE' });
        fetchFlows();
    };

    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-semibold mb-3">Mes Flows</h1>
            <p className="text xl text-neutral-500 mb-8">Gérez vos flux de conversion de documents</p>

            {loading ? (
                <p className="text-neutral-500">Chargement...</p>
            ) : (
                <div className="grid gap-6">
                    {flows.length === 0 && (
                        <p className="text-neutral-700 italic">Aucun flow configuré.</p>
                    )}
                    
                    {flows.map(flow => (
                        <div key={flow.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="p-6">
                                
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-semibold text-neutral-700">{flow.name}</h2>
                                        {flow.auto_trigger ===1 && (
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium border border-blue-200">
                                                Auto
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-neutral-500 hover:text-neutral-600 transition-colors" title="Mettre à jour">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleDelete(flow.id)} className="p-2 text-red-500 hover:text-red-600 transition-colors" title="Supprimer">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-3">
                                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                                        <span>Source :</span>
                                        <span>{flow.source_dir}</span>
                                    </p>
                                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                                        <span>Destination :</span>
                                        <span>{flow.dest_dir}</span>
                                    </p>
                                </div>

                                <hr className="border-neutral-200 mb-5" />

                                <div className="flex justify-between items-center text-neutral-600 text-sm">
                                    <div className="flex gap-6 items-center">
                                        <span>{flow.last_run || 'Jamais utilisé'}</span>
                                        <span>Types : {[flow.convert_docx && 'docx', flow.convert_xlsx && 'xlsx'].filter(Boolean).join(', ')}</span>
                                        <span>Conversions : {flow.count || 0}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="bg-neutral-200 text-neutral-700 px-4 py-1.5 rounded-lg hover:bg-neutral-300 transition-colors text-sm" title="Détails">
                                            Voir détails
                                        </button>
                                        <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm" title="Exécuter">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                            Exécuter
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}