import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button } from '../UIComponents';
import { AppSettings } from '../../types';
import { TrashIcon, XIcon } from '../Icons';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
}

// Simple internal Image Cropper Component
const ImageCropper = ({ src, onCancel, onSave }: { src: string, onCancel: () => void, onSave: (base64: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            setImg(image);
            // Center image initially
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                // Fit logic roughly
                const scaleX = canvas.width / image.width;
                const scaleY = canvas.height / image.height;
                const initScale = Math.min(scaleX, scaleY) * 0.8;
                setScale(initScale);
                setPosition({
                    x: (canvas.width - image.width * initScale) / 2,
                    y: (canvas.height - image.height * initScale) / 2
                });
            }
        };
    }, [src]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and draw background - WHITE for non-transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        ctx.restore();

    }, [img, scale, position]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleSave = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Ajustar Imagem</h3>
                    <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-full"><XIcon className="w-6 h-6 text-slate-500"/></button>
                </div>
                
                <div className="relative border-2 border-slate-200 rounded-xl overflow-hidden cursor-move touch-none"
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}>
                    <canvas ref={canvasRef} width={400} height={300} className="w-full h-auto block" />
                    <div className="absolute inset-0 pointer-events-none border-4 border-indigo-500/20"></div>
                </div>
                
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">Zoom:</span>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.1" 
                        value={scale} 
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                <div className="flex gap-3 justify-end mt-2">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave}>Confirmar Recorte</Button>
                </div>
            </div>
        </div>
    );
};

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [cropImage, setCropImage] = useState<{ src: string, key: 'logo' | 'signature' } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'signature') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Open cropper instead of setting directly
              setCropImage({ src: reader.result as string, key });
              // Reset input
              e.target.value = ''; 
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCroppedSave = (base64: string) => {
      if (cropImage) {
          onUpdateSettings({ [cropImage.key]: base64 });
          setCropImage(null);
      }
  };

  const clearImage = (key: 'logo' | 'signature') => {
      onUpdateSettings({ [key]: '' });
  };

  const checkCEP = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const cep = e.target.value.replace(/\D/g, '');
      onUpdateSettings({ companyCEP: e.target.value });
      
      if (cep.length === 8) {
          try {
              const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
              const data = await res.json();
              if (!data.erro) {
                  onUpdateSettings({
                      companyAddress: data.logradouro,
                      companyNeighborhood: data.bairro,
                      companyCity: `${data.localidade}/${data.uf}`,
                      companyCEP: data.cep
                  });
              }
          } catch (error) {
              console.error("Erro ao buscar CEP", error);
          }
      }
  };

  // --- Masks ---
  const maskCNPJ = (value: string) => {
      return value
          .replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
          .substring(0, 18);
  };

  const maskPhone = (value: string) => {
      return value
          .replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d)(\d{4})$/, '$1-$2')
          .substring(0, 15);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {cropImage && (
          <ImageCropper 
            src={cropImage.src} 
            onCancel={() => setCropImage(null)} 
            onSave={handleCroppedSave} 
          />
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card title="Dados da Empresa" subtitle="Informações que aparecerão no cabeçalho do PDF.">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="Nome Fantasia" 
                value={settings.companyName || ''} 
                onChange={e => onUpdateSettings({ companyName: e.target.value })} 
                placeholder="Ex: Móveis Planejados Silva"
              />
               <Input 
                label="Razão Social" 
                value={settings.companyCorporateName || ''} 
                onChange={e => onUpdateSettings({ companyCorporateName: e.target.value })} 
                placeholder="Ex: Silva Marcenaria LTDA"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input 
                  label="CNPJ" 
                  value={settings.companyCNPJ || ''} 
                  onChange={e => onUpdateSettings({ companyCNPJ: maskCNPJ(e.target.value) })} 
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                 <Input 
                  label="Telefone Fixo" 
                  value={settings.companyPhone || ''} 
                  onChange={e => onUpdateSettings({ companyPhone: maskPhone(e.target.value) })} 
                  placeholder="(00) 0000-0000"
                  maxLength={15}
                />
                <Input 
                  label="WhatsApp" 
                  value={settings.companyWhatsapp || ''} 
                  onChange={e => onUpdateSettings({ companyWhatsapp: maskPhone(e.target.value) })} 
                  placeholder="(00) 90000-0000"
                  maxLength={15}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input 
                  label="CEP" 
                  value={settings.companyCEP || ''} 
                  onChange={checkCEP} 
                  placeholder="00000-000"
                  maxLength={9}
                />
                <div className="md:col-span-2">
                    <Input 
                    label="Cidade / UF" 
                    value={settings.companyCity || ''} 
                    onChange={e => onUpdateSettings({ companyCity: e.target.value })} 
                    placeholder="Cidade/UF"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Endereço (Rua, Número)" 
                  value={settings.companyAddress || ''} 
                  onChange={e => onUpdateSettings({ companyAddress: e.target.value })} 
                  placeholder="Rua Exemplo, 123"
                />
                <Input 
                  label="Bairro" 
                  value={settings.companyNeighborhood || ''} 
                  onChange={e => onUpdateSettings({ companyNeighborhood: e.target.value })} 
                  placeholder="Bairro"
                />
            </div>
            <Input 
              label="Email de Contato" 
              value={settings.companyEmail || ''} 
              onChange={e => onUpdateSettings({ companyEmail: e.target.value })} 
              placeholder="contato@empresa.com"
            />
          </div>
        </Card>

        <Card title="Personalização Visual" subtitle="Adicione sua marca aos orçamentos.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 block">Logotipo da Empresa</label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 bg-white hover:bg-slate-50 transition-colors relative">
                        {settings.logo ? (
                            <div className="relative w-full h-32 flex items-center justify-center bg-white border border-slate-100 rounded">
                                <img src={settings.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                                <button 
                                    onClick={() => clearImage('logo')}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 text-rose-500 hover:text-rose-700"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="mx-auto w-12 h-12 text-slate-300 mb-2">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <label htmlFor="logo-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                                    Carregar imagem
                                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                                </label>
                                <p className="text-xs text-slate-400 mt-1">PNG, JPG (Max 2MB)</p>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">Ao carregar, você poderá recortar e ajustar a imagem.</p>
                </div>

                {/* Signature Upload */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 block">Assinatura Digital</label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 bg-white hover:bg-slate-50 transition-colors relative">
                        {settings.signature ? (
                            <div className="relative w-full h-32 flex items-center justify-center bg-white border border-slate-100 rounded">
                                <img src={settings.signature} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                                <button 
                                    onClick={() => clearImage('signature')}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 text-rose-500 hover:text-rose-700"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="mx-auto w-12 h-12 text-slate-300 mb-2">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </div>
                                <label htmlFor="signature-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                                    Carregar imagem
                                    <input id="signature-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} />
                                </label>
                                <p className="text-xs text-slate-400 mt-1">PNG, JPG (Fundo Transparente)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>

        <Card title="Configuração de Documentos" subtitle="Personalize os termos de garantia e contrato.">
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-2 block">Termos de Garantia</label>
                    <textarea
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all
                        focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[150px]"
                        value={settings.warrantyTerms || ''}
                        onChange={e => onUpdateSettings({ warrantyTerms: e.target.value })}
                        placeholder="Digite aqui os termos de garantia..."
                    />
                </div>
                
                 <div>
                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-2 block">Contrato de Compra e Venda</label>
                    <textarea
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all
                        focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[150px]"
                        value={settings.contractTerms || ''}
                        onChange={e => onUpdateSettings({ contractTerms: e.target.value })}
                        placeholder="Digite aqui o modelo de contrato..."
                    />
                    <p className="text-xs text-slate-500 mt-1">Este texto aparecerá numa página extra caso você selecione a opção "Anexar Contrato" na tela de Precificação.</p>
                </div>
            </div>
        </Card>
        
        <div className="flex justify-end">
            <div className="text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Alterações são salvas automaticamente.
            </div>
        </div>
      </div>
    </div>
  );
};