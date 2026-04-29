/**
 * @file            src/nav.jsx
 * @project         DocFlow
 * @author          Kilian Testard
 * @project_lead    Pascal Hurni
 * @last_modified   27-04-2026
 */


export default function Nav({ setCurrentPage, activePage, collapsed, setCollapsed }) {
  return (
    <nav className={`min-h-screen bg-neutral-800 flex flex-col border-r border-neutral-700 transition-all duration-300 ${collapsed ? 'w-16 p-2' : 'w-72 p-6'}`}>
      <div className="mb-6 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DocFlow</h1>
            <p className="text-neutral-400 text-xs uppercase mt-1">Automatisation de conversion</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-neutral-400 hover:text-white transition-colors ml-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
          </svg>
        </button>
      </div>

      <hr className="border-t border-neutral-400 mb-5" />

      <div className="flex flex-col gap-4 flex-1">
        
        <button 
          onClick={() => setCurrentPage('new_flows')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
          <span className="text-xl">+</span>
          {!collapsed && 'Nouveau Flow'}
        </button>

        <div className="mt-4 flex flex-col gap-1">
          <button 
            onClick={() => setCurrentPage('flows')}
            className={`w-full text-left py-2.5 px-4 rounded-md transition-all duration-200 flex gap-3
            ${activePage === 'flows' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            {!collapsed && 'Mes Flows'}
          </button>

          <button 
            onClick={() => setCurrentPage('settings')}
            className={`w-full text-left py-2.5 px-4 rounded-md transition-all duration-200 flex gap-3
            ${activePage === 'settings' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {!collapsed && 'Paramètres'}
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <hr className="border-t border-neutral-400 mb-5" />
        <p className="text-neutral-400 text-[10px]">
          version 1.0.0
        </p>
      </div>
    </nav>
  );
}