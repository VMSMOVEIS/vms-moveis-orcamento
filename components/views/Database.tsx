
import React, { useState } from 'react';
import { Card, Input, Select, Button } from '../UIComponents';
import { TrashIcon, PlusIcon, PencilIcon, XIcon } from '../Icons';
import { Category, Labor, FixedCost, AppSettings, ProjectStats, ProjectComponent, FixedComponent, CardRate } from '../../types';

interface DatabaseProps {
  categories: Category[];
  labor: Labor[];
  fixedCosts: FixedCost[];
  cardRates: CardRate[];
  settings: AppSettings;
  stats: ProjectStats;
  projectComponents: ProjectComponent[];
  fixedComponents: FixedComponent[];
  onAddCategory: (c: any) => void;
  onUpdateCategory: (id: string, c: any) => void;
  onRemoveCategory: (id: string) => void;
  onAddLabor: (l: any) => void;
  onUpdateLabor: (id: string, l: any) => void;
  onRemoveLabor: (id: string) => void;
  onAddFixedCost: (fc: any) => void;
  onUpdateFixedCost: (id: string, fc: any) => void;
  onRemoveFixedCost: (id: string) => void;
  onAddCardRate: (cr: any) => void;
  onUpdateCardRate: (id: string, cr: any) => void;
  onRemoveCardRate: (id: string) => void;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
}

