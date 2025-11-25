
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Material, Piece, ProjectComponent, Category, Labor, FixedCost, AppSettings, ProjectStats, FixedComponent, CardRate, AdditionalService, SavedProposal, ProposalItem, ProposalStatus, LoadedProposalData } from '../types';

const STORAGE_KEY = 'moveispro_data_v1';

const DEFAULT_MATERIALS: Material[] = [
  // --- Matéria Prima (Raw Materials) ---
  { id: 'm1', name: 'MDF Branco 15mm', unit: 'm2', value: 45.73, type: 'material' },
  { id: 'm2', name: 'MDF Cinza Asfalto 15mm', unit: 'm2', value: 69.58, type: 'material' },
  { id: 'm3', name: 'MDF Rosa Milkshake', unit: 'm2', value: 81.51, type: 'material' },
  { id: 'm4', name: 'MDF Preto 15mm', unit: 'm2', value: 69.58, type: 'material' },
  { id: 'm5', name: 'MDF Floresta 15mm', unit: 'm2', value: 67.59, type: 'material' },
  { id: 'm6', name: 'MDF Amadeirado', unit: 'm2', value: 69.58, type: 'material' },
  { id: 'm7', name: 'Duraplac', unit: 'm2', value: 17.07, type: 'material' },
  { id: 'm8', name: 'Ripão Revestido', unit: 'm', value: 5.00, type: 'material' },
  { id: 'm9', name: 'Compensado', unit: 'm2', value: 200.00, type: 'material' },
  { id: 'm10', name: 'Metalon Galvanizado', unit: 'm2', value: 6.00, type: 'material' },
  { id: 'm11', name: 'Metalon 30x30', unit: 'm', value: 9.17, type: 'material' },
  { id: 'm12', name: 'Metalon 20x20', unit: 'm', value: 7.00, type: 'material' },
  { id: 'm13', name: 'Metalon 50x30', unit: 'm', value: 13.00, type: 'material' },
  { id: 'm14', name: 'MDF Branco 6mm', unit: 'm2', value: 33.80, type: 'material' },
  { id: 'm15', name: 'Painel Canaletado', unit: 'm2', value: 75.55, type: 'material' },

  // --- Tintas (Automotiva e Cores) ---
  { id: 'pt1', name: 'Tinta Automotiva Branco', unit: 'L', value: 45.00, type: 'component', minutage: 0 },
  { id: 'pt2', name: 'Tinta Automotiva Preto', unit: 'L', value: 45.00, type: 'component', minutage: 0 },
  { id: 'pt3', name: 'Tinta Automotiva Dourado', unit: 'L', value: 55.00, type: 'component', minutage: 0 },
  { id: 'pt4', name: 'Tinta Automotiva (Cores)', unit: 'L', value: 45.00, type: 'component', minutage: 0 },

  // --- Fitas de Borda (Essenciais para cálculo automático) ---
  { id: 't1', name: 'Fita Branco', unit: 'm', value: 1.20, type: 'component', minutage: 0 },
  { id: 't2', name: 'Fita Amadeirado', unit: 'm', value: 2.50, type: 'component', minutage: 0 },
  { id: 't3', name: 'Fita Cinza', unit: 'm', value: 1.50, type: 'component', minutage: 0 },
  { id: 't4', name: 'Fita Preto', unit: 'm', value: 1.50, type: 'component', minutage: 0 },

  // --- Componentes e Ferragens (Lista Solicitada) ---
  { id: 'nc0', name: 'Parafuso 3.5x14', unit: 'unidade', value: 0.04, type: 'component', minutage: 0 }, // Adicionado para lógica automática
  { id: 'nc1', name: 'Parafuso 3.5x16', unit: 'unidade', value: 0.05, type: 'component', minutage: 0 },
  { id: 'nc2', name: 'Parafuso 4x40', unit: 'unidade', value: 0.10, type: 'component', minutage: 0 },
  { id: 'nc3', name: 'Parafuso 25x35', unit: 'unidade', value: 0.08, type: 'component', minutage: 0 },
  { id: 'nc4', name: 'Parafuso 60x60', unit: 'unidade', value: 0.45, type: 'component', minutage: 0 },
  { id: 'nc5', name: 'Cantoneira', unit: 'unidade', value: 0.20, type: 'component', minutage: 0 },
  { id: 'nc6', name: 'Tapa Furo', unit: 'unidade', value: 0.06, type: 'component', minutage: 0 },
  { id: 'nc7', name: 'Bucha N8', unit: 'unidade', value: 0.10, type: 'component', minutage: 0 },
  { id: 'nc8', name: 'Bucha N6', unit: 'unidade', value: 0.05, type: 'component', minutage: 0 },
  { id: 'nc9', name: 'Pregos 0.8x0.8', unit: 'kg', value: 60.00, type: 'component', minutage: 0 },
  { id: 'nc10', name: 'Cola Branca', unit: 'kg', value: 16.00, type: 'component', minutage: 0 },
  { id: 'nc11', name: 'Cola de Contato', unit: 'kg', value: 67.00, type: 'component', minutage: 0 },
  { id: 'nc12', name: 'Puxador Redondo', unit: 'unidade', value: 4.00, type: 'component', minutage: 0 },
  { id: 'nc13', name: 'Puxador Haste', unit: 'unidade', value: 5.00, type: 'component', minutage: 0 },
  { id: 'nc14', name: 'Corrediça Steel Reforçada', unit: 'unidade', value: 17.00, type: 'component', minutage: 0 },
  { id: 'nc15', name: 'Corrediça 400mm', unit: 'par', value: 11.00, type: 'component', minutage: 0 },
  { id: 'nc16', name: 'Corrediça 350mm', unit: 'par', value: 9.50, type: 'component', minutage: 0 },
  { id: 'nc17', name: 'Corrediça 300mm', unit: 'par', value: 9.00, type: 'component', minutage: 0 },
  { id: 'nc18', name: 'Corrediça 250mm', unit: 'par', value: 8.50, type: 'component', minutage: 0 },
  { id: 'nc19', name: 'Dobradiça Reta', unit: 'unidade', value: 3.20, type: 'component', minutage: 0 },
  { id: 'nc20', name: 'Dobradiça Curva', unit: 'unidade', value: 3.20, type: 'component', minutage: 0 },
  { id: 'nc21', name: 'Dobradiça Supercurva', unit: 'unidade', value: 3.20, type: 'component', minutage: 0 },
  { id: 'nc22', name: 'Dobradiça Flo Aço 3/12 c/3', unit: 'unidade', value: 22.90, type: 'component', minutage: 0 },
  { id: 'nc23', name: 'Pregos (un)', unit: 'unidade', value: 0.01, type: 'component', minutage: 0 },
  { id: 'nc24', name: 'Verniz', unit: 'L', value: 25.00, type: 'component', minutage: 0 },
  { id: 'nc25', name: 'Pé Palito', unit: 'unidade', value: 8.00, type: 'component', minutage: 0 },
  { id: 'nc26', name: 'Tubo Cabideiro', unit: 'm', value: 10.65, type: 'component', minutage: 0 },
  { id: 'nc27', name: 'Suporte Cabideiro', unit: 'unidade', value: 1.00, type: 'component', minutage: 0 },
  { id: 'nc28', name: 'Cantoneira em L', unit: 'unidade', value: 1.50, type: 'component', minutage: 0 },
  { id: 'nc29', name: 'Suporte Invisível', unit: 'unidade', value: 7.00, type: 'component', minutage: 0 },
  { id: 'nc30', name: 'Pés Branco p/ Organizador', unit: 'unidade', value: 4.00, type: 'component', minutage: 0 },
  { id: 'nc31', name: 'Perfil Puxador Alumínio', unit: 'unidade', value: 21.67, type: 'component', minutage: 0 },
  { id: 'nc32', name: 'Perfil Puxador Inox', unit: 'unidade', value: 28.00, type: 'component', minutage: 0 },
  { id: 'nc33', name: 'Perfil Puxador Bronze', unit: 'unidade', value: 35.00, type: 'component', minutage: 0 },
  { id: 'nc34', name: 'Sistema Porta de Correr Maior', unit: 'par', value: 56.00, type: 'component', minutage: 0 },
  { id: 'nc35', name: 'Sistema Porta de Correr Menor', unit: 'par', value: 25.00, type: 'component', minutage: 0 },
  { id: 'nc36', name: 'Trilho p/ Porta Inferior', unit: 'm', value: 24.00, type: 'component', minutage: 0 },
  { id: 'nc37', name: 'Trilho p/ Porta Superior', unit: 'm', value: 26.00, type: 'component', minutage: 0 },
  { id: 'nc38', name: 'Suporte Painel', unit: 'unidade', value: 10.00, type: 'component', minutage: 0 },
  { id: 'nc39', name: 'Perfil de Borda', unit: 'm', value: 5.50, type: 'component', minutage: 0 },
  { id: 'nc40', name: 'Sapatas Pequenas', unit: 'unidade', value: 0.40, type: 'component', minutage: 0 },
  { id: 'nc41', name: 'Sapatas Niveladoras', unit: 'unidade', value: 4.00, type: 'component', minutage: 0 },
  { id: 'nc42', name: 'Ganchos Pequenos', unit: 'unidade', value: 1.30, type: 'component', minutage: 0 },
  { id: 'nc43', name: 'Bocal de Lâmpadas', unit: 'unidade', value: 2.00, type: 'component', minutage: 0 },
  { id: 'nc44', name: 'Rodízio com Freio', unit: 'unidade', value: 7.50, type: 'component', minutage: 0 },
  { id: 'nc45', name: 'Rodízio sem Freio', unit: 'unidade', value: 6.50, type: 'component', minutage: 0 },
  { id: 'nc46', name: 'Espelho', unit: 'm2', value: 92.11, type: 'component', minutage: 0 },
  { id: 'nc47', name: 'Vidro 4mm', unit: 'm2', value: 190.00, type: 'component', minutage: 0 },
  { id: 'nc48', name: 'Vidro 6mm', unit: 'm2', value: 328.00, type: 'component', minutage: 0 },
  { id: 'nc49', name: 'Pés de Metal Quadrado', unit: 'unidade', value: 9.90, type: 'component', minutage: 0 },
  { id: 'nc50', name: 'Suporte p/ Vidro 6mm', unit: 'unidade', value: 1.00, type: 'component', minutage: 0 },
  { id: 'nc51', name: 'Copinho de LD', unit: 'unidade', value: 10.00, type: 'component', minutage: 0 },
  { id: 'nc52', name: 'Pulsador', unit: 'unidade', value: 3.00, type: 'component', minutage: 0 },
  { id: 'nc53', name: 'Basculante', unit: 'unidade', value: 8.00, type: 'component', minutage: 0 },
  { id: 'nc54', name: 'Perfil de Acabamento', unit: 'm', value: 10.50, type: 'component', minutage: 0 },
  { id: 'nc55', name: 'Lâmpadas para Camarim', unit: 'unidade', value: 2.70, type: 'component', minutage: 0 },
  { id: 'nc56', name: 'Articulador para Sapateira', unit: 'par', value: 25.00, type: 'component', minutage: 0 },
  { id: 'nc57', name: 'Perfil - Porta de Espelho', unit: 'm', value: 48.33, type: 'component', minutage: 0 },
  { id: 'nc58', name: 'Perfil Pux Porta de Espelho', unit: 'm', value: 26.77, type: 'component', minutage: 0 },
];

