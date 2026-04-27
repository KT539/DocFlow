/**
 * @file            App.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


import React, { useState } from 'react';
import Nav from './nav.jsx';
import Home from './pages/home.jsx';


export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // switch case to render the pages
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      default: return <Home />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Nav setCurrentPage={setCurrentPage} activePage={currentPage} />
      <main className="flex-1 p-6">
        {renderPage()}
      </main>
    </div>
  );
}