import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, Select, Button, Badge } from '../UIComponents';
import { AppSettings, ProjectStats, Category, CardRate, AdditionalService, SavedProposal, Piece, ProjectComponent, FixedComponent, Material, LoadedProposalData } from '../../types';
import { DollarSignIcon, CalculatorIcon, XIcon, PlusIcon, TrashIcon, BoxIcon, FolderIcon } from '../Icons';
import { createProposalDocument } from '../../utils/pdfGenerator';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface PricingProps {
  settings: AppSettings;
  stats: ProjectStats;
  categories: Category[];
  cardRates: CardRate[];
  additionalServices: AdditionalService[];
  savedProposals: SavedProposal[];
  resetKey: number; // Prop to trigger form reset
  
  // Prop to populate form from loaded proposal
  currentProposalData: LoadedProposalData | null;

  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onAddService: (s: Omit<AdditionalService, 'id'>) => void;
  onRemoveService: (id: string) => void;
  onSaveProposal: (
      clientName: string, 
      projectName: string, 
      clientPhone?: string, 
      serviceDescription?: string, 
      validityDays?: string,
      warrantyTime?: string,
      deliveryTime?: string,
      paymentCondition?: string,
      images?: string[]
  ) => void;
  
  // Data for BOM
  materials: Material[];
  pieces: Piece[];
  projectComponents: ProjectComponent[];
  fixedComponents: FixedComponent[];
}

// Stats Card Component for Dashboard
const StatCard = ({ title, value, icon, bgClass, textClass, subValue }: { title: string, value: string, icon: React.ReactNode, bgClass: string, textClass: string, subValue?: string }) => (
  <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${bgClass}`}>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white bg-opacity-60 text-current shadow-sm ${textClass}`}>
            {icon}
         </div>
         {/* Decorative icon in background */}
         <div className={`absolute -right-4 -top-4 opacity-10 transform scale-150 rotate-12 ${textClass}`}>
             {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-24 h-24' })}
         </div>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1 mix-blend-multiply">{title}</p>
      <h3 className={`text-2xl font-bold ${textClass} tracking-tight`}>{value}</h3>
      {subValue && <p className="text-xs font-medium text-slate-400 mt-2 mix-blend-multiply">{subValue}</p>}
    </div>
  </div>
);

