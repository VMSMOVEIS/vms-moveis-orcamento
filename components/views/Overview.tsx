import React from 'react';
import { Card, Button } from '../UIComponents';
import { ProjectStats, SavedProposal } from '../../types';
import { PlusIcon, CalculatorIcon, FolderIcon } from '../Icons';

interface OverviewProps {
  stats: ProjectStats;
  savedProposals: SavedProposal[];
  onStartNew: () => void;
  onNavigate: (view: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ stats, savedProposals, onStartNew, onNavigate }) => {
  const recentProposals = savedProposals.slice(0, 3);
  
  // Stats Breakdown
  const totalCompleted = savedProposals.filter(p => p.status === 'Concluído').length;
  const totalInProgress = savedProposals.filter(p => p.status === 'Em andamento').length;
  const totalSent = savedProposals.filter(p => p.status === 'Enviado').length;
  const totalWaiting = savedProposals.filter(p => p.status === 'Aguardando aprovação').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Panel 1: Last 3 Proposals */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-lg shadow-blue-100/50 p-6">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
             Últimos Orçamentos
           </h3>
           <button onClick={() => onNavigate('proposals')} className="text-sm text-indigo-600 font-medium hover:underline">Ver todos</button>
        </div>
        
        <div className="space-y-3">
          {recentProposals.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm bg-white rounded-xl border border-blue-100">
              Nenhum orçamento salvo ainda.
            </div>
          ) : (
            recentProposals.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-indigo-50 transition-colors border border-blue-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-slate-400 border border-blue-100">
                      <FolderIcon className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-700">{p.projectName}</p>
                      <p className="text-xs text-slate-500">{p.number} • {p.clientName}</p>
                   </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">R$ {p.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border
                      ${p.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        p.status === 'Em andamento' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        p.status === 'Enviado' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {p.status}
                    </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel 2: Start New Budget (Blue Action Area) */}
      <button 
        type="button"
        onClick={onStartNew}
        className="w-full group relative overflow-hidden rounded-2xl bg-[#002B55] text-white p-8 shadow-xl shadow-slate-200 hover:shadow-2xl transition-all duration-300 text-left"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 rotate-12 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
             <CalculatorIcon className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <PlusIcon className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-1">Iniciar Novo Orçamento</h2>
                <p className="text-slate-300 text-sm max-w-md">
                    Limpar a área de trabalho atual e começar um novo projeto do zero, adicionando peças, componentes e mão de obra.
                </p>
            </div>
            <div className="mt-2 bg-white text-[#002B55] px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm group-hover:bg-indigo-50 transition-colors pointer-events-none">
                Começar Agora
            </div>
        </div>
      </button>

      {/* Panel 3: Status Report */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-lg shadow-blue-100/50 p-6">
         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
             Resumo de Status
         </h3>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-4 rounded-xl bg-white border border-blue-100 flex flex-col items-center text-center shadow-sm">
                 <span className="text-2xl font-bold text-emerald-700">{totalCompleted}</span>
                 <span className="text-xs font-medium text-emerald-600 mt-1">Concluídos</span>
             </div>
             <div className="p-4 rounded-xl bg-white border border-blue-100 flex flex-col items-center text-center shadow-sm">
                 <span className="text-2xl font-bold text-blue-700">{totalInProgress}</span>
                 <span className="text-xs font-medium text-blue-600 mt-1">Em Andamento</span>
             </div>
             <div className="p-4 rounded-xl bg-white border border-blue-100 flex flex-col items-center text-center shadow-sm">
                 <span className="text-2xl font-bold text-amber-700">{totalSent}</span>
                 <span className="text-xs font-medium text-amber-600 mt-1">Enviados</span>
             </div>
             <div className="p-4 rounded-xl bg-white border border-blue-100 flex flex-col items-center text-center shadow-sm">
                 <span className="text-2xl font-bold text-slate-700">{totalWaiting}</span>
                 <span className="text-xs font-medium text-slate-500 mt-1">Aguardando</span>
             </div>
         </div>
      </div>

    </div>
  );
};