const DEFAULT_LABOR: Labor[] = [
  // Marcenaria
  { id: '1', description: 'Corte', minutage: 1.5, valuePerMinute: 0, category: 'Marcenaria' },
  { id: '2', description: 'Colagem e Acabamento', minutage: 5, valuePerMinute: 0, category: 'Marcenaria' },
  { id: '3', description: 'Montagem', minutage: 0.3, valuePerMinute: 0, category: 'Marcenaria' },
  
  // Serralheria (Metalon)
  { id: '4', description: 'Corte Metalon', minutage: 5, valuePerMinute: 0, category: 'Serralheria' },
  { id: '5', description: 'Lixagem', minutage: 3, valuePerMinute: 0, category: 'Serralheria' },
  { id: '6', description: 'Soldagem', minutage: 10, valuePerMinute: 0, category: 'Serralheria' },
  { id: '7', description: 'Pintura', minutage: 15, valuePerMinute: 0, category: 'Serralheria' }, // Agora por metro

  // Vidraçaria
  { id: '8', description: 'Corte Vidro', minutage: 5, valuePerMinute: 0, category: 'Vidraçaria' },
  { id: '9', description: 'Acabamento Vidro', minutage: 5, valuePerMinute: 0, category: 'Vidraçaria' },
];

const DEFAULT_FIXED_COSTS: FixedCost[] = [
  { id: 'fc1', description: 'Salário - Valdinei Mendes da Silva', type: 'Direct Cost', value: 4000.00 },
  { id: 'fc2', description: 'Salário - Breno Almeida da Silva', type: 'Direct Cost', value: 2200.00 },
  { id: 'fc3', description: 'Salário - Bernardo Almeida da Silva', type: 'Direct Cost', value: 1600.00 },
  { id: 'fc4', description: 'Salário - Marcelino', type: 'Direct Cost', value: 1600.00 },
  { id: 'fc5', description: 'Salário - Daniel Corrêa da Silva', type: 'Direct Cost', value: 1300.00 },
  { id: 'fc6', description: 'Salário - Bruno Lima Silva Neto', type: 'Indirect Cost', value: 2500.00 },
  { id: 'fc7', description: 'Salário - Samya Eloah', type: 'Indirect Cost', value: 900.00 },
];