export const Database: React.FC<DatabaseProps> = ({ 
  categories, labor, fixedCosts, cardRates, settings, stats, projectComponents, fixedComponents,
  onAddCategory, onUpdateCategory, onRemoveCategory, 
  onAddLabor, onUpdateLabor, onRemoveLabor,
  onAddFixedCost, onUpdateFixedCost, onRemoveFixedCost,
  onAddCardRate, onUpdateCardRate, onRemoveCardRate,
  onUpdateSettings
}) => {
  
  const [activeTab, setActiveTab] = useState('categories');

  // Forms
  const [catForm, setCatForm] = useState({ name: '', idealMargin: '' });
  const [fcForm, setFcForm] = useState({ description: '', type: 'Direct Cost', value: '' });
  const [crForm, setCrForm] = useState({ installments: '', rate: '' });
  const [lForm, setLForm] = useState({ description: '', minutage: '', category: 'Marcenaria' });
  
  // Editing States
  const [editingCatId, setEditingCatId] = useState<string|null>(null);
  const [editingFcId, setEditingFcId] = useState<string|null>(null);
  const [editingCrId, setEditingCrId] = useState<string|null>(null);
  const [editingLabId, setEditingLabId] = useState<string|null>(null);

  // Categories Handlers
  const handleCatSubmit = () => {
    if (editingCatId) {
        onUpdateCategory(editingCatId, { name: catForm.name, idealMargin: Number(catForm.idealMargin) });
        setEditingCatId(null);
    } else {
        onAddCategory({ name: catForm.name, idealMargin: Number(catForm.idealMargin) });
    }
    setCatForm({ name: '', idealMargin: '' });
  };

  const handleEditCategory = (c: Category) => {
      setEditingCatId(c.id);
      setCatForm({ name: c.name, idealMargin: c.idealMargin.toString() });
  };

  // Labor Handlers
  const handleLaborSubmit = () => {
    if (editingLabId) {
        onUpdateLabor(editingLabId, { 
            description: lForm.description, 
            minutage: Number(lForm.minutage),
            category: lForm.category 
        });
        setEditingLabId(null);
    } else {
        onAddLabor({ 
            description: lForm.description, 
            minutage: Number(lForm.minutage),
            category: lForm.category,
            valuePerMinute: 0
        });
    }
    setLForm({ description: '', minutage: '', category: 'Marcenaria' });
  };

  const handleEditLabor = (l: Labor) => {
      setEditingLabId(l.id);
      setLForm({ 
          description: l.description, 
          minutage: l.minutage.toString(),
          category: l.category || 'Marcenaria'
      });
  };

  // Fixed Costs Handlers
  const handleFcSubmit = () => {
      if (editingFcId) {
          onUpdateFixedCost(editingFcId, { description: fcForm.description, type: fcForm.type, value: Number(fcForm.value) });
          setEditingFcId(null);
      } else {
          onAddFixedCost({ description: fcForm.description, type: fcForm.type, value: Number(fcForm.value) });
      }
      setFcForm({ description: '', type: 'Direct Cost', value: '' });
  };

  const handleEditFc = (fc: FixedCost) => {
      setEditingFcId(fc.id);
      setFcForm({ description: fc.description, type: fc.type, value: fc.value.toString() });
  };

  // Card Rates Handlers
  const handleCrSubmit = () => {
    if (editingCrId) {
        onUpdateCardRate(editingCrId, { installments: Number(crForm.installments), rate: Number(crForm.rate) });
        setEditingCrId(null);
    } else {
        onAddCardRate({ installments: Number(crForm.installments), rate: Number(crForm.rate) });
    }
    setCrForm({ installments: '', rate: '' });
  };

  const handleEditCr = (cr: CardRate) => {
      setEditingCrId(cr.id);
      setCrForm({ installments: cr.installments.toString(), rate: cr.rate.toString() });
  };

  const cancelEdit = () => {
      setEditingCatId(null);
      setEditingFcId(null);
      setEditingCrId(null);
      setEditingLabId(null);
      setCatForm({ name: '', idealMargin: '' });
      setFcForm({ description: '', type: 'Direct Cost', value: '' });
      setCrForm({ installments: '', rate: '' });
      setLForm({ description: '', minutage: '', category: 'Marcenaria' });
  };

  // Calculations for Manufacturing Tab Helper
  const getLaborFactor = (type: string, category: string) => {
      return labor.find(l => 
          l.description.toLowerCase().includes(type.toLowerCase()) && 
          (l.category === category || (!l.category && category === 'Marcenaria'))
      )?.minutage || 0;
  };

  // --- Marcenaria Data ---
  const woodCutFactor = getLaborFactor('Corte', 'Marcenaria');
  const woodEdgeFactor = getLaborFactor('Colagem', 'Marcenaria');
  const woodAssemblyFactor = getLaborFactor('Montagem', 'Marcenaria');
  // Assume Wood stats are Total - Glass - Metal? 
  // To keep it simple in view, we approximate based on stats logic from store
  const woodPerimeterCalc = (stats.totalPerimeter - stats.totalGlassPerimeter) / 1000; // approximation if only glass/wood/metal used
  const woodCutTime = Math.max(0, woodPerimeterCalc) * woodCutFactor;
  const woodEdgeTime = (stats.totalTapeLength / 1000) * woodEdgeFactor;
  const woodAssemblyTime = stats.totalScrews * woodAssemblyFactor;

  // --- Serralheria Data ---
  const metalCutFactor = getLaborFactor('Corte', 'Serralheria');
  const metalSandFactor = getLaborFactor('Lixagem', 'Serralheria');
  const metalWeldFactor = getLaborFactor('Soldagem', 'Serralheria');
  const metalPaintFactor = getLaborFactor('Pintura', 'Serralheria');
  
  const metalCutTime = stats.totalMetalPieces * metalCutFactor;
  const metalSandTime = stats.totalMetalPieces * metalSandFactor;
  const metalWeldTime = stats.totalMetalPieces * metalWeldFactor;
  const metalPaintTime = (stats.totalMetalLength / 1000) * metalPaintFactor;

  // --- Vidraçaria Data ---
  const glassCutFactor = getLaborFactor('Corte', 'Vidraçaria');
  const glassFinishFactor = getLaborFactor('Acabamento', 'Vidraçaria');
  
  const glassCutTime = (stats.totalGlassPerimeter / 1000) * glassCutFactor;
  const glassFinishTime = (stats.totalGlassPerimeter / 1000) * glassFinishFactor;

  // Components
  const componentTime = projectComponents.reduce((acc, c) => acc + (c.minutage * c.quantity), 0);
  const fixedComponentTime = fixedComponents.reduce((acc, fc) => acc + (fc.minutage * fc.quantity), 0);
  
  const totalMfgMinutes = woodCutTime + woodEdgeTime + woodAssemblyTime + 
                          metalCutTime + metalSandTime + metalWeldTime + metalPaintTime + 
                          glassCutTime + glassFinishTime +
                          componentTime + fixedComponentTime;
  
  const costPerMinute = stats.calculatedLaborRate / 60;

  const fmtMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="bg-slate-100 pt-2 pb-2">
        <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg w-fit overflow-x-auto shadow-sm">
            {['categories', 'labor', 'manufacturing', 'fixedCosts', 'cardRates', 'calculations'].map(tab => (
            <button 
            key={tab}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap capitalize transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            onClick={() => { setActiveTab(tab); cancelEdit(); }}
            >
            {tab === 'fixedCosts' ? 'Custos Fixos' : 
                tab === 'calculations' ? 'Cálculos RH' : 
                tab === 'categories' ? 'Categorias' : 
                tab === 'manufacturing' ? 'Custo de Fabricação' :
                tab === 'cardRates' ? 'Taxas Cartão' :
                'Mão de Obra'}
            </button>
            ))}
        </div>
      </div>

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title={editingCatId ? "Editar Categoria" : "Nova Categoria"} action={editingCatId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
            <div className="space-y-4">
              <Input label="Nome" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              <Input label="Margem Ideal (%)" type="number" value={catForm.idealMargin} onChange={e => setCatForm({...catForm, idealMargin: e.target.value})} />
              <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100">
                {editingCatId && (
                    <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 h-11">Cancelar</Button>
                )}
                <Button onClick={handleCatSubmit} className="w-full flex-1 h-11 shadow-sm">
                    {editingCatId ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </Card>
          <Card title="Categorias" className="md:col-span-2">
            <ul className="divide-y divide-slate-100">
              {categories.map(c => (
                <li key={c.id} className={`py-3 flex justify-between items-center px-2 rounded hover:bg-slate-50 even:bg-slate-50/50 ${editingCatId === c.id ? 'bg-indigo-50' : ''}`}>
                  <div><span className="font-medium">{c.name}</span> <span className="text-slate-500 text-sm">({c.idealMargin}%)</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditCategory(c)} className="text-slate-400 hover:text-indigo-500 p-1"><PencilIcon className="w-4 h-4"/></button>
                    <button onClick={() => onRemoveCategory(c.id)} className="text-slate-400 hover:text-rose-500 p-1"><TrashIcon className="w-4 h-4"/></button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {activeTab === 'labor' && (
        <div className="space-y-6">
            {/* Form for Labor */}
            <Card title={editingLabId ? "Editar Mão de Obra" : "Nova Mão de Obra"} className="sticky top-20"
                  action={editingLabId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <Select 
                        label="Categoria"
                        options={[
                            {value: 'Marcenaria', label: 'Marcenaria'},
                            {value: 'Serralheria', label: 'Serralheria (Metalon)'},
                            {value: 'Vidraçaria', label: 'Vidraçaria'}
                        ]}
                        value={lForm.category}
                        onChange={e => setLForm({...lForm, category: e.target.value})}
                    />
                    <Input label="Descrição" value={lForm.description} onChange={e => setLForm({...lForm, description: e.target.value})} placeholder="Ex: Corte" />
                    <Input label="Minutos" type="number" value={lForm.minutage} onChange={e => setLForm({...lForm, minutage: e.target.value})} placeholder="0" />
                    <div className="flex items-center gap-2">
                         {editingLabId && <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>}
                         <Button onClick={handleLaborSubmit} className="flex-1">{editingLabId ? 'Atualizar' : 'Adicionar'}</Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Marcenaria', 'Serralheria', 'Vidraçaria'].map(category => {
                    const filteredLabor = labor.filter(l => 
                        l.category === category || 
                        (!l.category && category === 'Marcenaria') // Handle legacy items
                    );

                    return (
                        <Card key={category} title={category} className="h-full">
                            <ul className="divide-y divide-slate-100">
                                {filteredLabor.map(l => (
                                    <li key={l.id} className={`py-3 flex justify-between items-center px-2 rounded hover:bg-slate-50 even:bg-slate-50/50 ${editingLabId === l.id ? 'bg-indigo-50' : ''}`}>
                                        <div>
                                            <span className="font-medium text-slate-800">{l.description}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{l.minutage} min</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditLabor(l)} className="text-slate-400 hover:text-indigo-500 p-1"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => onRemoveLabor(l.id)} className="text-slate-400 hover:text-rose-500 p-1"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {filteredLabor.length === 0 && (
                                    <li className="py-8 text-center text-sm text-slate-400 italic">Nenhum item cadastrado.</li>
                                )}
                            </ul>
                        </Card>
                    );
                })}
            </div>
        </div>
      )}

      {activeTab === 'manufacturing' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card title="Resumo de Custo de Fabricação" subtitle="Calculado com base nas peças cadastradas e seus materiais.">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-lg">Atividade</th>
                                <th className="px-6 py-4">Métrica</th>
                                <th className="px-6 py-4 text-center">Fator</th>
                                <th className="px-6 py-4 text-center">Tempo Total</th>
                                <th className="px-6 py-4 text-right rounded-tr-lg">Custo Estimado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {/* Marcenaria Section */}
                            <tr className="bg-indigo-50/50"><td colSpan={5} className="px-6 py-2 font-bold text-indigo-700 text-xs uppercase tracking-wide">Marcenaria (Madeira/MDF)</td></tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Corte</td>
                                <td className="px-6 py-3 text-slate-600">{fmtNum(Math.max(0, woodPerimeterCalc))} m (Perímetro)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{woodCutFactor} min/m</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(woodCutTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(woodCutTime * costPerMinute)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Colagem</td>
                                <td className="px-6 py-3 text-slate-600">{fmtNum(stats.totalTapeLength / 1000)} m (Fita)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{woodEdgeFactor} min/m</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(woodEdgeTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(woodEdgeTime * costPerMinute)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Montagem</td>
                                <td className="px-6 py-3 text-slate-600">{stats.totalScrews} un (Parafusos)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{woodAssemblyFactor} min/un</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(woodAssemblyTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(woodAssemblyTime * costPerMinute)}</td>
                            </tr>

                            {/* Serralheria Section */}
                            <tr className="bg-amber-50/50"><td colSpan={5} className="px-6 py-2 font-bold text-amber-700 text-xs uppercase tracking-wide">Serralheria (Metalon)</td></tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Corte</td>
                                <td className="px-6 py-3 text-slate-600">{stats.totalMetalPieces} un (Peças)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{metalCutFactor} min/un</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(metalCutTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(metalCutTime * costPerMinute)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Lixagem</td>
                                <td className="px-6 py-3 text-slate-600">{stats.totalMetalPieces} un (Peças)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{metalSandFactor} min/un</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(metalSandTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(metalSandTime * costPerMinute)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Soldagem</td>
                                <td className="px-6 py-3 text-slate-600">{stats.totalMetalPieces} un (Peças)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{metalWeldFactor} min/un</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(metalWeldTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(metalWeldTime * costPerMinute)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Pintura</td>
                                <td className="px-6 py-3 text-slate-600">{fmtNum(stats.totalMetalLength / 1000)} m (Linear)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{metalPaintFactor} min/m</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(metalPaintTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(metalPaintTime * costPerMinute)}</td>
                            </tr>

                            {/* Vidraçaria Section */}
                            <tr className="bg-sky-50/50"><td colSpan={5} className="px-6 py-2 font-bold text-sky-700 text-xs uppercase tracking-wide">Vidraçaria (Vidro/Espelho)</td></tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Corte</td>
                                <td className="px-6 py-3 text-slate-600">{fmtNum(stats.totalGlassPerimeter / 1000)} m (Perímetro)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{glassCutFactor} min/m</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(glassCutTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(glassCutTime * costPerMinute)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Acabamento</td>
                                <td className="px-6 py-3 text-slate-600">{fmtNum(stats.totalGlassPerimeter / 1000)} m (Perímetro)</td>
                                <td className="px-6 py-3 text-center text-indigo-600">{glassFinishFactor} min/m</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(glassFinishTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(glassFinishTime * costPerMinute)}</td>
                            </tr>

                            {/* Extras */}
                            <tr className="bg-slate-100/50"><td colSpan={5} className="px-6 py-2 font-bold text-slate-600 text-xs uppercase tracking-wide">Outros</td></tr>
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Componentes</td>
                                <td className="px-6 py-3 text-slate-600">{projectComponents.length} itens</td>
                                <td className="px-6 py-3 text-center text-indigo-600">-</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(componentTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(componentTime * costPerMinute)}</td>
                            </tr>
                             <tr className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800">Comp. Fixos</td>
                                <td className="px-6 py-3 text-slate-600">{fixedComponents.length} itens</td>
                                <td className="px-6 py-3 text-center text-indigo-600">-</td>
                                <td className="px-6 py-3 text-center font-bold">{fmtNum(fixedComponentTime)} min</td>
                                <td className="px-6 py-3 text-right font-mono">{fmtMoney(fixedComponentTime * costPerMinute)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 border-t border-slate-200">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 font-bold text-slate-700 text-right">Totais de Mão de Obra Direta:</td>
                                <td className="px-6 py-4 font-bold text-slate-800 text-center">{fmtNum(totalMfgMinutes)} min</td>
                                <td className="px-6 py-4 font-bold text-slate-800 text-right">{fmtMoney(totalMfgMinutes * costPerMinute)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                    <h4 className="text-blue-900 font-medium">Configuração de Custo Hora</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        O cálculo acima utiliza o custo calculado automaticamente na aba "Cálculos RH": 
                        <span className="font-bold ml-1">{fmtMoney(stats.calculatedLaborRate)}/hora</span>.
                    </p>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'fixedCosts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title={editingFcId ? "Editar Custo" : "Novo Custo Fixo"} className="sticky top-20" action={editingFcId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
            <div className="space-y-4">
              <Input label="Descrição" value={fcForm.description} onChange={e => setFcForm({...fcForm, description: e.target.value})} />
              <Select label="Tipo" options={[{value:'Direct Cost', label:'Direto (Salários, etc)'}, {value:'Indirect Cost', label:'Indireto (Aluguel, etc)'}, {value:'Expense', label:'Despesa (Adm, Mkt)'}]} value={fcForm.type} onChange={e => setFcForm({...fcForm, type: e.target.value})} />
              <Input label="Valor (R$)" type="number" value={fcForm.value} onChange={e => setFcForm({...fcForm, value: e.target.value})} />
              <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100">
                  {editingFcId && (
                      <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 h-11">Cancelar</Button>
                  )}
                  <Button onClick={handleFcSubmit} className="w-full flex-1 h-11 shadow-sm">
                      {editingFcId ? 'Atualizar' : 'Adicionar'}
                  </Button>
              </div>
            </div>
          </Card>
          <Card title="Custos Fixos" className="md:col-span-2">
             <ul className="divide-y divide-slate-100">
              {fixedCosts.map(fc => (
                <li key={fc.id} className={`py-3 flex justify-between items-center px-2 rounded hover:bg-slate-50 even:bg-slate-50/50 ${editingFcId === fc.id ? 'bg-indigo-50' : ''}`}>
                   <div>
                      <span className="font-medium">{fc.description}</span>
                      <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-1 rounded">{fc.type === 'Direct Cost' ? 'Direto' : fc.type === 'Indirect Cost' ? 'Indireto' : 'Despesa'}</span>
                   </div>
                   <div className="flex items-center gap-4">
                    <span className="font-semibold">{fmtMoney(fc.value)}</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleEditFc(fc)} className="text-slate-400 hover:text-indigo-500 p-1"><PencilIcon className="w-4 h-4"/></button>
                        <button onClick={() => onRemoveFixedCost(fc.id)} className="text-slate-400 hover:text-rose-500 p-1"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t flex justify-between text-sm text-slate-600">
               <span>Diretos: <strong>{fmtMoney(stats.totalFixedDirectCost)}</strong></span>
               <span>Indiretos+Despesas: <strong>{fmtMoney(stats.totalFixedIndirectCost)}</strong></span>
               <span>Total: <strong>{fmtMoney(fixedCosts.reduce((a,b) => a + b.value, 0))}</strong></span>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'cardRates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title={editingCrId ? "Editar Taxa" : "Nova Taxa de Cartão"} className="sticky top-20" action={editingCrId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
            <div className="space-y-4">
              <Input label="Parcelas (nº)" type="number" value={crForm.installments} onChange={e => setCrForm({...crForm, installments: e.target.value})} placeholder="Ex: 12" />
              <Input label="Taxa Total (%)" type="number" step="0.01" value={crForm.rate} onChange={e => setCrForm({...crForm, rate: e.target.value})} placeholder="Ex: 14.5" />
              <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100">
                  {editingCrId && (
                      <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 h-11">Cancelar</Button>
                  )}
                  <Button onClick={handleCrSubmit} className="w-full flex-1 h-11 shadow-sm">
                      {editingCrId ? 'Atualizar' : 'Adicionar'}
                  </Button>
              </div>
            </div>
          </Card>
          <Card title="Taxas de Cartão Cadastradas" subtitle="Estas taxas serão usadas na aba de precificação para simular parcelamentos." className="md:col-span-2">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 rounded-tl-lg">Parcelas</th>
                      <th className="px-6 py-3">Taxa (%)</th>
                      <th className="px-6 py-3 text-right rounded-tr-lg">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cardRates.map(cr => (
                      <tr key={cr.id} className={`hover:bg-slate-50 even:bg-slate-50/50 transition-colors ${editingCrId === cr.id ? 'bg-indigo-50' : ''}`}>
                        <td className="px-6 py-3 font-medium text-slate-800">{cr.installments}x</td>
                        <td className="px-6 py-3 font-medium text-indigo-600">{cr.rate}%</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditCr(cr)} className="text-slate-400 hover:text-indigo-500 p-1"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => onRemoveCardRate(cr.id)} className="text-slate-400 hover:text-rose-500 p-1"><TrashIcon className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      )}

      {activeTab === 'calculations' && (
         <Card title="Cálculo de Custo Hora / Homem" subtitle="Defina os parâmetros para cálculo automático do valor da hora técnica.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <Input 
                label="Número de Funcionários" 
                type="number" 
                value={settings.numEmployees} 
                onChange={e => onUpdateSettings({ numEmployees: Number(e.target.value) })} 
             />
             <Input 
                label="Horas/Mês por Func." 
                type="number" 
                value={settings.hoursToWork} 
                onChange={e => onUpdateSettings({ hoursToWork: Number(e.target.value) })} 
             />
           </div>
           
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6">
              <h4 className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Resultados Calculados (Somente Leitura)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Direct Costs */}
                  <div className="space-y-4">
                     <Input 
                        label="Custo Fixo Direto Total (R$)" 
                        value={fmtMoney(stats.totalFixedDirectCost)} 
                        readOnly 
                        className="bg-slate-100 text-slate-600" 
                     />
                     <div className="relative">
                        <Input 
                            label="Custo Mão de Obra / Hora (R$)" 
                            value={fmtMoney(stats.calculatedLaborRate)} 
                            readOnly 
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" 
                        />
                        <span className="text-[10px] text-slate-400 absolute right-1 top-0">Custo Direto / (Func * Horas)</span>
                     </div>
                  </div>

                  {/* Indirect Costs (Rateio) */}
                  <div className="space-y-4">
                     <Input 
                        label="Total Indireto + Despesas (R$)" 
                        value={fmtMoney(stats.totalFixedIndirectCost)} 
                        readOnly 
                        className="bg-slate-100 text-slate-600" 
                     />
                     <div className="relative">
                        <Input 
                            label="Rateio (Overhead) / Hora (R$)" 
                            value={fmtMoney(stats.calculatedOverheadRate)} 
                            readOnly 
                            className="bg-amber-50 text-amber-700 border-amber-200 font-bold" 
                        />
                         <span className="text-[10px] text-slate-400 absolute right-1 top-0">Indireto / (Func * Horas)</span>
                     </div>
                  </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                 <p className="text-slate-500 text-sm">Capacidade Total: <span className="font-bold text-slate-800">{settings.numEmployees * settings.hoursToWork} horas/mês</span></p>
                 <p className="text-slate-500 text-sm">Custo Hora Total: <span className="font-bold text-indigo-700 text-lg">{fmtMoney(stats.calculatedLaborRate + stats.calculatedOverheadRate)}</span></p>
              </div>
           </div>
         </Card>
      )}
    </div>
  );
};
