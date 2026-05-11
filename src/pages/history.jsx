/**
 * @file            src/pages/history.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   07-05-2026
 */


import { useState, useEffect } from 'react';
import ModalProgress from '../components/ModalProgress.jsx';

export default function FlowHistory({ flowId, setCurrentPage }) {
    const [flow, setFlow] = useState(null);
    const [conversions, setConversions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executingFlowId, setExecutingFlowId] = useState(null);


    useEffect(() => {
        if (!flowId) {
            return;
        };

        const fetchData = async () => {
            try {
                // fetches flow data
                const resFlow = await fetch(`/api/flows.php?id=${flowId}`);
                const flowData = await resFlow.json();
                setFlow(flowData);

                // fetches conversions for that flow
                const resConv = await fetch(`/api/conversions.php?flow_id=${flowId}`);
                const convData = await resConv.json();
                setConversions(convData);
            } catch (err) {
                console.error("Erreur lors du chargement de l'historique :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [flowId]); // the hook is executed when the page is created, and then again if the flowId is modified

    const stats = {
        total: conversions.length,
        success: conversions.filter(conversions => conversions.status === 'SUCCESS').length,
        error: conversions.filter(conversions => conversions.status === 'ERROR').length
    };

    if (loading) return <p className="p-8 text-neutral-500">Chargement de l'historique...</p>;
    if (!flow) return <p className="p-8 text-red-500">Flow introuvable.</p>;

    
    return (
        <div className="p-8">
            <button 
                onClick={() => setCurrentPage('flows')}
                className="flex items-center gap-2 mb-4 text-neutral-600 hover:text-neutral-800 transition-colors font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                Retour
            </button>
            
            <div className="bg-white rounded-xl p-8 space-y-6 mb-8 shadow-sm border border-neutral-200 overflow-hidden">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-semibold text-neutral-700">{flow.name}</h1>
                    <button 
                        onClick={() => setExecutingFlowId(flow.id)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm" title="Exécuter">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        Exécuter maintenant
                    </button>
                </div>

                <div className="space-y-1">
                    <p className="text-neutral-500 flex items-center gap-2">
                        <span>Source :</span> {flow.source_dir}
                    </p>
                    <p className="text-neutral-500 flex items-center gap-2">
                        <span>Destination :</span> {flow.dest_dir}
                    </p>
                </div>

                <hr className="border-neutral-200" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center">
                        <p className="text-2xl font-semibold text-neutral-700">{stats.total}</p>
                        <p className="text-sm text-neutral-500 tracking-widest mt-1">Total conversions</p>
                    </div>
                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 text-center">
                        <p className="text-2xl font-semibold text-green-700">{stats.success}</p>
                        <p className="text-sm text-green-500 tracking-widest mt-1">Réussies</p>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 text-center">
                        <p className="text-2xl font-semibold text-red-700">{stats.error}</p>
                        <p className="text-sm text-red-500 tracking-widest mt-1">Échouées</p>
                    </div>
                </div>
            </div>
                
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-4 mt-3">
                    <h2 className="text-xl font-semibold text-neutral-700">Historique des conversions</h2>
                </div>
                <div className="p-4 space-y-4">
                    {conversions.length === 0 ? (
                        <p className="text-center py-8 text-neutral-500 italic">Aucune conversion enregistrée pour ce flow.</p>
                    ) : (
                        conversions.map((conv) => (
                            <div 
                                key={conv.id} 
                                className={`p-4 rounded-lg border flex flex-col gap-2 ${
                                    conv.status === 'SUCCESS' ? 'bg-green-50/50 border-green-100' : conv.status === 'SKIPPED' ? 'bg-neutral-50/50 border-neutral-100' : 'bg-red-50/50 border-red-100'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {conv.status === 'SUCCESS' ? (
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : conv.status === 'SKIPPED' ? (
                                            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6L14.6 7.2A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        <span className="font-semibold text-neutral-700">{conv.filename}</span>
                                        {conv.trigger_type === 'AUTO' && (
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium border border-blue-200">{conv.trigger_type}</span>
                                        )}
                                    </div>
                                    <span className="text-sm text-neutral-500">
                                        {new Date(conv.converted_at).toLocaleString('fr-CH')}
                                    </span>
                                </div>
                                {conv.status === 'ERROR' && (
                                    <p className="text-xs text-red-600 font-medium ml-8">
                                        {conv.error_msg || "Erreur inconnue lors de la conversion"}
                                    </p>
                                )}

                                <div className="ml-8 space-y-1">
                                    <p className="text-sm text-neutral-500">Source: {flow.source_dir}\{conv.filename}</p>
                                    <p className="text-sm text-neutral-500">
                                        Destination: {flow.dest_dir}\{conv.filename.split('.')[0]}.pdf
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {/* progression modal */}
            {executingFlowId && (
                <ModalProgress
                    flowId={executingFlowId}
                    onClose={() => { setExecutingFlowId(null); fetchFlows(); }} // onClose() resets the executingFlowId state, and fetches the Flows
                />
            )}
        </div>
    );
}