const DEFAULT_FIXED_COMPONENTS: FixedComponent[] = [
  { id: '1', name: 'Suporte de tubo cabideiro', unit: 'un', value: 0, quantity: 0, minutage: 5 },
  { id: '2', name: 'Parafusos 3.5x14', unit: 'un', value: 0, quantity: 0, minutage: 0.5 },
  { id: '3', name: 'Tapa furos', unit: 'un', value: 0, quantity: 0, minutage: 0.2 },
  { id: '4', name: 'Parafusos 3.5x25', unit: 'un', value: 0, quantity: 0, minutage: 0.5 },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Aparador', idealMargin: 50 },
  { id: 'c2', name: 'Aparador decorativo', idealMargin: 55 },
  { id: 'c3', name: 'Armário aéreo', idealMargin: 55 },
  { id: 'c4', name: 'Armário Balcão de cozinha', idealMargin: 60 },
  { id: 'c5', name: 'Armário de lavanderia', idealMargin: 55 },
  { id: 'c6', name: 'Balcão caixa', idealMargin: 60 },
  { id: 'c7', name: 'Balcão de atendimento', idealMargin: 60 },
  { id: 'c8', name: 'Balcão de cozinha', idealMargin: 50 },
  { id: 'c9', name: 'Balcão de recepção/atendimento', idealMargin: 65 },
  { id: 'c10', name: 'Balcão multiuso', idealMargin: 50 },
  { id: 'c11', name: 'Balcão simples', idealMargin: 50 },
  { id: 'c12', name: 'Balcão vitrine', idealMargin: 60 },
  { id: 'c13', name: 'Bancada', idealMargin: 60 },
  { id: 'c14', name: 'Cama solteiro', idealMargin: 52 },
  { id: 'c15', name: 'Cama Casal', idealMargin: 55 },
  { id: 'c16', name: 'Cama planejada', idealMargin: 60 },
  { id: 'c17', name: 'Cômoda', idealMargin: 55 },
  { id: 'c18', name: 'Criado-mudo', idealMargin: 45 },
  { id: 'c19', name: 'Cristaleira', idealMargin: 55 },
  { id: 'c20', name: 'Escrivaninha', idealMargin: 50 },
  { id: 'c21', name: 'Estantes', idealMargin: 45 },
  { id: 'c22', name: 'Expositor', idealMargin: 55 },
  { id: 'c23', name: 'Expositor comercial', idealMargin: 60 },
  { id: 'c24', name: 'Guarda-roupa', idealMargin: 55 },
  { id: 'c25', name: 'Guarda-roupa planejado', idealMargin: 60 },
  { id: 'c26', name: 'Mesa de estudo', idealMargin: 50 },
  { id: 'c27', name: 'Mesa de manicure', idealMargin: 60 },
  { id: 'c28', name: 'Móvel infantil', idealMargin: 55 },
  { id: 'c29', name: 'Nichos', idealMargin: 40 },
  { id: 'c30', name: 'Organizador', idealMargin: 42 },
  { id: 'c31', name: 'Painel de TV', idealMargin: 50 },
  { id: 'c32', name: 'Painel modular', idealMargin: 50 },
  { id: 'c33', name: 'Painel ripado', idealMargin: 55 },
  { id: 'c34', name: 'Prateleira', idealMargin: 50 },
  { id: 'c35', name: 'Rack', idealMargin: 50 },
  { id: 'c36', name: 'Sapateira', idealMargin: 50 },
  { id: 'c37', name: 'Vitrine', idealMargin: 60 },
  { id: 'c38', name: 'Mesa de Jantar', idealMargin: 60 },
  { id: 'c39', name: 'Colméia', idealMargin: 65 },
  { id: 'c40', name: 'Mesa de centro', idealMargin: 55 },
  { id: 'c41', name: 'Penteadeira', idealMargin: 55 },
  { id: 'c42', name: 'Penteadeira camarim', idealMargin: 60 },
];