export const Pricing: React.FC<PricingProps> = ({ 
    settings, stats, categories, cardRates, additionalServices, savedProposals, resetKey, currentProposalData,
    onUpdateSettings, onAddService, onRemoveService, onSaveProposal,
    materials, pieces, projectComponents, fixedComponents
}) => {
  const [activeTab, setActiveTab] = useState<'calculation' | 'dashboard' | 'report'>('calculation');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectName, setProjectName] = useState('');
  const [validityDays, setValidityDays] = useState('15');
  const [serviceNotes, setServiceNotes] = useState(''); // General notes
  
  // New Fields
  const [warrantyTime, setWarrantyTime] = useState('90 dias');
  const [deliveryTime, setDeliveryTime] = useState('20 dias úteis');
  const [paymentCondition, setPaymentCondition] = useState('Sinal 50%');
  const [proposalImages, setProposalImages] = useState<string[]>([]);
  const [includeContract, setIncludeContract] = useState(false);
  
  // Form for new service
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceVal, setNewServiceVal] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);

  // Calculate Proposal Number
  const currentYear = new Date().getFullYear();
  const nextNumber = (savedProposals.length + 1).toString().padStart(4, '0');
  const proposalCode = `Orçamento ${nextNumber}-${currentYear}`;

  // Find 12x Rate for Display
  const rate12x = cardRates.find(r => r.installments === 12)?.rate || 0;

  // Watch for Loaded Proposal Data
  useEffect(() => {
    if (currentProposalData) {
        setClientName(currentProposalData.clientName);
        setProjectName(currentProposalData.projectName);
        setClientPhone(currentProposalData.clientPhone);
        setServiceNotes(currentProposalData.serviceDescription);
        setValidityDays(currentProposalData.validityDays);
        if(currentProposalData.warrantyTime) setWarrantyTime(currentProposalData.warrantyTime);
        if(currentProposalData.deliveryTime) setDeliveryTime(currentProposalData.deliveryTime);
        if(currentProposalData.paymentCondition) setPaymentCondition(currentProposalData.paymentCondition);
        if(currentProposalData.images) setProposalImages(currentProposalData.images);
    }
  }, [currentProposalData]);

  // Watch for Reset Signal
  useEffect(() => {
    if (resetKey > 0) {
        setClientName('');
        setClientPhone('');
        setProjectName('');
        setValidityDays('15');
        setServiceNotes('');
        setProposalImages([]);
        setIncludeContract(false);
        setNewServiceDesc('');
        setNewServiceVal('');
        setActiveTab('calculation');
        setWarrantyTime('90 dias');
        setDeliveryTime('20 dias úteis');
        setPaymentCondition('Sinal 50%');
    }
  }, [resetKey]);

  // --- BOM Logic ---
  const bomData = useMemo(() => {
    const list: Array<{ category: string, name: string, quantity: number, unit: string, unitPrice: number, totalPrice: number, autoGenerated?: boolean }> = [];

    // 1. Raw Materials (Aggregated)
    const materialAggregation: Record<string, { qty: number, unit: string, price: number }> = {};
    const tapeByColor: Record<string, { length: number; cost: number }> = {};

    pieces.forEach(p => {
        const matDef = materials.find(m => m.name === p.materialType);
        if(!matDef) return;
        
        if(!materialAggregation[p.materialType]) {
            materialAggregation[p.materialType] = { qty: 0, unit: matDef.unit, price: matDef.value };
        }

        if (matDef.unit === 'm') {
            materialAggregation[p.materialType].qty += (p.length / 1000) * p.quantity;
        } else {
            materialAggregation[p.materialType].qty += (p.area / 1000000);
        }

        if (p.tapeType && p.tapeLength > 0) {
            const color = p.tapeType;
            if (!tapeByColor[color]) {
                tapeByColor[color] = { length: 0, cost: 0 };
            }
            tapeByColor[color].length += p.tapeLength;
        }
    });

    Object.entries(materialAggregation).forEach(([name, data]) => {
        list.push({
            category: 'Matéria Prima',
            name,
            quantity: data.qty,
            unit: data.unit,
            unitPrice: data.price,
            totalPrice: data.qty * data.price
        });
    });

    // 2. Tapes
    Object.keys(tapeByColor).forEach(color => {
        const lengthM = tapeByColor[color].length / 1000;
        const searchName = `fita ${color}`.toLowerCase();
        const tapeMaterial = materials.find(m => m.name.toLowerCase() === searchName);
        const pricePerM = tapeMaterial ? tapeMaterial.value : 2.00;
        
        list.push({
            category: 'Fita de Borda',
            name: `Fita ${color}`,
            quantity: lengthM,
            unit: 'm',
            unitPrice: pricePerM,
            totalPrice: lengthM * pricePerM
        });
    });

    // 3. Components (Project + Fixed) + AUTOMATIC LOGIC
    const allProjectItems = [...projectComponents, ...fixedComponents];
    
    // Automatic Counters
    let extraSupports = 0;
    let extraScrews = 0;

    allProjectItems.forEach(item => {
        list.push({
            category: 'Componentes',
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.value,
            totalPrice: item.value * item.quantity
        });

        const lowerName = item.name.toLowerCase();
        const qty = item.quantity;

        // Logic 1: Tubo Cabideiro -> 2 Suportes
        if (lowerName.includes('tubo cabideiro')) {
            extraSupports += (qty * 2);
        }

        // Logic 2: Parafusos 3.5x14 Logic
        if (lowerName.includes('corrediça')) {
             extraScrews += (qty * 4); // 1 par = 4 parafusos
        }
        if (lowerName.includes('suporte cabideiro')) {
             extraScrews += (qty * 2); 
        }
        if (lowerName.includes('cantoneira') && !lowerName.includes('em l')) {
             extraScrews += (qty * 2);
        }
        if (lowerName.includes('rodízio')) {
             extraScrews += (qty * 4);
        }
        if (lowerName.includes('cantoneira em l')) {
             extraScrews += (qty * 3);
        }
    });

    // Add generated Supports
    if (extraSupports > 0) {
        extraScrews += (extraSupports * 2);
        const supportDef = materials.find(c => c.name.toLowerCase().includes('suporte cabideiro')) || { value: 1.00, unit: 'un' };
        
        list.push({
            category: 'Automático',
            name: 'Suporte Cabideiro (Gerado)',
            quantity: extraSupports,
            unit: supportDef.unit,
            unitPrice: supportDef.value,
            totalPrice: extraSupports * supportDef.value,
            autoGenerated: true
        });
    }

    // Add generated Screws 3.5x14
    if (extraScrews > 0) {
        const screwDef = materials.find(c => c.name.includes('3.5x14')) || { value: 0.04, unit: 'un' };
        
        list.push({
            category: 'Automático',
            name: 'Parafuso 3.5x14 (Gerado)',
            quantity: extraScrews,
            unit: screwDef.unit,
            unitPrice: screwDef.value,
            totalPrice: extraScrews * screwDef.value,
            autoGenerated: true
        });
    }

    // --- TAPA FUROS LOGIC ---
    // Quantity of Tapa Furos = Total Screws from Cutlist (stats.totalScrews)
    const tapaFuroQty = stats.totalScrews;
    if (tapaFuroQty > 0) {
        const tapaFuroDef = materials.find(m => m.name.toLowerCase().includes('tapa furo')) || { value: 0.06, unit: 'un' };
        list.push({
            category: 'Automático',
            name: 'Tapa Furos (Ref. Parafusos)',
            quantity: tapaFuroQty,
            unit: tapaFuroDef.unit,
            unitPrice: tapaFuroDef.value,
            totalPrice: tapaFuroQty * tapaFuroDef.value,
            autoGenerated: true
        });
    }

    return list;
  }, [pieces, projectComponents, fixedComponents, materials, stats.totalScrews]);

  const chartData = [
    { name: 'Material', value: stats.totalMaterialCost, color: '#6366f1' },
    { name: 'Comp.', value: stats.totalComponentCost, color: '#8b5cf6' },
    { name: 'Mão Obra', value: stats.totalLaborCost, color: '#ec4899' },
    { name: 'Fixo', value: stats.totalFixedCost, color: '#f59e0b' },
    { name: 'Lucro', value: stats.profit, color: '#10b981' },
  ];

  const margin = stats.realizedMargin;
  let healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  let healthTitle = 'Excelente';
  let healthDesc = 'Produto com alta rentabilidade.';
  let barColor = 'bg-emerald-500';

  if (margin <= 0) {
      healthColor = 'text-rose-600 bg-rose-50 border-rose-100';
      healthTitle = 'Prejuízo';
      healthDesc = 'Preço de venda não cobre os custos.';
      barColor = 'bg-rose-500';
  } else if (margin < 10) {
      healthColor = 'text-amber-600 bg-amber-50 border-amber-100';
      healthTitle = 'Baixa';
      healthDesc = 'Margem apertada. Atenção aos custos.';
      barColor = 'bg-amber-500';
  } else if (margin < 25) {
      healthColor = 'text-blue-600 bg-blue-50 border-blue-100';
      healthTitle = 'Saudável';
      healthDesc = 'Margem dentro do padrão de mercado.';
      barColor = 'bg-blue-500';
  }
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catName = e.target.value;
    const cat = categories.find(c => c.name === catName);
    onUpdateSettings({ 
      productCategory: catName,
      profitMargin: cat ? cat.idealMargin : settings.profitMargin 
    });
  };

  const handleAddService = () => {
      if (!newServiceDesc || !newServiceVal) return;
      onAddService({
          description: newServiceDesc,
          value: parseFloat(newServiceVal)
      });
      setNewServiceDesc('');
      setNewServiceVal('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              if (reader.result) {
                  setProposalImages(prev => [...prev, reader.result as string]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const removeImage = (index: number) => {
      setProposalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
      if (!clientName) {
          alert("Por favor, insira o nome do cliente para salvar a proposta.");
          return;
      }
      if (!projectName) {
          alert("Por favor, insira o nome do projeto para salvar a proposta.");
          return;
      }
      onSaveProposal(
          clientName, 
          projectName, 
          clientPhone, 
          serviceNotes, 
          validityDays,
          warrantyTime,
          deliveryTime,
          paymentCondition,
          proposalImages
      );
  };

  const handlePreviewPDF = () => {
      if (!clientName) {
          alert("Por favor, insira o nome do cliente para gerar a proposta.");
          return;
      }
      if (!projectName) {
          alert("Por favor, insira o nome do projeto para gerar a proposta.");
          return;
      }
      try {
        const doc = createProposalDocument(
            stats, cardRates, settings, 
            clientName, clientPhone, projectName, 
            additionalServices, serviceNotes, validityDays,
            warrantyTime, deliveryTime, paymentCondition, proposalImages,
            includeContract, proposalCode
        );
        setGeneratedDoc(doc);
        
        // Create Blob URL for preview
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setShowPreview(true);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar o PDF. Verifique se todos os dados estão preenchidos corretamente.");
      }
  };

  const handleDownloadPDF = () => {
      if (generatedDoc) {
          generatedDoc.save(`Proposta_${clientName.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
      }
      handleClosePreview();
  };

  const handleOpenNewTab = () => {
      if (pdfUrl) {
          window.open(pdfUrl, '_blank');
      }
  };

  const handleClosePreview = () => {
      setShowPreview(false);
      if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
      }
  };

  const categoryOptions = categories.map(c => ({ value: c.name, label: c.name }));

  const fmtMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 relative">
      {/* PDF Preview Modal */}
      {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Visualizar Proposta</h3>
                        <p className="text-xs text-slate-500">Número: {proposalCode}</p>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={handleOpenNewTab} className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                            Abrir em Nova Aba
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
                                <p className="mb-4">Seu navegador não conseguiu exibir o PDF diretamente aqui.</p>
                                <button onClick={handleOpenNewTab} className="text-indigo-600 underline font-bold">
                                    Clique aqui para abrir o PDF
                                </button>
                            </div>
                        </object>
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-400">Carregando visualização...</div>
                     )}
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button onClick={handleClosePreview} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">
                        Voltar e Editar
                    </button>
                    <button onClick={handleDownloadPDF} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                         <span>Baixar PDF Agora</span>
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Top Section: Final Price & Proposal Data (Horizontal Layout) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl text-white overflow-hidden">
        <div className="flex flex-col lg:flex-row">
            {/* Left Side: Price & Profit */}
            <div className="p-8 lg:w-1/2 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-700/50 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                        <DollarSignIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-300 font-medium uppercase tracking-wider text-sm">Preço Final de Venda</p>
                </div>
                
                <h2 className="text-5xl font-bold text-white tracking-tight mb-2">
                    {fmtMoney(stats.salesPrice)}
                </h2>

                <div className="flex flex-col gap-2 mt-4">
                    <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                        <span className="text-slate-400">Lucro Líquido</span>
                        <span className="text-emerald-400 font-bold text-lg">+ {fmtMoney(stats.profit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Margem Real</span>
                         <span className={`font-bold px-2 py-0.5 rounded ${stats.realizedMargin > 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                             {fmtNum(stats.realizedMargin)}%
                         </span>
                    </div>
                    {rate12x > 0 && (
                         <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-slate-400">Taxa 12x Inclusa ({rate12x}%)</span>
                            <span className="text-amber-400 font-medium">Incluído</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Proposal Inputs (Simplified) */}
            <div className="p-8 lg:w-1/2 bg-slate-800/50 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Dados do Cliente
                    </h3>
                    <span className="text-xs font-mono text-slate-400 border border-slate-700 rounded px-2 py-1">{proposalCode}</span>
                </div>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Nome do Cliente" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <div className="flex gap-4">
                        <input 
                            type="tel" 
                            placeholder="Telefone" 
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-1/2 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        <input 
                            type="text" 
                            placeholder="Nome do Projeto" 
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-1/2 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-3 mt-2">
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-slate-700 text-white font-bold py-3.5 rounded-xl hover:bg-slate-600 transition-all shadow-lg border border-slate-600"
                        >
                            Salvar Proposta
                        </button>
                        <button 
                            onClick={handlePreviewPDF}
                            className="flex-1 bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.99]"
                        >
                            <span className="text-indigo-600"><CalculatorIcon className="w-5 h-5" /></span>
                            Gerar PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Navigation Tabs - Mobile Friendly */}
      <div className="bg-slate-100 pt-2 pb-2">
          <div className="flex p-1 bg-slate-200/60 rounded-xl w-full md:w-fit backdrop-blur-sm shadow-sm">
            <button 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'calculation' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('calculation')}
            >
            Cálculos e Ajustes
            </button>
            <button 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('dashboard')}
            >
            Dashboard Financeiro
            </button>
             <button 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('report')}
            >
            Relatório de Materiais (BOM)
            </button>
          </div>
      </div>

      {/* Main Content Area */}
      
      {activeTab === 'calculation' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-6">
            <Card title="Configuração de Venda" subtitle="Ajuste as margens para calcular o preço ideal.">
            <div className="space-y-6">
                <Select 
                label="Categoria do Produto" 
                options={[{value: '', label: 'Personalizado'}, ...categoryOptions]}
                value={settings.productCategory}
                onChange={handleCategoryChange}
                className="text-lg"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label="Margem de Lucro (%)" 
                        type="number" 
                        value={settings.profitMargin} 
                        onChange={e => onUpdateSettings({ profitMargin: Number(e.target.value) })} 
                        className="font-medium"
                    />
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Desconto à Vista (%)</label>
                        <input
                            type="text"
                            value={`${rate12x}%`}
                            readOnly
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 font-bold cursor-not-allowed"
                        />
                         <span className="text-xs text-amber-600 ml-1">*Refere-se à taxa de 12x que é removida no pagamento à vista.</span>
                    </div>
                    <Input 
                        label="Custos Extras (R$)" 
                        type="number" 
                        value={settings.extraHours} 
                        onChange={e => onUpdateSettings({ extraHours: Number(e.target.value) })} 
                    />
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Validade da Proposta</label>
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4">
                            <input 
                                type="number" 
                                value={validityDays}
                                onChange={(e) => setValidityDays(e.target.value)}
                                className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:ring-0 py-2.5"
                            />
                            <span className="text-slate-400 text-xs font-medium uppercase">dias</span>
                        </div>
                    </div>
                </div>
            </div>
            </Card>

            {/* Additional Services Section */}
             <Card title="Serviços Adicionais" subtitle="Frete, Instalação ou serviços extras.">
                 <div className="space-y-4">
                     {/* List of added services */}
                     {additionalServices.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {additionalServices.map(s => (
                                <div key={s.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <span className="text-sm text-slate-700 font-medium">{s.description}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-mono font-semibold text-slate-800">{fmtMoney(s.value)}</span>
                                        <button onClick={() => onRemoveService(s.id)} className="text-slate-400 hover:text-rose-500">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}

                     {/* Add Service Form */}
                     <div className="flex gap-3 items-end bg-blue-50/50 p-3 rounded-xl border border-blue-200 border-dashed">
                         <div className="flex-1">
                            <input 
                                type="text" 
                                placeholder="Descrição do serviço" 
                                value={newServiceDesc}
                                onChange={e => setNewServiceDesc(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            />
                         </div>
                         <div className="w-32">
                            <input 
                                type="number" 
                                placeholder="Valor R$" 
                                value={newServiceVal}
                                onChange={e => setNewServiceVal(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            />
                         </div>
                         <button 
                            onClick={handleAddService}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                         >
                             <PlusIcon className="w-5 h-5" />
                         </button>
                     </div>
                </div>
            </Card>

            <Card title="Detalhes do Documento" subtitle="Informações que aparecerão no PDF gerado.">
                 <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Tempo de Garantia" 
                            value={warrantyTime} 
                            onChange={e => setWarrantyTime(e.target.value)}
                            placeholder="Ex: 5 Anos" 
                        />
                         <Input 
                            label="Prazo de Entrega" 
                            value={deliveryTime} 
                            onChange={e => setDeliveryTime(e.target.value)}
                            placeholder="Ex: 15 dias úteis" 
                        />
                    </div>

                    <Select 
                        label="Condição de Pagamento" 
                        options={[
                            {value: 'Sinal 50%', label: 'Sinal de 50% + Restante na entrega'},
                            {value: 'À Vista', label: 'À Vista'},
                            {value: 'Parcelado', label: 'Parcelado (Cartão/Boleto)'}
                        ]}
                        value={paymentCondition}
                        onChange={e => setPaymentCondition(e.target.value)}
                    />
                    
                    {/* Image Upload */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 ml-1 mb-2 block">Fotos do Produto (Para PDF)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            {proposalImages.map((img, index) => (
                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                    <img src={img} alt={`Produto ${index}`} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-white/90 text-rose-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <label className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all aspect-square bg-white">
                                <PlusIcon className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-xs text-slate-500 font-medium">Add Foto</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <p className="text-xs text-slate-400">Adicione pelo menos 2 fotos para ilustrar o orçamento.</p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700 ml-1 mb-2 block">Observações / Escopo</label>
                        <textarea
                            placeholder="Detalhes técnicos ou escopo do projeto..."
                            value={serviceNotes}
                            onChange={(e) => setServiceNotes(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none h-24"
                        />
                    </div>
                    
                    {/* Contract Toggle */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <input 
                            type="checkbox" 
                            id="contractToggle"
                            checked={includeContract}
                            onChange={(e) => setIncludeContract(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                            <label htmlFor="contractToggle" className="text-sm font-semibold text-slate-800 cursor-pointer">Anexar Contrato de Compra e Venda</label>
                            <p className="text-xs text-slate-500">Se marcado, o contrato configurado nas definições da empresa será adicionado ao final do PDF.</p>
                        </div>
                    </div>
                 </div>
            </Card>
        </div>

        {/* Right Column: Payment Simulation & Costs */}
        <div className="lg:col-span-1 space-y-6">
             <Card title="Simulação de Parcelamento" subtitle="O valor base agora é o preço em 12x.">
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-2">Parc.</th>
                                <th className="px-3 py-2 text-right">Valor Parc.</th>
                                <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {/* Card Rates Logic: The salesPrice is already the 12x price (Highest Price).
                                So for lower rates or cash, we discount backwards from this highest price,
                                effectively showing what the price IS if we don't have to pay the 12x fee.
                                
                                Base Price (12x) = CashPrice / (1 - Rate12x)
                                CashPrice = BasePrice * (1 - Rate12x)
                            */}
                            {cardRates.map(cr => {
                                // Logic: Convert the current 12x-based SalesPrice back to Cash Price, then apply this row's rate
                                // CashPrice = SalesPrice * (1 - rate12x/100)
                                // ThisRowPrice = CashPrice / (1 - cr.rate/100)
                                const cashPrice = stats.salesPrice * (1 - (rate12x/100));
                                const totalWithRate = cashPrice / (1 - (cr.rate/100));
                                
                                const installmentValue = totalWithRate / cr.installments;
                                return (
                                    <tr key={cr.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700">{cr.installments}x</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{fmtMoney(installmentValue)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-slate-800">{fmtMoney(totalWithRate)}</td>
                                    </tr>
                                );
                            })}
                             {/* Cash Row at Bottom */}
                            <tr className="bg-emerald-50/50">
                                <td className="px-3 py-2 font-bold text-emerald-700">À Vista</td>
                                <td className="px-3 py-2 text-right text-slate-600">-</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-700">
                                    {fmtMoney(stats.salesPrice * (1 - (rate12x/100)))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
             </Card>

             <Card title="Detalhamento de Custos (Cálculo)">
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                            {/* Material Breakdown */}
                            {stats.totalMdfCost > 0 && (
                                <tr className="bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-600">MDF/Madeira</td>
                                    <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalMdfCost)}</td>
                                </tr>
                            )}
                            {stats.totalMetalCost > 0 && (
                                <tr className="bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-600">Serralheria (Material)</td>
                                    <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalMetalCost)}</td>
                                </tr>
                            )}
                            {stats.totalGlassCost > 0 && (
                                <tr className="bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-600">Vidraçaria (Material)</td>
                                    <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalGlassCost)}</td>
                                </tr>
                            )}
                             
                            {/* If no split, show total */}
                            {(stats.totalMdfCost === 0 && stats.totalMetalCost === 0 && stats.totalGlassCost === 0) && (
                                 <tr className="bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-600">Materiais (Geral)</td>
                                    <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalMaterialCost)}</td>
                                </tr>
                            )}

                            <tr>
                                <td className="px-4 py-3 text-slate-600">Componentes e Ferragens</td>
                                <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalComponentCost)}</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-600">Fitas de Borda</td>
                                <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalTapeCost)}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 text-slate-600">Mão de Obra Direta</td>
                                <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalLaborCost)}</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-600">Rateio Custos Fixos</td>
                                <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalFixedCost)}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 text-slate-600">Serviços Adicionais</td>
                                <td className="px-4 py-3 font-medium text-right">{fmtMoney(stats.totalAdditionalServicesCost)}</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-600">Custos Extras (Config)</td>
                                <td className="px-4 py-3 font-medium text-right">{fmtMoney(settings.extraHours)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 border-t border-slate-200">
                            <tr>
                                <td className="px-4 py-3 font-bold text-slate-700">Subtotal (Custo Puro)</td>
                                <td className="px-6 py-4 font-bold text-slate-800 text-right">{fmtMoney(stats.finalCost)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
      </div>
      )}
      
      {activeTab === 'dashboard' && (
      <div className="space-y-8 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BoxIcon className="w-5 h-5 text-indigo-500" />
            Análise Financeira do Projeto
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Preço de Venda (12x)" 
                value={fmtMoney(stats.salesPrice)} 
                icon={<DollarSignIcon className="w-6 h-6" />} 
                bgClass="bg-emerald-50 border-emerald-100/50"
                textClass="text-emerald-700"
                subValue="Preço Final (Base)"
            />
            <StatCard 
                title="Custo Total" 
                value={fmtMoney(stats.finalCost)} 
                icon={<CalculatorIcon className="w-6 h-6" />} 
                bgClass="bg-rose-50 border-rose-100/50"
                textClass="text-rose-700"
                subValue="Materiais + Mão de Obra + Fixo"
            />
            
            {/* Profitability Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Rentabilidade</p>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${healthColor} mb-2`}>
                            {healthTitle}
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg ${healthColor.split(' ')[1]}`}>
                        <span className={`text-lg font-bold ${healthColor.split(' ')[0]}`}>{fmtNum(margin)}%</span>
                    </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                    <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}></div>
                </div>
                <p className="text-xs text-slate-400">{healthDesc}</p>
            </div>

            <StatCard 
                title="Tempo Estimado" 
                value={`${Math.ceil(stats.totalMinutes / 60)}h ${Math.round(stats.totalMinutes % 60)}m`} 
                icon={<BoxIcon className="w-6 h-6" />} 
                bgClass="bg-amber-50 border-amber-100/50"
                textClass="text-amber-700"
                subValue="Produção + Montagem"
            />
        </div>

        <div className="grid grid-cols-1 gap-8">
             <Card title="Composição do Preço" subtitle="Análise visual de onde está indo o dinheiro.">
                <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(val) => `R$${val}`} 
                    />
                    <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [fmtMoney(value), 'Valor']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </Card>
        </div>
      </div>
      )}

      {activeTab === 'report' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4 items-start">
                  <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm mt-1">
                       <FolderIcon className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-indigo-900">Relatório de Materiais (BOM)</h3>
                      <p className="text-sm text-indigo-700 mt-1">
                          Esta lista consolida toda a matéria prima, fitas e componentes. 
                          Os itens marcados como <span className="font-bold bg-white px-1 rounded text-xs border border-indigo-200">AUTO</span> foram calculados automaticamente baseados na lógica de ferragens (ex: Tubo Cabideiro gera Suportes; Parafusos calculados por corrediças/suportes; Tapa Furos baseados nos parafusos totais).
                      </p>
                  </div>
              </div>

              <Card title="Lista Completa de Materiais">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                        <th className="px-6 py-4 rounded-tl-lg">Categoria</th>
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4 text-center">Qtd</th>
                        <th className="px-6 py-4">Unitário</th>
                        <th className="px-6 py-4 text-right rounded-tr-lg">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {bomData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-500">{item.category}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">
                                    {item.name}
                                    {item.autoGenerated && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">AUTO</span>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">{fmtNum(item.quantity)} {item.unit}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{fmtMoney(item.unitPrice)}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800">{fmtMoney(item.totalPrice)}</td>
                            </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold border-t border-slate-200">
                            <td colSpan={4} className="px-6 py-4 text-right text-slate-700">Custo Total de Materiais:</td>
                            <td className="px-6 py-4 text-right text-indigo-700">
                                {fmtMoney(bomData.reduce((acc, curr) => acc + curr.totalPrice, 0))}
                            </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
            </Card>
          </div>
      )}
    </div>
  );
};