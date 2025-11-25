import React, { useState } from 'react';
import { Card, Input, Button, Badge, Select } from '../UIComponents';
import { TrashIcon, PencilIcon, BoxIcon, CalculatorIcon, XIcon, FolderIcon, DollarSignIcon } from '../Icons';
import { SavedProposal, ProjectStats, ProposalStatus } from '../../types';
import { createProposalDocument } from '../../utils/pdfGenerator';

interface ProposalsProps {
  proposals: SavedProposal[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ProposalStatus) => void;
  onUpdateMetadata: (id: string, updates: Partial<SavedProposal>) => void;
}

export const Proposals: React.FC<ProposalsProps> = ({ proposals, onLoad, onDelete, onUpdateStatus, onUpdateMetadata }) => {
  const [search, setSearch] = useState('');
  
  // PDF Preview States
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<SavedProposal | null>(null);

  // Edit Metadata States
  const [editingProposal, setEditingProposal] = useState<SavedProposal | null>(null);
  const [editForm, setEditForm] = useState({ 
      clientName: '', 
      projectName: '', 
      clientPhone: '', 
      validityDays: '', 
      serviceDescription: '',
      warrantyTime: '',
      deliveryTime: '',
      paymentCondition: ''
  });
  
  // Financial Edit State
  const [financialForm, setFinancialForm] = useState({
      materialCost: 0,
      fabCost: 0,
      finalPrice: 0
  });

  const filteredProposals = proposals.filter(p => 
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.number.includes(search)
  );

  const fmtMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (isoString: string) => new Date(isoString).toLocaleDateString('pt-BR');

  const handleLoad = (id: string) => {
      if (confirm('Atenção: Carregar esta proposta substituirá todas as peças e configurações da área de trabalho atual. Deseja continuar?')) {
          onLoad(id);
      }
  };

  const handleEditMetadata = (p: SavedProposal) => {
      setEditingProposal(p);
      setEditForm({
          clientName: p.clientName,
          projectName: p.projectName,
          clientPhone: p.clientPhone || '',
          validityDays: p.validityDays || '15',
          serviceDescription: p.serviceDescription || '',
          warrantyTime: p.warrantyTime || '90 dias',
          deliveryTime: p.deliveryTime || '20 dias úteis',
          paymentCondition: p.paymentCondition || 'Sinal 50%'
      });

      // Initialize Financials
      const stats = p.data.stats;
      if (stats) {
          const matCost = (stats.totalMaterialCost || 0) + (stats.totalTapeCost || 0) + (stats.totalComponentCost || 0);
          const fabCost = (stats.totalLaborCost || 0) + (stats.totalFixedCost || 0) + (stats.totalAdditionalServicesCost || 0) + (p.data.settings.extraHours || 0);
          
          setFinancialForm({
              materialCost: matCost,
              fabCost: fabCost,
              finalPrice: p.finalValue
          });
      }
  };

  const saveMetadata = () => {
      if(editingProposal && editingProposal.data.stats) {
          // 1. Calculate New Stats based on manual overrides
          const oldStats = editingProposal.data.stats;
          
          // Reverse engineer the components to apply the delta
          const currentMatTotal = (oldStats.totalMaterialCost || 0) + (oldStats.totalTapeCost || 0) + (oldStats.totalComponentCost || 0);
          const matDelta = Number(financialForm.materialCost) - currentMatTotal;
          // Apply delta to main material bucket
          const newTotalMaterialCost = (oldStats.totalMaterialCost || 0) + matDelta;

          const currentFabTotal = (oldStats.totalLaborCost || 0) + (oldStats.totalFixedCost || 0) + (oldStats.totalAdditionalServicesCost || 0) + (editingProposal.data.settings.extraHours || 0);
          const fabDelta = Number(financialForm.fabCost) - currentFabTotal;
          // Apply delta to fixed cost bucket (as generic overhead)
          const newTotalFixedCost = (oldStats.totalFixedCost || 0) + fabDelta;

          const newFinalCost = Number(financialForm.materialCost) + Number(financialForm.fabCost);
          const newSalesPrice = Number(financialForm.finalPrice);

          // Recalculate Profit & Margins
          // Rate Logic: discountValue = salesPrice * (rate12x / 100)
          const rate12x = editingProposal.data.cardRates?.find((r:any) => r.installments === 12)?.rate || 0;
          const discountValue = newSalesPrice * (rate12x / 100);
          const netRevenue = newSalesPrice - discountValue;
          const newProfit = netRevenue - newFinalCost;
          
          const newMargin = newSalesPrice > 0 ? (newProfit / newSalesPrice) * 100 : 0;
          const newRoi = newFinalCost > 0 ? (newProfit / newFinalCost) * 100 : 0;

          const newStats: ProjectStats = {
              ...oldStats,
              totalMaterialCost: newTotalMaterialCost, // Adjusted
              totalFixedCost: newTotalFixedCost,       // Adjusted
              finalCost: newFinalCost,
              salesPrice: newSalesPrice,
              profit: newProfit,
              discountValue: discountValue,
              realizedMargin: newMargin,
              roi: newRoi
          };

          // 2. Save Everything
          onUpdateMetadata(editingProposal.id, {
              clientName: editForm.clientName,
              projectName: editForm.projectName,
              clientPhone: editForm.clientPhone,
              validityDays: editForm.validityDays,
              serviceDescription: editForm.serviceDescription,
              warrantyTime: editForm.warrantyTime,
              deliveryTime: editForm.deliveryTime,
              paymentCondition: editForm.paymentCondition,
              finalValue: newSalesPrice, // Update top-level value
              data: {
                  ...editingProposal.data,
                  stats: newStats
              }
          });
          setEditingProposal(null);
      }
  };

  const handleViewPDF = (proposal: SavedProposal) => {
      // For older proposals without saved stats, we can't generate the PDF reliably without reloading the whole project
      if (!proposal.data.stats || !proposal.data.cardRates) {
          alert('Esta é uma proposta antiga e não possui dados suficientes para visualização rápida. Por favor, use o botão "Abrir" para carregar e gerar o PDF novamente.');
          return;
      }

      try {
          const doc = createProposalDocument(
              proposal.data.stats,
              proposal.data.cardRates,
              proposal.data.settings,
              proposal.clientName,
              proposal.clientPhone || '',
              proposal.projectName,
              proposal.data.additionalServices || [], // Protection against undefined in older saves
              proposal.serviceDescription || '',
              proposal.validityDays || '15',
              proposal.warrantyTime,
              proposal.deliveryTime,
              proposal.paymentCondition,
              proposal.images,
              false, // Include contract not supported in quick view yet
              proposal.number
          );

          const blob = doc.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setSelectedProposal(proposal);
          setShowPreview(true);
      } catch (e) {
          console.error("Error generating PDF preview", e);
          alert('Erro ao gerar visualização do documento.');
      }
  };

  const handleClosePreview = () => {
      setShowPreview(false);
      if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setSelectedProposal(null);
      }
  };

  const handleOpenNewTab = () => {
      if (pdfUrl) {
          window.open(pdfUrl, '_blank');
      }
  };

  const handleDownloadPDF = () => {
       if (pdfUrl && selectedProposal) {
             try {
                const doc = createProposalDocument(
                    selectedProposal.data.stats,
                    selectedProposal.data.cardRates,
                    selectedProposal.data.settings,
                    selectedProposal.clientName,
                    selectedProposal.clientPhone || '',
                    selectedProposal.projectName,
                    selectedProposal.data.additionalServices || [],
                    selectedProposal.serviceDescription || '',
                    selectedProposal.validityDays || '15',
                    selectedProposal.warrantyTime,
                    selectedProposal.deliveryTime,
                    selectedProposal.paymentCondition,
                    selectedProposal.images,
                    false,
                    selectedProposal.number
                );
                doc.save(`Proposta_${selectedProposal.clientName.replace(/\s+/g, '_')}_${selectedProposal.number}.pdf`);
            } catch (e) { console.error(e) }
       }
  };

  // Helper to extract costs safely
  const getMaterialCost = (p: SavedProposal) => {
      if(!p.data.stats) return 0;
      return (p.data.stats.totalMaterialCost || 0) + 
             (p.data.stats.totalTapeCost || 0) + 
             (p.data.stats.totalComponentCost || 0);
  };

  const getFabCost = (p: SavedProposal) => {
      if(!p.data.stats) return 0;
      return (p.data.stats.totalLaborCost || 0) + 
             (p.data.stats.totalFixedCost || 0) + 
             (p.data.stats.totalAdditionalServicesCost || 0) +
             (p.data.settings.extraHours || 0);
  };

  const statusOptions: ProposalStatus[] = ['Aguardando aprovação', 'Em andamento', 'Enviado', 'Concluído'];
  const getStatusColor = (status: ProposalStatus) => {
      switch(status) {
          case 'Concluído': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
          case 'Em andamento': return 'text-blue-700 bg-blue-50 border-blue-200';
          case 'Enviado': return 'text-amber-700 bg-amber-50 border-amber-200';
          default: return 'text-slate-700 bg-slate-50 border-slate-200';
      }
  }

  return (
    <div className="space-y-6 relative">
        {/* PDF Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Visualizar Documento</h3>
                        <p className="text-xs text-slate-500">Proposta #{selectedProposal?.number} - {selectedProposal?.clientName}</p>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={handleOpenNewTab} className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                            Nova Aba
                        </button>
                        <button onClick={handleClosePreview} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <XIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-200/50 p-4 overflow-hidden flex justify-center relative">
                     {pdfUrl ? (
                        <object data={pdfUrl} type="application/pdf" className="w-full h-full rounded-lg shadow-sm bg-white border border-slate-200">
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-10 text-center">
                                <p className="mb-4">Visualização indisponível no iframe.</p>
                                <button onClick={handleOpenNewTab} className="text-indigo-600 underline font-bold">
                                    Abrir PDF
                                </button>
                            </div>
                        </object>
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-400">Carregando...</div>
                     )}
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button onClick={handleClosePreview} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">
                        Fechar
                    </button>
                    <button onClick={handleDownloadPDF} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                         <span>Baixar Arquivo</span>
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Full Document Edit Modal */}
      {editingProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">Editar Detalhes e Valores</h3>
                        <p className="text-sm text-slate-500">Ajuste os valores financeiros ou dados do documento manualmente.</p>
                    </div>
                    <button onClick={() => setEditingProposal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XIcon className="w-6 h-6 text-slate-500"/></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* Financials Section */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8">
                         <h4 className="text-sm uppercase tracking-wide text-indigo-800 font-bold mb-4 flex items-center gap-2">
                            <DollarSignIcon className="w-4 h-4" /> Valores Financeiros (Substituição Manual)
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input 
                                label="Custo Materiais (R$)" 
                                type="number" 
                                value={financialForm.materialCost} 
                                onChange={e => setFinancialForm({...financialForm, materialCost: Number(e.target.value)})} 
                                className="font-mono"
                            />
                            <Input 
                                label="Custo Fabricação (R$)" 
                                type="number" 
                                value={financialForm.fabCost} 
                                onChange={e => setFinancialForm({...financialForm, fabCost: Number(e.target.value)})} 
                                className="font-mono"
                            />
                            <div>
                                <Input 
                                    label="Preço Final (R$)" 
                                    type="number" 
                                    value={financialForm.finalPrice} 
                                    onChange={e => setFinancialForm({...financialForm, finalPrice: Number(e.target.value)})} 
                                    className="font-bold text-indigo-700 border-indigo-300 focus:border-indigo-500"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">*O lucro será recalculado automaticamente.</p>
                            </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Client & Project */}
                        <div className="space-y-5">
                            <h4 className="text-sm uppercase tracking-wide text-slate-600 font-bold border-b border-slate-200 pb-2">Dados Principais</h4>
                            <Input label="Nome do Cliente" value={editForm.clientName} onChange={e => setEditForm({...editForm, clientName: e.target.value})} />
                            <Input label="Telefone" value={editForm.clientPhone} onChange={e => setEditForm({...editForm, clientPhone: e.target.value})} />
                            <Input label="Nome do Projeto" value={editForm.projectName} onChange={e => setEditForm({...editForm, projectName: e.target.value})} />
                            <Input label="Validade da Proposta (Dias)" value={editForm.validityDays} onChange={e => setEditForm({...editForm, validityDays: e.target.value})} />
                        </div>

                        {/* Column 2: Terms & Conditions */}
                        <div className="space-y-5">
                            <h4 className="text-sm uppercase tracking-wide text-slate-600 font-bold border-b border-slate-200 pb-2">Termos e Condições</h4>
                            <Input label="Tempo de Garantia" value={editForm.warrantyTime} onChange={e => setEditForm({...editForm, warrantyTime: e.target.value})} placeholder="Ex: 5 Anos" />
                            <Input label="Prazo de Entrega" value={editForm.deliveryTime} onChange={e => setEditForm({...editForm, deliveryTime: e.target.value})} placeholder="Ex: 20 dias úteis" />
                            <Select 
                                label="Condição de Pagamento" 
                                options={[
                                    {value: 'Sinal 50%', label: 'Sinal de 50% + Restante na entrega'},
                                    {value: 'À Vista', label: 'À Vista'},
                                    {value: 'Parcelado', label: 'Parcelado (Cartão/Boleto)'}
                                ]}
                                value={editForm.paymentCondition}
                                onChange={e => setEditForm({...editForm, paymentCondition: e.target.value})}
                            />
                        </div>

                        {/* Full Width: Notes */}
                        <div className="md:col-span-2 space-y-2">
                             <h4 className="text-sm uppercase tracking-wide text-slate-600 font-bold border-b border-slate-200 pb-2">Observações / Escopo</h4>
                             <textarea
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:border-indigo-500 h-32 resize-none"
                                value={editForm.serviceDescription}
                                onChange={e => setEditForm({...editForm, serviceDescription: e.target.value})}
                                placeholder="Descreva detalhes técnicos, observações importantes ou escopo do serviço..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <Button variant="outline" onClick={() => setEditingProposal(null)}>Cancelar</Button>
                    <Button onClick={saveMetadata} className="shadow-lg shadow-indigo-200">Salvar Alterações</Button>
                </div>
             </div>
          </div>
      )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Histórico de Propostas</h2>
                <p className="text-slate-500 text-sm">Gerencie orçamentos salvos anteriormente.</p>
            </div>
            <div className="w-full md:w-72">
                <Input 
                    placeholder="Buscar por cliente, projeto ou número..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
            </div>
        </div>

        <Card>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Número</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Custo Material</th>
                            <th className="px-6 py-4">Custo Fabr.</th>
                            <th className="px-6 py-4 text-right">Valor Final</th>
                            <th className="px-6 py-4 text-right rounded-tr-lg">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredProposals.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                            <BoxIcon className="w-6 h-6 text-slate-300" />
                                        </div>
                                        Nenhuma proposta encontrada.
                                    </div>
                                </td>
                            </tr>
                        ) : filteredProposals.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 even:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.number}</td>
                                <td className="px-6 py-4 text-slate-600">{fmtDate(p.createdAt)}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{p.clientName}</td>
                                <td className="px-6 py-4">
                                    <select 
                                        className={`text-xs font-semibold px-2 py-1 rounded border outline-none cursor-pointer ${getStatusColor(p.status)}`}
                                        value={p.status}
                                        onChange={(e) => onUpdateStatus(p.id, e.target.value as ProposalStatus)}
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{fmtMoney(getMaterialCost(p))}</td>
                                <td className="px-6 py-4 text-slate-600">{fmtMoney(getFabCost(p))}</td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">{fmtMoney(p.finalValue)}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleViewPDF(p)}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                            title="Visualizar PDF"
                                        >
                                            <CalculatorIcon className="w-3 h-3 mr-1.5" />
                                            Ver PDF
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleEditMetadata(p)}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                                            title="Editar Documento Completo"
                                        >
                                            <PencilIcon className="w-3 h-3 mr-1.5" />
                                            Editar
                                        </button>

                                        <button 
                                            onClick={() => handleLoad(p.id)}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 transition-colors"
                                            title="Carregar Projeto no Sistema"
                                        >
                                            <FolderIcon className="w-3 h-3 mr-1.5" />
                                            Abrir
                                        </button>
                                        
                                        <button onClick={() => onDelete(p.id)} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
  );
};