const DEFAULT_CARD_RATES: CardRate[] = [
  { id: '1', installments: 1, rate: 3.5 },
  { id: '2', installments: 2, rate: 4.5 },
  { id: '3', installments: 3, rate: 5.0 },
  { id: '4', installments: 4, rate: 6.0 },
  { id: '5', installments: 5, rate: 7.5 },
  { id: '6', installments: 6, rate: 9.0 },
  { id: '7', installments: 10, rate: 12.5 },
  { id: '8', installments: 12, rate: 14.0 },
];

const DEFAULT_SETTINGS: AppSettings = {
  profitMargin: 30,
  extraHours: 0,
  discountRate: 0,
  numEmployees: 2,
  hoursToWork: 160,
  laborCostPerHour: 0,
  productCategory: '',
  companyName: 'Sua Empresa de Móveis',
  companyCorporateName: '',
  companyCNPJ: '',
  companyAddress: '',
  companyNeighborhood: '',
  companyCity: '',
  companyCEP: '',
  companyEmail: 'contato@suaempresa.com.br',
  companyPhone: '(00) 00000-0000',
  companyWhatsapp: '',
  logo: '',
  signature: '',
  warrantyTerms: `1. Cobertura de Garantia
1.1. A empresa garante que os produtos vendidos estão livres de defeitos de material e de fabricação.
1.2. A garantia cobre apenas os defeitos de fabricação e não cobre danos causados por uso indevido, negligência ou desgaste normal.
1.3. A garantia é válida apenas para o comprador original e não é transferível.`,
  contractTerms: `CONTRATO DE COMPRA E VENDA E PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, de um lado a empresa identificada neste orçamento, doravante denominada CONTRATADA, e de outro lado o cliente identificado na proposta, doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem por objeto a fabricação e instalação dos móveis planejados descritos detalhadamente no orçamento anexo, que passa a fazer parte integrante deste instrumento.

CLÁUSULA SEGUNDA - DO PREÇO E FORMA DE PAGAMENTO
O preço ajustado pelos serviços e produtos é o constante no orçamento, devendo ser pago conforme as condições ali estabelecidas.

CLÁUSULA TERCEIRA - DO PRAZO
A entrega e instalação dos móveis serão realizadas conforme o prazo estipulado no orçamento, contado a partir da data de assinatura deste contrato e confirmação das medidas finais no local.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES
A CONTRATADA se obriga a entregar os móveis de acordo com as especificações técnicas e de qualidade acordadas. O CONTRATANTE se obriga a permitir o acesso ao local para medição e instalação, bem como a efetuar os pagamentos nas datas aprazadas.

CLÁUSULA QUINTA - DO FORO
Para dirimir quaisquer dúvidas oriundas deste contrato, as partes elegem o foro da comarca da CONTRATADA.

E por estarem assim justos e contratados, a aceitação desta proposta valida este termo.`
};

interface Notification {
    message: string;
    type: 'success' | 'error';
}

