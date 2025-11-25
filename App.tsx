
import React, { useState, useEffect } from 'react';
import { useBudgetStore } from './hooks/useBudgetStore';
import { useSilentFirebaseSync } from './hooks/useSilentFirebaseSync';
import { Overview } from './components/views/Overview';
import { Pieces } from './components/views/Pieces';
import { Materials } from './components/views/Materials';
import { Pricing } from './components/views/Pricing';
import { Database } from './components/views/Database';
import { Settings } from './components/views/Settings';
import { Proposals } from './components/views/Proposals';
import { HomeIcon, BoxIcon, HammerIcon, CalculatorIcon, DatabaseIcon, SettingsIcon, MenuIcon, FolderIcon } from './components/Icons';

const Toast = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
    <div className={`fixed top-5 right-5 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up ${
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
    }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white/20`}>
            {type === 'success' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
               </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
        </div>
        <span className="font-medium">{message}</span>
    </div>
);

function App() {
  const store = useBudgetStore();
  const [currentView, setCurrentView] = useState<'overview' | 'pieces' | 'materials' | 'pricing' | 'database' | 'settings' | 'proposals'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0); // Key to force reset of child components

  // Sincronizar propostas com Firebase em background (silencioso)
  useSilentFirebaseSync(store.savedProposals);

  const menuItems = [
    { id: 'overview', label: 'Página Inicial', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'pieces', label: 'Peças e Componentes', icon: <BoxIcon className="w-5 h-5" /> },
    { id: 'pricing', label: 'Precificação', icon: <CalculatorIcon className="w-5 h-5" /> },
    { id: 'proposals', label: 'Propostas Salvas', icon: <FolderIcon className="w-5 h-5" /> },
    { id: 'materials', label: 'Cadastros', icon: <HammerIcon className="w-5 h-5" /> },
    { id: 'database', label: 'Banco de Dados', icon: <DatabaseIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const getTitle = () => {
      const item = menuItems.find(i => i.id === currentView);
      return item ? item.label : 'Dashboard';
  }

  const handleViewChange = (view: any) => {
      setCurrentView(view);
      setIsSidebarOpen(false); // Close drawer on mobile when item clicked
  };

  const handleStartNew = () => {
      // Executa diretamente sem confirmação para evitar bloqueios do navegador
      store.resetProject(); // Clear store data
      setResetKey(prev => prev + 1); // Trigger form clear in Pricing
      setCurrentView('pieces'); // Force redirect to Pieces
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 relative overflow-hidden">
      
      {/* Notification Toast */}
      {store.notification && (
          <Toast message={store.notification.message} type={store.notification.type} />
      )}

      {/* Background Gradient Decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 via-purple-100/30 to-transparent pointer-events-none z-0"></div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
            fixed md:relative z-50 h-full w-72 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="p-8 mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <CalculatorIcon className="w-5 h-5" />
            </div>
            VMS <span className="text-indigo-400">SYSTEMS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium tracking-wide uppercase pl-10">Sistema de Orçamento</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group relative
                ${currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <span className={`transition-opacity ${currentView === item.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              {item.label}
              {currentView === item.id && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/50"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Projeto Atual</p>
              <div className="text-sm font-medium text-white flex justify-between items-center">
                <span>R$ {store.stats.salesPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-emerald-400 text-xs bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">Venda</span>
              </div>
          </div>
          <div className="text-center text-[10px] text-slate-600 mt-4">
            &copy; 2024 VMS SYSTEMS v1.0
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur text-white z-30 px-4 py-3 flex justify-between items-center shadow-md border-b border-slate-800">
         <span className="font-bold flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <CalculatorIcon className="w-3 h-3" />
            </div>
            VMS SYSTEMS
         </span>
         <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
         >
            <MenuIcon className="w-6 h-6 text-slate-300" />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 mt-14 md:mt-0 overflow-y-auto h-screen relative z-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
          
          {/* Dynamic Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{getTitle()}</h2>
              <p className="text-slate-500 mt-1 text-sm md:text-base">Gerencie os detalhes e maximize seus lucros.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-200">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    Sistema Online
                </span>
            </div>
          </div>

          {/* Views */}
          <div className="animate-fade-in-up">
            {currentView === 'overview' && (
                <Overview 
                  stats={store.stats} 
                  savedProposals={store.savedProposals}
                  onStartNew={handleStartNew} 
                  onNavigate={setCurrentView}
                />
            )}

            {currentView === 'pieces' && (
                <Pieces 
                materials={store.materials}
                pieces={store.pieces}
                projectComponents={store.projectComponents}
                fixedComponents={store.fixedComponents}
                allComponents={store.materials} 
                onAddPiece={store.addPiece}
                onUpdatePiece={store.updatePiece}
                onRemovePiece={store.removePiece}
                onAddComponent={store.addProjectComponent}
                onUpdateComponent={store.updateProjectComponent}
                onRemoveComponent={store.removeProjectComponent}
                onAddFixedComponent={store.addFixedComponent}
                onUpdateFixedComponent={store.updateFixedComponent}
                onRemoveFixedComponent={store.removeFixedComponent}
                />
            )}

            {currentView === 'materials' && (
                <Materials 
                materials={store.materials}
                onAdd={store.addMaterial}
                onUpdate={store.updateMaterial}
                onRemove={store.removeMaterial}
                />
            )}

            {currentView === 'pricing' && (
                <Pricing 
                settings={store.settings}
                stats={store.stats}
                categories={store.categories}
                cardRates={store.cardRates}
                additionalServices={store.additionalServices}
                resetKey={resetKey}
                currentProposalData={store.currentProposalData} // Pass the loaded data
                onUpdateSettings={store.updateSettings}
                onAddService={store.addAdditionalService}
                onRemoveService={store.removeAdditionalService}
                onSaveProposal={store.saveProposal}
                savedProposals={store.savedProposals}
                // Pass data for BOM generation
                materials={store.materials}
                pieces={store.pieces}
                projectComponents={store.projectComponents}
                fixedComponents={store.fixedComponents}
                />
            )}

            {currentView === 'proposals' && (
                <Proposals
                    proposals={store.savedProposals}
                    onLoad={(id) => {
                        if (store.loadProposal(id)) {
                            setCurrentView('pricing');
                        }
                    }}
                    onDelete={store.deleteProposal}
                    onUpdateStatus={store.updateProposalStatus}
                    onUpdateMetadata={store.updateSavedProposalMetaData}
                />
            )}

            {currentView === 'database' && (
                <Database 
                categories={store.categories}
                labor={store.labor}
                fixedCosts={store.fixedCosts}
                cardRates={store.cardRates}
                settings={store.settings}
                stats={store.stats}
                projectComponents={store.projectComponents}
                fixedComponents={store.fixedComponents}
                onAddCategory={store.addCategory}
                onUpdateCategory={store.updateCategory}
                onRemoveCategory={store.removeCategory}
                onAddLabor={store.addLabor}
                onUpdateLabor={store.updateLabor}
                onRemoveLabor={store.removeLabor}
                onAddFixedCost={store.addFixedCost}
                onUpdateFixedCost={store.updateFixedCost}
                onRemoveFixedCost={store.removeFixedCost}
                onAddCardRate={store.addCardRate}
                onUpdateCardRate={store.updateCardRate}
                onRemoveCardRate={store.removeCardRate}
                onUpdateSettings={store.updateSettings}
                />
            )}

            {currentView === 'settings' && (
                <Settings 
                settings={store.settings}
                onUpdateSettings={store.updateSettings}
                />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
