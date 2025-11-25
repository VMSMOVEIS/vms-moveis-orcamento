
import React, { useState } from 'react';
import { Card, Input, Select, Button } from '../UIComponents';
import { TrashIcon, PlusIcon, PencilIcon, XIcon } from '../Icons';
import { Material, Unit } from '../../types';

interface MaterialsProps {
  materials: Material[];
  onAdd: (m: any) => void;
  onUpdate: (id: string, m: any) => void;
  onRemove: (id: string) => void;
}

export const Materials: React.FC<MaterialsProps> = ({ materials, onAdd, onUpdate, onRemove }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'components'>('materials');
  const [form, setForm] = useState({ name: '', unit: '', value: '', minutage: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      unit: form.unit,
      value: Number(form.value),
      type: activeTab === 'materials' ? 'material' : 'component',
      minutage: form.minutage ? Number(form.minutage) : 0
    };

    if (editingId) {
      onUpdate(editingId, data);
      setEditingId(null);
    } else {
      onAdd(data);
    }
    setForm({ name: '', unit: '', value: '', minutage: '' });
  };

  const handleEdit = (m: Material) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      unit: m.unit,
      value: m.value.toString(),
      minutage: m.minutage ? m.minutage.toString() : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', unit: '', value: '', minutage: '' });
  };

  const unitOptions = Object.values(Unit).map(u => ({ value: u, label: u }));

  const filteredMaterials = materials.filter(m => 
      activeTab === 'materials' ? m.type === 'material' : m.type === 'component'
  );

  const fmtMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
       {/* Tab Switcher - Mobile Friendly */}
       <div className="bg-slate-100 pt-2 pb-2">
         <div className="flex p-1 bg-slate-200/60 rounded-xl w-full md:w-fit backdrop-blur-sm shadow-sm">
            <button 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'materials' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            onClick={() => { setActiveTab('materials'); handleCancelEdit(); }}
            >
            Matéria Prima
            </button>
            <button 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'components' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            onClick={() => { setActiveTab('components'); handleCancelEdit(); }}
            >
            Componentes e Ferragens
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <Card 
            title={editingId ? "Editar Item" : (activeTab === 'materials' ? "Nova Matéria Prima" : "Novo Componente")}
            subtitle={activeTab === 'materials' ? "Cadastre chapas (MDF, Compensado)." : "Cadastre ferragens (Dobradiças, etc)."}
            action={editingId && (
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                <XIcon className="w-5 h-5" />
              </button>
            )}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input 
                label="Nome do Item" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                required 
                placeholder={activeTab === 'materials' ? "Ex: MDF Branco TX 15mm" : "Ex: Dobradiça Curva 35mm"} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                  <Select label="Unidade" options={[{value:'', label:'Selecione'}, ...unitOptions]} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required />
                  <Input label="Valor (R$)" type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required placeholder="0.00" />
              </div>
              
              {activeTab === 'components' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <Input label="Tempo Instalação (min)" type="number" value={form.minutage} onChange={e => setForm({...form, minutage: e.target.value})} placeholder="0" />
                    <p className="text-xs text-slate-500 mt-2">Usado para calcular o custo de mão de obra automaticamente.</p>
                </div>
              )}
              
              <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100">
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1 h-11">
                    Cancelar
                  </Button>
                )}
                <Button type="submit" className="w-full h-11 text-base flex-1 shadow-sm">
                  {editingId ? <PencilIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />} 
                  {editingId ? 'Atualizar' : (activeTab === 'materials' ? 'Cadastrar' : 'Cadastrar')}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <Card 
            title={activeTab === 'materials' ? "Banco de Materiais" : "Banco de Componentes"} 
            action={<div className="text-sm text-slate-500">Total: {filteredMaterials.length} itens</div>}
          >
             <div className="overflow-x-auto -mx-6 md:mx-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Nome</th>
                    <th className="px-6 py-4">Unidade</th>
                    <th className="px-6 py-4">Valor Unit.</th>
                    {activeTab === 'components' && <th className="px-6 py-4">Tempo</th>}
                    <th className="px-6 py-4 text-right rounded-tr-lg">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMaterials.length === 0 ? (
                      <tr><td colSpan={activeTab === 'components' ? 5 : 4} className="px-6 py-8 text-center text-slate-400">Nenhum item encontrado.</td></tr>
                  ) : filteredMaterials.map(m => (
                    <tr key={m.id} className={`hover:bg-slate-50 even:bg-slate-50/50 transition-colors ${editingId === m.id ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-800">{m.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs uppercase"><span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{m.unit}</span></td>
                      <td className="px-6 py-4 font-medium text-slate-700">{fmtMoney(m.value)}</td>
                      {activeTab === 'components' && (
                          <td className="px-6 py-4 text-slate-600">{m.minutage || 0} min</td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(m)} className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => onRemove(m.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
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
    </div>
  );
};
