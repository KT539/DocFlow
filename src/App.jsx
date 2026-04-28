/**
 * @file            src/App.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


import { useState } from 'react';
import Nav from './nav.jsx';
import Flows from './pages/flows.jsx';
import NewFlows from './pages/new_flows.jsx';
import Settings from './pages/settings.jsx';


export default function App() {
  const [currentPage, setCurrentPage] = useState('flows');
  const [navCollapsed, setNavCollapsed] = useState(false);

  // switch case to render the pages
  const renderPage = () => {
    switch (currentPage) {
      case 'flows': return <Flows />;
      case 'new_flows': return <NewFlows />;
      case 'settings': return <Settings />;
      default: return <Flows />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-200">
      <Nav 
        setCurrentPage={setCurrentPage} 
        activePage={currentPage} 
        collapsed={navCollapsed}
        setCollapsed={setNavCollapsed}
      />
      <main className="flex-1 p-6">
        {renderPage()}
      </main>
    </div>
  );
}