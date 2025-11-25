
import React, { useState, useMemo } from 'react';
import { Card, Input, Select, Button, Badge } from '../UIComponents';
import { TrashIcon, PlusIcon, PencilIcon, XIcon } from '../Icons';
import { Material, Piece, ProjectComponent, FixedComponent } from '../../types';

interface PiecesProps {
  materials: Material[];
  pieces: Piece[];
  projectComponents: ProjectComponent[];
  fixedComponents: FixedComponent[];
  allComponents: Material[]; // Components from DB
  onAddPiece: (p: any) => void;
  onUpdatePiece: (id: string, p: any) => void;
  onRemovePiece: (id: string) => void;
  onAddComponent: (c: any) => void;
  onUpdateComponent: (id: string, c: any) => void;
  onRemoveComponent: (id: string) => void;
  onAddFixedComponent: (c: any) => void;
  onUpdateFixedComponent: (id: string, c: any) => void;
  onRemoveFixedComponent: (id: string) => void;
}

export const Pieces: React.FC<PiecesProps> = ({ 
  materials, pieces, projectComponents, fixedComponents, allComponents,
  onAddPiece, onUpdatePiece, onRemovePiece, 
  onAddComponent, onUpdateComponent, onRemoveComponent,
  onAddFixedComponent, onUpdateFixedComponent, onRemoveFixedComponent
}) => {
  const [activeTab, setActiveTab] = useState<'pieces' | 'components' | 'fixed'>('pieces');

  // Form States
  const [pForm, setPForm] = useState({ materialType: '', length: '', width: '', quantity: '1', name: '', tapeType: '', tapeLetter: '' });
  const [cForm, setCForm] = useState({ componentId: '', quantity: '1', metragem: '' });
  const [fcForm, setFcForm] = useState({ name: '', unit: 'un', value: '', quantity: '', minutage: '' });

  // Editing States
  const [editingId, setEditingId] = useState<string | null>(null);

  // Real-time calculation for the form
  const currentPieceArea = useMemo(() => {
      const l = parseFloat(pForm.length) || 0;
      const w = parseFloat(pForm.width) || 0;
      const q = parseFloat(pForm.quantity) || 0;
      // Area in m2 = (mm * mm * qty) / 1,000,000
      return (l * w * q) / 1000000;
  }, [pForm.length, pForm.width, pForm.quantity]);

  // --- Calculations for Summary ---
  const summary = useMemo(() => {
    let totalAreaMm2 = 0;
    let totalPerimeterMm = 0;
    let totalScrews = 0;
    const tapeByColor: Record<string, number> = {};

    pieces.forEach(p => {
        totalAreaMm2 += p.area;
        totalPerimeterMm += p.perimeter;
        totalScrews += p.screws;

        if (p.tapeType && p.tapeLength > 0) {
            const color = p.tapeType;
            tapeByColor[color] = (tapeByColor[color] || 0) + p.tapeLength;
        }
    });

    return {
        totalAreaM2: totalAreaMm2 / 1000000,
        totalPerimeterM: totalPerimeterMm / 1000,
        totalScrews,
        tapeByColor // values in mm
    };
  }, [pieces]);

  // Helper to derive tape color from material name
  const getSuggestedTapeColor = (materialName: string): string => {
    const lowerName = materialName.toLowerCase();
    
    if (lowerName.includes('branco') || lowerName.includes('white')) return 'Branco';
    if (lowerName.includes('preto') || lowerName.includes('black')) return 'Preto';
    if (lowerName.includes('cinza') || lowerName.includes('grey') || lowerName.includes('grafite')) return 'Cinza';
    if (lowerName.includes('azul') || lowerName.includes('blue')) return 'Azul';
    if (lowerName.includes('verde') || lowerName.includes('green')) return 'Verde';
    if (lowerName.includes('vermelho') || lowerName.includes('red')) return 'Vermelho';
    if (lowerName.includes('amarelo') || lowerName.includes('yellow')) return 'Amarelo';
    if (lowerName.includes('bege') || lowerName.includes('beige') || lowerName.includes('areia')) return 'Bege';
    
    // Wood tones
    const woodTones = ['amadeirado', 'carvalho', 'nogueira', 'freijo', 'freijó', 'louro', 'imbua', 'cedro', 'cerejeira', 'itapuã', 'jequitibá'];
    if (woodTones.some(tone => lowerName.includes(tone))) return 'Amadeirado';

    return '';
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMaterial = e.target.value;
    
    // Only auto-suggest tape color if we are adding a new piece or if tapeType is empty/same as old suggestion
    if (!editingId || !pForm.tapeType) {
        const suggestedTape = getSuggestedTapeColor(selectedMaterial);
        setPForm({
          ...pForm,
          materialType: selectedMaterial,
          tapeType: suggestedTape
        });
    } else {
         setPForm({
          ...pForm,
          materialType: selectedMaterial
        });
    }
  };

  const handleSubmitPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pForm.materialType || !pForm.length || !pForm.width) return;
    
    const pieceData = {
      materialType: pForm.materialType,
      length: Number(pForm.length),
      width: Number(pForm.width),
      quantity: Number(pForm.quantity),
      name: pForm.name,
      tapeType: pForm.tapeType,
      tapeLetter: pForm.tapeLetter
    };

    if (editingId) {
        onUpdatePiece(editingId, pieceData);
        setEditingId(null);
    } else {
        onAddPiece(pieceData);
    }
    setPForm({ ...pForm, length: '', width: '', name: '' });
  };

  const handleEditPiece = (p: Piece) => {
    setEditingId(p.id);
    setPForm({
        materialType: p.materialType,
        length: p.length.toString(),
        width: p.width.toString(),
        quantity: p.quantity.toString(),
        name: p.name,
        tapeType: p.tapeType,
        tapeLetter: p.tapeLetter
    });
  };

  const handleSubmitComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = allComponents.find(c => c.id === cForm.componentId);
    
    if (editingId) {
        if (!comp) return;
        onUpdateComponent(editingId, {
            name: comp.name,
            unit: comp.unit,
            value: comp.value,
            minutage: comp.minutage || 0,
            quantity: Number(cForm.quantity),
            metragem: cForm.metragem ? Number(cForm.metragem) : undefined
        });
        setEditingId(null);
    } else {
        if (!comp) return;
        onAddComponent({
            name: comp.name,
            unit: comp.unit,
            value: comp.value,
            minutage: comp.minutage || 0,
            quantity: Number(cForm.quantity),
            metragem: cForm.metragem ? Number(cForm.metragem) : undefined
        });
    }
    setCForm({ componentId: '', quantity: '1', metragem: '' });
  };

  const handleEditComponent = (c: ProjectComponent) => {
      const originalComp = allComponents.find(ac => ac.name === c.name);
      setEditingId(c.id);
      setCForm({
          componentId: originalComp ? originalComp.id : '',
          quantity: c.quantity.toString(),
          metragem: c.metragem ? c.metragem.toString() : ''
      });
  };

  const handleSubmitFixedComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
        name: fcForm.name,
        unit: fcForm.unit,
        value: Number(fcForm.value),
        quantity: Number(fcForm.quantity),
        minutage: Number(fcForm.minutage)
    };

    if (editingId) {
        onUpdateFixedComponent(editingId, data);
        setEditingId(null);
    } else {
        onAddFixedComponent(data);
    }
    setFcForm({ name: '', unit: 'un', value: '', quantity: '', minutage: '' });
  };

  const handleEditFixedComponent = (c: FixedComponent) => {
      setEditingId(c.id);
      setFcForm({
          name: c.name,
          unit: c.unit,
          value: c.value.toString(),
          quantity: c.quantity.toString(),
          minutage: c.minutage.toString()
      });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setPForm({ materialType: '', length: '', width: '', quantity: '1', name: '', tapeType: '', tapeLetter: '' });
      setCForm({ componentId: '', quantity: '1', metragem: '' });
      setFcForm({ name: '', unit: 'un', value: '', quantity: '', minutage: '' });
  };

  const materialOptions = materials.filter(m => m.type === 'material').map(m => ({ value: m.name, label: m.name }));
  const componentOptions = allComponents.filter(c => c.type === 'component').map(c => ({ value: c.id, label: c.name }));

  // Number formatting helper for pt-BR
  const fmtNum = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtArea = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-200/60 rounded-xl w-full md:w-fit backdrop-blur-sm overflow-x-auto">
        <button 
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'pieces' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => { setActiveTab('pieces'); cancelEdit(); }}
        >
          Peças (Cortagem)
        </button>
        <button 
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'components' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => { setActiveTab('components'); cancelEdit(); }}
        >
          Componentes do Projeto
        </button>
        <button 
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'fixed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => { setActiveTab('fixed'); cancelEdit(); }}
        >
          Componentes Fixos
        </button>
      </div>

      {activeTab === 'pieces' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column: Form */}
            <div className="xl:col-span-1">
                <Card title={editingId ? "Editar Peça" : "Nova Peça"} className="sticky top-6" 
                    action={editingId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
                    <form onSubmit={handleSubmitPiece} className="space-y-4">
                        <Select 
                            label="Material" 
                            options={[{value: '', label: 'Selecione o material...'}, ...materialOptions]} 
                            value={pForm.materialType}
                            onChange={handleMaterialChange}
                            required
                        />
                        
                        {/* Dimensions Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Comp. (mm)" type="number" value={pForm.length} onChange={e => setPForm({...pForm, length: e.target.value})} required placeholder="0" />
                            <Input label="Larg. (mm)" type="number" value={pForm.width} onChange={e => setPForm({...pForm, width: e.target.value})} required placeholder="0" />
                            <Input label="Qtd" type="number" value={pForm.quantity} onChange={e => setPForm({...pForm, quantity: e.target.value})} required placeholder="1" />
                        </div>

                        {/* Real-time Calculation */}
                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                            <span className="text-xs uppercase font-semibold text-indigo-600">Área (m²):</span>
                            <span className="text-lg font-bold text-indigo-900">{fmtArea(currentPieceArea)}</span>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <Input label="Nome (Opcional)" value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} placeholder="Ex: Porta Direita" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Tipo Fita" value={pForm.tapeType} onChange={e => setPForm({...pForm, tapeType: e.target.value})} placeholder="Ex: Branco, PVC" />
                                <Input label="Letra Fita" value={pForm.tapeLetter} onChange={e => setPForm({...pForm, tapeLetter: e.target.value})} placeholder="Ex: H, L" />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                            {editingId && (
                                <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">Cancelar</Button>
                            )}
                            <Button type="submit" className="w-full flex-1">
                                {editingId ? <PencilIcon className="w-4 h-4 mr-2" /> : <PlusIcon className="w-4 h-4 mr-2" />} 
                                {editingId ? 'Atualizar' : 'Adicionar Peça'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>

            {/* Right Column: Summary & Table */}
            <div className="xl:col-span-3 space-y-6">
                
                 {/* Summary Section Above Table */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="md:col-span-1 bg-slate-50/50 border-indigo-100">
                        <div className="text-center">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Área Total</p>
                            <p className="text-xl font-bold text-indigo-700">{fmtArea(summary.totalAreaM2)} <span className="text-sm font-medium text-slate-400">m²</span></p>
                        </div>
                    </Card>
                    <Card className="md:col-span-1 bg-slate-50/50 border-indigo-100">
                        <div className="text-center">
                             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Perímetro</p>
                             <p className="text-xl font-bold text-indigo-700">{fmtNum(summary.totalPerimeterM)} <span className="text-sm font-medium text-slate-400">m</span></p>
                        </div>
                    </Card>
                    <Card className="md:col-span-1 bg-slate-50/50 border-indigo-100">
                        <div className="text-center">
                             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Parafusos</p>
                             <p className="text-xl font-bold text-indigo-700">{summary.totalScrews} <span className="text-sm font-medium text-slate-400">un</span></p>
                        </div>
                    </Card>
                    <Card className="md:col-span-1 bg-slate-50/50 border-indigo-100 p-3">
                         <div className="h-full flex flex-col justify-center">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Fitas por Cor</p>
                             <div className="space-y-1 overflow-y-auto max-h-16 px-2">
                                {Object.entries(summary.tapeByColor).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center">Nenhuma</p>
                                ) : (
                                    Object.entries(summary.tapeByColor).map(([color, lengthMm]: [string, any]) => (
                                        <div key={color} className="flex justify-between items-center text-xs">
                                            <span className="flex items-center gap-1 truncate max-w-[60%]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
                                                {color}
                                            </span>
                                            <span className="font-bold text-slate-600">{fmtNum(lengthMm / 1000)}m</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Table */}
                <Card title={`Lista de Peças (${pieces.length})`} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 rounded-tl-lg">Material</th>
                                <th className="px-6 py-4">Dimensões (mm)</th>
                                <th className="px-6 py-4 text-center">Qtd</th>
                                <th className="px-6 py-4 text-center">Área (m²)</th>
                                <th className="px-6 py-4">Identificação</th>
                                <th className="px-6 py-4">Fita</th>
                                <th className="px-6 py-4 text-center">Metragem Fita</th>
                                <th className="px-6 py-4 text-center">Parafusos</th>
                                <th className="px-6 py-4 text-right rounded-tr-lg">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pieces.length === 0 ? (
                            <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30 rounded-b-lg">
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <PlusIcon className="w-6 h-6 text-slate-300" />
                                    </div>
                                    Nenhuma peça adicionada ainda.
                                </div>
                            </td></tr>
                            ) : pieces.map((p) => (
                            <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${editingId === p.id ? 'bg-indigo-50/50' : ''}`}>
                                <td className="px-6 py-4 font-medium text-indigo-900">{p.materialType}</td>
                                <td className="px-6 py-4 text-slate-600 font-mono text-xs bg-slate-50/50 rounded mx-2">
                                    {p.length} <span className="text-slate-300">x</span> {p.width}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Badge color="blue">{p.quantity}</Badge>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-700">
                                    {fmtArea(p.area / 1000000)}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{p.name || <span className="text-slate-300 italic">Sem nome</span>}</td>
                                <td className="px-6 py-4">
                                    {p.tapeType ? (
                                        <div className="flex items-center gap-2">
                                            <Badge color="gray">{p.tapeType}</Badge>
                                            {p.tapeLetter && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-1.5 rounded border border-slate-200">{p.tapeLetter}</span>}
                                        </div>
                                    ) : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-xs text-slate-600">
                                    {p.tapeLength > 0 ? `${fmtNum(p.tapeLength / 1000)} m` : '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {p.screws > 0 ? (
                                        <span className="text-xs font-medium text-slate-600">{p.screws} un</span>
                                    ) : (
                                        <span className="text-slate-300 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleEditPiece(p)} className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onRemovePiece(p.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
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
        </div>
      )}

      {activeTab === 'components' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title={editingId ? "Editar Componente" : "Adicionar Componente"} 
                action={editingId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
                <form onSubmit={handleSubmitComponent} className="space-y-4">
                    <Select 
                        label="Componente do Banco" 
                        options={[{value: '', label: 'Selecione...'}, ...componentOptions]} 
                        value={cForm.componentId}
                        onChange={e => setCForm({...cForm, componentId: e.target.value})}
                        required
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Quantidade" type="number" value={cForm.quantity} onChange={e => setCForm({...cForm, quantity: e.target.value})} required placeholder="1" />
                        <Input label="Metragem (Opcional)" type="number" step="0.01" value={cForm.metragem} onChange={e => setCForm({...cForm, metragem: e.target.value})} placeholder="0.00" />
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                        {editingId && (
                            <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">Cancelar</Button>
                        )}
                        <Button type="submit" className="w-full flex-1">
                             {editingId ? <PencilIcon className="w-4 h-4 mr-2" /> : <PlusIcon className="w-4 h-4 mr-2" />} 
                             {editingId ? 'Atualizar' : 'Adicionar'}
                        </Button>
                    </div>
                </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Componentes do Projeto">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                        <th className="px-6 py-4 rounded-tl-lg">Nome</th>
                        <th className="px-6 py-4">Unidade</th>
                        <th className="px-6 py-4 text-center">Qtd</th>
                        <th className="px-6 py-4">Subtotal</th>
                        <th className="px-6 py-4 text-right rounded-tr-lg">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {projectComponents.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhum componente extra adicionado.</td></tr>
                        ) : projectComponents.map((c) => (
                        <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${editingId === c.id ? 'bg-indigo-50/50' : ''}`}>
                            <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs uppercase">{c.unit}</td>
                            <td className="px-6 py-4 text-center"><Badge color="blue">{c.quantity}</Badge></td>
                            <td className="px-6 py-4 font-mono font-medium text-slate-700">R$ {fmtNum(c.value * c.quantity)}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleEditComponent(c)} className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onRemoveComponent(c.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
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
        </div>
      )}

      {activeTab === 'fixed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card title={editingId ? "Editar Comp. Fixo" : "Adicionar Comp. Fixo"} 
                    action={editingId && <button onClick={cancelEdit}><XIcon className="w-5 h-5 text-slate-400"/></button>}>
                    <form onSubmit={handleSubmitFixedComponent} className="space-y-4">
                        <Input label="Nome" value={fcForm.name} onChange={e => setFcForm({...fcForm, name: e.target.value})} required placeholder="Nome do item" />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Unidade" options={[{value: 'un', label: 'un'}, {value: 'cx', label: 'cx'}, {value: 'kg', label: 'kg'}]} value={fcForm.unit} onChange={e => setFcForm({...fcForm, unit: e.target.value})} required />
                             <Input label="Qtd" type="number" value={fcForm.quantity} onChange={e => setFcForm({...fcForm, quantity: e.target.value})} required placeholder="0" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Valor Unit. (R$)" type="number" step="0.01" value={fcForm.value} onChange={e => setFcForm({...fcForm, value: e.target.value})} required placeholder="0.00" />
                            <Input label="Tempo (min)" type="number" step="0.1" value={fcForm.minutage} onChange={e => setFcForm({...fcForm, minutage: e.target.value})} placeholder="0.0" />
                        </div>

                        <div className="flex gap-2 mt-2">
                            {editingId && (
                                <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">Cancelar</Button>
                            )}
                            <Button type="submit" className="w-full flex-1">
                                {editingId ? <PencilIcon className="w-4 h-4 mr-2" /> : <PlusIcon className="w-4 h-4 mr-2" />} 
                                {editingId ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card title="Componentes Fixos">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Nome</th>
                            <th className="px-6 py-4 text-center">Qtd</th>
                            <th className="px-6 py-4">Valor Unit.</th>
                            <th className="px-6 py-4 text-center">Tempo</th>
                            <th className="px-6 py-4">Subtotal</th>
                            <th className="px-6 py-4 text-right rounded-tr-lg">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fixedComponents.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum item cadastrado.</td></tr>
                            ) : fixedComponents.map((fc) => (
                            <tr key={fc.id} className={`hover:bg-slate-50 transition-colors ${editingId === fc.id ? 'bg-indigo-50/50' : ''}`}>
                                <td className="px-6 py-4 font-medium text-slate-800">{fc.name}</td>
                                <td className="px-6 py-4 text-center"><Badge color="amber">{fc.quantity} {fc.unit}</Badge></td>
                                <td className="px-6 py-4 text-slate-600">{fmtNum(fc.value)}</td>
                                <td className="px-6 py-4 text-center text-slate-500">{fc.minutage} min</td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-700">R$ {fmtNum(fc.value * fc.quantity)}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleEditFixedComponent(fc)} className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onRemoveFixedComponent(fc.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
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
        </div>
      )}
    </div>
  );
};