export const useBudgetStore = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [projectComponents, setProjectComponents] = useState<ProjectComponent[]>([]);
  const [fixedComponents, setFixedComponents] = useState<FixedComponent[]>(DEFAULT_FIXED_COMPONENTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [labor, setLabor] = useState<Labor[]>(DEFAULT_LABOR);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(DEFAULT_FIXED_COSTS);
  const [cardRates, setCardRates] = useState<CardRate[]>(DEFAULT_CARD_RATES);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [proposalProducts, setProposalProducts] = useState<ProposalItem[]>([]); // Deprecated but kept for type compatibility
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // State to hold data of the currently loaded proposal to populate form
  const [currentProposalData, setCurrentProposalData] = useState<LoadedProposalData | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Materials Migration Logic
        let loadedMaterials = parsed.materials || DEFAULT_MATERIALS;
        // Ensure critical materials exist
        const defaultMaterialIds = new Set(DEFAULT_MATERIALS.map(m => m.id));
        const loadedMaterialIds = new Set(loadedMaterials.map((m: Material) => m.id));
        
        const missingMaterials = DEFAULT_MATERIALS.filter(dm => 
             // Logic: Check by name or id if it's a critical logic item like "Parafuso 3.5x14"
             !loadedMaterials.some((lm: Material) => lm.name === dm.name)
        );

        if (missingMaterials.length > 0) {
            loadedMaterials = [...loadedMaterials, ...missingMaterials];
        }

        setMaterials(loadedMaterials);
        setPieces(parsed.pieces || []);
        setProjectComponents(parsed.projectComponents || []);
        setCategories((parsed.categories && parsed.categories.length > 0) ? parsed.categories : DEFAULT_CATEGORIES);
        
        // Labor Migration Logic: Check if new defaults are missing in saved data
        let loadedLabor = (parsed.labor && parsed.labor.length > 0) ? parsed.labor : DEFAULT_LABOR;
        const existingIds = new Set(loadedLabor.map((l: Labor) => l.id));
        const missingDefaults = DEFAULT_LABOR.filter(dl => !existingIds.has(dl.id));
        
        if (missingDefaults.length > 0) {
            loadedLabor = [...loadedLabor, ...missingDefaults];
        }
        setLabor(loadedLabor);

        setFixedComponents((parsed.fixedComponents && parsed.fixedComponents.length > 0) ? parsed.fixedComponents : DEFAULT_FIXED_COMPONENTS);
        setFixedCosts((parsed.fixedCosts && parsed.fixedCosts.length > 0) ? parsed.fixedCosts : DEFAULT_FIXED_COSTS);
        setCardRates((parsed.cardRates && parsed.cardRates.length > 0) ? parsed.cardRates : DEFAULT_CARD_RATES);
        setAdditionalServices(parsed.additionalServices || []);
        
        // Load proposals and ensure status field exists
        const loadedProposals = (parsed.savedProposals || []).map((p: SavedProposal) => ({
            ...p,
            status: p.status || 'Aguardando aprovação' // Default for old proposals
        }));
        setSavedProposals(loadedProposals);
        
        setSettings({ ...DEFAULT_SETTINGS, ...(parsed.settings || {}) });
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    const data = {
      materials,
      pieces,
      projectComponents,
      fixedComponents,
      categories,
      labor,
      fixedCosts,
      cardRates,
      additionalServices,
      proposalProducts,
      savedProposals,
      settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [materials, pieces, projectComponents, fixedComponents, categories, labor, fixedCosts, cardRates, additionalServices, proposalProducts, savedProposals, settings, isLoaded]);

  // --- Helper for Notifications ---
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => {
          setNotification(null);
      }, 3000);
  };

  // --- Logic Helpers ---

  const calculateScrews = (letter: string, quantity: number): number => {
    const l = letter ? letter.toUpperCase() : '';
    if (l === 'H' || l === 'I') return 4 * quantity;
    if (l === 'L') return 2 * quantity;
    return 0;
  };

  const calculateTapeLength = (length: number, width: number, letter: string): number => {
    const l = letter ? letter.toUpperCase() : '';
    let perimeter = 0;
    switch (l) {
      case 'O': perimeter = 2 * (length + width); break;
      case 'I': perimeter = length; break;
      case 'U': perimeter = 2 * length + width; break;
      case 'C': perimeter = 2 * width + length; break;
      case 'H': perimeter = 2 * length; break;
      case 'L': perimeter = length + width; break;
      default: perimeter = 0;
    }
    return perimeter;
  };

  // --- Actions ---

  // NEW: Reset Entire Project
  const resetProject = () => {
      // Clear Project Data
      setPieces([]);
      setProjectComponents([]);
      setAdditionalServices([]);
      
      // Reset defaults that are project-specific
      setSettings(prev => ({ 
          ...prev, 
          extraHours: 0, 
          discountRate: 0, 
          productCategory: '' 
      }));
      
      setProposalProducts([]);
      
      // Clear current proposal metadata so the form clears too
      setCurrentProposalData(null);

      showNotification('Novo orçamento iniciado! Dados do projeto limpos.');
  };

  const addPiece = (p: Omit<Piece, 'id' | 'area' | 'perimeter' | 'tapeLength' | 'screws'>) => {
    const length = parseFloat(String(p.length));
    const width = parseFloat(String(p.width));
    const quantity = parseFloat(String(p.quantity));

    if (isNaN(length) || isNaN(width) || isNaN(quantity)) return;

    const newPiece: Piece = {
      ...p,
      length,
      width,
      quantity,
      id: crypto.randomUUID(),
      paintColor: p.paintColor, // New Field
      area: length * width * quantity, // mm2
      perimeter: 2 * (length + width) * quantity, // mm
      tapeLength: calculateTapeLength(length, width, p.tapeLetter) * quantity,
      screws: calculateScrews(p.tapeLetter, quantity),
    };
    setPieces(prev => [...prev, newPiece]);
    showNotification('Peça adicionada com sucesso!');
  };

  const updatePiece = (id: string, p: Partial<Omit<Piece, 'id' | 'area' | 'perimeter' | 'tapeLength' | 'screws'>>) => {
    setPieces(prev => prev.map(current => {
      if (current.id !== id) return current;
      const merged = { ...current, ...p };
      const length = parseFloat(String(merged.length));
      const width = parseFloat(String(merged.width));
      const quantity = parseFloat(String(merged.quantity));

      const area = length * width * quantity;
      const perimeter = 2 * (length + width) * quantity;
      const tapeLength = calculateTapeLength(length, width, merged.tapeLetter) * quantity;
      const screws = calculateScrews(merged.tapeLetter, quantity);

      return { ...merged, length, width, quantity, area, perimeter, tapeLength, screws };
    }));
    showNotification('Peça atualizada com sucesso!');
  };

  const removePiece = (id: string) => {
      setPieces(prev => prev.filter(p => p.id !== id));
      showNotification('Peça removida.', 'error');
  };

  const addProjectComponent = (c: Omit<ProjectComponent, 'id'>) => {
      setProjectComponents(prev => [...prev, { ...c, id: crypto.randomUUID() }]);
      showNotification('Componente adicionado ao projeto!');
  };
  const updateProjectComponent = (id: string, c: Partial<Omit<ProjectComponent, 'id'>>) => {
      setProjectComponents(prev => prev.map(item => item.id === id ? { ...item, ...c } : item));
      showNotification('Componente atualizado!');
  };
  const removeProjectComponent = (id: string) => {
      setProjectComponents(prev => prev.filter(c => c.id !== id));
      showNotification('Componente removido.', 'error');
  };

  const addFixedComponent = (fc: Omit<FixedComponent, 'id'>) => {
      setFixedComponents(prev => [...prev, { ...fc, id: crypto.randomUUID() }]);
      showNotification('Componente fixo adicionado!');
  };
  const updateFixedComponent = (id: string, fc: Partial<Omit<FixedComponent, 'id'>>) => {
      setFixedComponents(prev => prev.map(item => item.id === id ? { ...item, ...fc } : item));
      showNotification('Componente fixo atualizado!');
  };
  const removeFixedComponent = (id: string) => {
      setFixedComponents(prev => prev.filter(c => c.id !== id));
      showNotification('Componente fixo removido.', 'error');
  };

  const addMaterial = (m: Omit<Material, 'id'>) => {
      setMaterials(prev => [...prev, { ...m, id: crypto.randomUUID() }]);
      showNotification('Cadastro adicionado com sucesso!');
  };
  const updateMaterial = (id: string, m: Partial<Omit<Material, 'id'>>) => {
      setMaterials(prev => prev.map(item => item.id === id ? { ...item, ...m } : item));
      showNotification('Cadastro atualizado com sucesso!');
  };
  const removeMaterial = (id: string) => {
      setMaterials(prev => prev.filter(m => m.id !== id));
      showNotification('Cadastro removido.', 'error');
  };

  const addFixedCost = (fc: Omit<FixedCost, 'id'>) => {
      setFixedCosts(prev => [...prev, { ...fc, id: crypto.randomUUID() }]);
      showNotification('Custo fixo adicionado!');
  };
  const updateFixedCost = (id: string, fc: Partial<Omit<FixedCost, 'id'>>) => {
      setFixedCosts(prev => prev.map(item => item.id === id ? { ...item, ...fc } : item));
      showNotification('Custo fixo atualizado!');
  };
  const removeFixedCost = (id: string) => {
      setFixedCosts(prev => prev.filter(fc => fc.id !== id));
      showNotification('Custo fixo removido.', 'error');
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
      setCategories(prev => [...prev, { ...c, id: crypto.randomUUID() }]);
      showNotification('Categoria adicionada!');
  };
  const updateCategory = (id: string, c: Partial<Omit<Category, 'id'>>) => {
      setCategories(prev => prev.map(item => item.id === id ? { ...item, ...c } : item));
      showNotification('Categoria atualizada!');
  };
  const removeCategory = (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      showNotification('Categoria removida.', 'error');
  };
  
  const addLabor = (l: Omit<Labor, 'id'>) => {
      setLabor(prev => [...prev, { ...l, id: crypto.randomUUID() }]);
      showNotification('Mão de obra adicionada!');
  };
  const updateLabor = (id: string, l: Partial<Omit<Labor, 'id'>>) => {
      setLabor(prev => prev.map(item => item.id === id ? { ...item, ...l } : item));
      showNotification('Mão de obra atualizada!');
  };
  const removeLabor = (id: string) => {
      setLabor(prev => prev.filter(l => l.id !== id));
      showNotification('Mão de obra removida.', 'error');
  };

  const addCardRate = (cr: Omit<CardRate, 'id'>) => {
      setCardRates(prev => [...prev, { ...cr, id: crypto.randomUUID() }]);
      showNotification('Taxa adicionada!');
  };
  const updateCardRate = (id: string, cr: Partial<Omit<CardRate, 'id'>>) => {
      setCardRates(prev => prev.map(item => item.id === id ? { ...item, ...cr } : item));
      showNotification('Taxa atualizada!');
  };
  const removeCardRate = (id: string) => {
      setCardRates(prev => prev.filter(cr => cr.id !== id));
      showNotification('Taxa removida.', 'error');
  };

  const addAdditionalService = (s: Omit<AdditionalService, 'id'>) => {
      setAdditionalServices(prev => [...prev, { ...s, id: crypto.randomUUID() }]);
      showNotification('Serviço adicional incluído!');
  };
  const removeAdditionalService = (id: string) => {
      setAdditionalServices(prev => prev.filter(s => s.id !== id));
      showNotification('Serviço removido.', 'error');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // --- Statistics Calculation ---

  const stats: ProjectStats = useMemo(() => {
    // 1. Physical Stats & Material Cost
    let totalArea = 0, totalPerimeter = 0, totalTapeLength = 0, totalScrews = 0;
    
    // Specific material type stats (Physical)
    let totalMetalPieces = 0;
    let totalMetalLength = 0;
    let totalGlassPerimeter = 0;
    let totalWoodPerimeter = 0;
    let totalWoodTapeLength = 0;

    // Cost Breakdown
    let totalMdfCost = 0;
    let totalMetalCost = 0;
    let totalGlassCost = 0;

    const tapeByColor: Record<string, number> = {};

    // Helper to find paint price
    const getPaintPrice = (color: string) => {
        const normalizedColor = color?.toLowerCase() || '';
        let paint = materials.find(m => m.name.toLowerCase().includes(`tinta automotiva ${normalizedColor}`));
        if (!paint) paint = materials.find(m => m.name === 'Tinta Automotiva (Cores)');
        if (!paint) paint = materials.find(m => m.name === 'Tinta Automotiva Branco'); // Fallback
        return paint ? paint.value : 45.00; // Default fallback price
    };

    pieces.forEach(p => {
      totalArea += p.area;
      totalPerimeter += p.perimeter;
      totalTapeLength += p.tapeLength;
      totalScrews += p.screws;

      // Identify material details for Cost and Physical Stats
      const materialName = p.materialType.toLowerCase();
      const materialDef = materials.find(m => m.name === p.materialType);
      const isMetal = materialName.includes('metalon') || materialName.includes('serralheria');
      const isGlass = materialName.includes('vidro') || materialName.includes('espelho');

      // Physical Stats Separation
      if (isMetal) {
          totalMetalPieces += p.quantity;
          totalMetalLength += (p.length * p.quantity); // mm
      } else if (isGlass) {
          totalGlassPerimeter += p.perimeter; // mm
      } else {
          totalWoodPerimeter += p.perimeter;
          totalWoodTapeLength += p.tapeLength;
      }

      // Cost Calculation Separation
      let pieceCost = 0;
      if (materialDef) {
          if (materialDef.unit === 'm') {
             // If unit is meter, calculate based on length (linear)
             pieceCost = (p.length / 1000) * p.quantity * materialDef.value;
          } else {
             // Default to m2 (Area based)
             pieceCost = (p.area / 1000000) * materialDef.value;
          }
      }

      if (isMetal) {
          totalMetalCost += pieceCost;
          
          // --- Paint Cost Calculation ---
          // Rule: 25ml (0.025L) per 1 meter of metalon
          if (p.paintColor) {
              const totalMeters = (p.length / 1000) * p.quantity;
              const litersNeeded = totalMeters * 0.025;
              const paintPricePerLiter = getPaintPrice(p.paintColor);
              const paintCost = litersNeeded * paintPricePerLiter;
              totalMetalCost += paintCost; // Add paint cost to metal cost bucket
          }

      } else if (isGlass) {
          totalGlassCost += pieceCost;
      } else {
          totalMdfCost += pieceCost;
      }

      if (p.tapeType && p.tapeLength > 0) {
         const color = p.tapeType;
         tapeByColor[color] = (tapeByColor[color] || 0) + p.tapeLength;
      }
    });

    const totalMaterialCost = totalMdfCost + totalMetalCost + totalGlassCost;
    
    // 2. Fixed Costs
    const totalFixedDirectCost = fixedCosts.filter(fc => fc.type === 'Direct Cost').reduce((a, b) => a + b.value, 0);
    const totalFixedIndirectCost = fixedCosts.filter(fc => fc.type !== 'Direct Cost').reduce((a, b) => a + b.value, 0);
    const totalCapacityHours = settings.numEmployees * settings.hoursToWork;
    const calculatedLaborRate = totalCapacityHours > 0 ? totalFixedDirectCost / totalCapacityHours : 0;
    const calculatedOverheadRate = totalCapacityHours > 0 ? totalFixedIndirectCost / totalCapacityHours : 0;

    // 3. Time
    let laborMinutes = 0;

    // Marcenaria (Wood)
    const woodCut = labor.find(l => l.description.toLowerCase().includes('corte') && (!l.category || l.category === 'Marcenaria'));
    const woodEdge = labor.find(l => l.description.toLowerCase().includes('colagem') && (!l.category || l.category === 'Marcenaria'));
    const woodAssembly = labor.find(l => l.description.toLowerCase().includes('montagem') && (!l.category || l.category === 'Marcenaria'));

    if (woodCut) laborMinutes += (totalWoodPerimeter / 1000) * (woodCut.minutage || 0);
    if (woodEdge) laborMinutes += (totalWoodTapeLength / 1000) * (woodEdge.minutage || 0);
    if (woodAssembly) laborMinutes += totalScrews * (woodAssembly.minutage || 0);

    // Serralheria (Metal)
    const metalCut = labor.find(l => l.description.toLowerCase().includes('corte') && l.category === 'Serralheria');
    const metalSand = labor.find(l => l.description.toLowerCase().includes('lixagem') && l.category === 'Serralheria');
    const metalWeld = labor.find(l => l.description.toLowerCase().includes('soldagem') && l.category === 'Serralheria');
    const metalPaint = labor.find(l => l.description.toLowerCase().includes('pintura') && l.category === 'Serralheria');

    if (metalCut) laborMinutes += totalMetalPieces * (metalCut.minutage || 0);
    if (metalSand) laborMinutes += totalMetalPieces * (metalSand.minutage || 0);
    if (metalWeld) laborMinutes += totalMetalPieces * (metalWeld.minutage || 0);
    if (metalPaint) laborMinutes += (totalMetalLength / 1000) * (metalPaint.minutage || 0);

    // Vidraçaria (Glass)
    const glassCut = labor.find(l => l.description.toLowerCase().includes('corte') && l.category === 'Vidraçaria');
    const glassFinish = labor.find(l => (l.description.toLowerCase().includes('acabamento') || l.description.toLowerCase().includes('lapidação')) && l.category === 'Vidraçaria');

    if (glassCut) laborMinutes += (totalGlassPerimeter / 1000) * (glassCut.minutage || 0);
    if (glassFinish) laborMinutes += (totalGlassPerimeter / 1000) * (glassFinish.minutage || 0);

    // Components Time
    const componentMinutes = projectComponents.reduce((acc, c) => acc + (c.minutage * c.quantity), 0);
    const fixedComponentMinutes = fixedComponents.reduce((acc, fc) => acc + (fc.minutage * fc.quantity), 0);
    
    laborMinutes += componentMinutes + fixedComponentMinutes;

    // 4. Costs Calculation
    const totalLaborCost = (laborMinutes / 60) * calculatedLaborRate;
    
    // Tape Cost
    let totalTapeCost = 0;
    Object.entries(tapeByColor).forEach(([color, length]) => {
        const searchName = `fita ${color.toLowerCase()}`;
        const tapeMat = materials.find(m => m.name.toLowerCase() === searchName);
        const price = tapeMat ? tapeMat.value : 1.50; // default backup
        totalTapeCost += (length / 1000) * price;
    });

    const totalComponentCost = projectComponents.reduce((acc, c) => acc + (c.value * c.quantity), 0) 
                             + fixedComponents.reduce((acc, fc) => acc + (fc.value * fc.quantity), 0);
    
    const totalFixedCost = (laborMinutes / 60) * calculatedOverheadRate;
    const totalAdditionalServicesCost = additionalServices.reduce((acc, s) => acc + s.value, 0);

    const finalCost = totalMaterialCost + totalTapeCost + totalComponentCost + totalLaborCost + totalFixedCost + settings.extraHours + totalAdditionalServicesCost;

    // 5. Sales Price
    const marginMultiplier = 1 + (settings.profitMargin / 100);
    let salesPrice = finalCost * marginMultiplier;

    // --- 12x Rate Logic ---
    const rate12x = cardRates.find(r => r.installments === 12)?.rate || 0;
    
    if (rate12x > 0) {
         salesPrice = salesPrice / (1 - (rate12x / 100));
    }

    const discountValue = salesPrice * (rate12x / 100);
    const netRevenue = salesPrice - discountValue;
    const profit = netRevenue - finalCost;
    
    const realizedMargin = salesPrice > 0 ? (profit / salesPrice) * 100 : 0;
    const roi = finalCost > 0 ? (profit / finalCost) * 100 : 0;

    return {
      totalArea,
      totalPerimeter,
      totalTapeLength,
      totalScrews,
      totalMinutes: laborMinutes,
      totalMaterialCost,
      totalMdfCost,
      totalMetalCost,
      totalGlassCost,
      totalComponentCost,
      totalTapeCost,
      totalFixedCost,
      totalLaborCost,
      totalAdditionalServicesCost,
      finalCost,
      salesPrice,
      profit,
      discountValue, // Represents the fee amount
      totalMetalPieces,
      totalMetalLength,
      totalGlassPerimeter,
      totalFixedDirectCost,
      totalFixedIndirectCost,
      calculatedLaborRate,
      calculatedOverheadRate,
      realizedMargin,
      roi
    };
  }, [pieces, materials, labor, fixedCosts, settings, projectComponents, fixedComponents, additionalServices, cardRates]);

  // --- Proposal Saving ---
  const saveProposal = (
    clientName: string, 
    projectName: string, 
    clientPhone?: string, 
    serviceDescription?: string, 
    validityDays?: string,
    warrantyTime?: string,
    deliveryTime?: string,
    paymentCondition?: string,
    images?: string[]
  ) => {
      const newProposal: SavedProposal = {
          id: crypto.randomUUID(),
          number: `${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${new Date().getFullYear()}`,
          createdAt: new Date().toISOString(),
          clientName,
          projectName,
          clientPhone,
          serviceDescription,
          validityDays,
          warrantyTime,
          deliveryTime,
          paymentCondition,
          images, // Save images
          finalValue: stats.salesPrice,
          status: 'Aguardando aprovação',
          data: {
              pieces,
              projectComponents,
              fixedComponents,
              additionalServices,
              proposalProducts: [], // Empty
              settings,
              cardRates,
              stats
          }
      };
      setSavedProposals(prev => [newProposal, ...prev]);
      showNotification('Proposta salva com sucesso!');
  };

    // Update proposal metadata without full load. If proposal doesn't exist, add it.
    const updateSavedProposalMetaData = (id: string, updates: Partial<SavedProposal>) => {
      setSavedProposals(prev => {
        const found = prev.find(p => p.id === id || (updates && (updates as any).firebaseId && p.firebaseId === (updates as any).firebaseId));
        if (found) {
          // Update existing
          return prev.map(p => p.id === id ? { ...p, ...updates } : p);
        }

        // Add as new proposal (imported from remote). Fill minimal fields if missing.
        const newProposal: SavedProposal = {
          id: id,
          number: updates?.number || `0000-${new Date().getFullYear()}`,
          createdAt: updates?.createdAt || new Date().toISOString(),
          clientName: updates?.clientName || 'Cliente (importado)',
          projectName: updates?.projectName || 'Projeto (importado)',
          clientPhone: updates?.clientPhone,
          serviceDescription: updates?.serviceDescription,
          validityDays: updates?.validityDays,
          warrantyTime: updates?.warrantyTime,
          deliveryTime: updates?.deliveryTime,
          paymentCondition: updates?.paymentCondition,
          images: updates?.images,
          finalValue: updates?.finalValue || 0,
          status: updates?.status || 'Aguardando aprovação',
          data: updates?.data || { pieces: [], projectComponents: [], fixedComponents: [], additionalServices: [], proposalProducts: [], settings },
          firebaseId: (updates as any)?.firebaseId
        };

        showNotification('Proposta importada do servidor.');
        return [newProposal, ...prev];
      });
    };

  const deleteProposal = (id: string) => {
      setSavedProposals(prev => prev.filter(p => p.id !== id));
      showNotification('Proposta excluída.', 'error');
  };

  const loadProposal = (id: string) => {
      const proposal = savedProposals.find(p => p.id === id);
      if (!proposal) return false;

      setPieces(proposal.data.pieces || []);
      setProjectComponents(proposal.data.projectComponents || []);
      setFixedComponents(proposal.data.fixedComponents || []);
      setAdditionalServices(proposal.data.additionalServices || []);
      setSettings(proposal.data.settings);
      
      if (proposal.data.cardRates) setCardRates(proposal.data.cardRates);

      // Populate currentProposalData to fill the form in Pricing view
      setCurrentProposalData({
          clientName: proposal.clientName,
          projectName: proposal.projectName,
          clientPhone: proposal.clientPhone || '',
          serviceDescription: proposal.serviceDescription || '',
          validityDays: proposal.validityDays || '15',
          warrantyTime: proposal.warrantyTime || '90 dias',
          deliveryTime: proposal.deliveryTime || '20 dias úteis',
          paymentCondition: proposal.paymentCondition || 'Sinal 50%',
          images: proposal.images || []
      });

      showNotification(`Proposta ${proposal.number} carregada!`);
      return true;
  };

  // Update Status
  const updateProposalStatus = (id: string, status: ProposalStatus) => {
      setSavedProposals(prev => prev.map(p => 
          p.id === id ? { ...p, status } : p
      ));
      showNotification('Status da proposta atualizado!');
  };

  return {
    isLoaded,
    materials,
    pieces,
    projectComponents,
    fixedComponents,
    categories,
    labor,
    fixedCosts,
    cardRates,
    additionalServices,
    proposalProducts,
    savedProposals,
    settings,
    stats,
    notification,
    currentProposalData, // Export current data for form filling
    resetProject,
    addPiece, updatePiece, removePiece,
    addProjectComponent, updateProjectComponent, removeProjectComponent,
    addFixedComponent, updateFixedComponent, removeFixedComponent,
    addMaterial, updateMaterial, removeMaterial,
    addCategory, updateCategory, removeCategory,
    addLabor, updateLabor, removeLabor,
    addFixedCost, updateFixedCost, removeFixedCost,
    addCardRate, updateCardRate, removeCardRate,
    addAdditionalService, removeAdditionalService,
    updateSettings,
    saveProposal, deleteProposal, loadProposal, updateProposalStatus,
    updateSavedProposalMetaData
  };
};
