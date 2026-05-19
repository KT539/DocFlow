/**
 * @file            src/App.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   19-05-2026
 */


import { useState } from 'react';
import Nav from './components/nav.jsx';
import Flows from './pages/flows.jsx';
import NewFlows from './pages/new_flows.jsx';
import UpdateFlows from './pages/update_flows.jsx';
import FlowHistory from './pages/history.jsx';
import Settings from './pages/settings.jsx';


export default function App() {
    const [currentPage, setCurrentPage] = useState('flows');
    const [navCollapsed, setNavCollapsed] = useState(false);
    const [selectedFlowId, setSelectedFlowId] = useState(null);

    // switch case to render the pages with conditional rendering
    const renderPage = () => {
        switch (currentPage) {
            case 'flows': return <Flows setCurrentPage={setCurrentPage} setSelectedFlowId={setSelectedFlowId} />; // gives props to my components
            case 'new_flows': return <NewFlows setCurrentPage={setCurrentPage} />; 
            case 'update_flows': return <UpdateFlows setCurrentPage={setCurrentPage} flowId={selectedFlowId} />
            case 'history': return <FlowHistory flowId={selectedFlowId} setCurrentPage={setCurrentPage} />;
            case 'settings': return <Settings />;
            default: return <Flows />;
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-gray-200">
            <Nav 
                setCurrentPage={setCurrentPage} // props so the menu can change pages and collapse the navbar
                activePage={currentPage} 
                collapsed={navCollapsed}
            setCollapsed={setNavCollapsed}
            />
            <main className="flex-1 p-6 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
}