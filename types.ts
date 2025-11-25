
export enum Unit {
  UNIDADE = 'unidade',
  M = 'm',
  M2 = 'm2',
  PAR = 'par',
  KG = 'kg',
  L = 'L',
  CONJUNTO = 'conjunto',
  CAIXA = 'caixa',
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  value: number;
  type: 'material' | 'component';
  minutage?: number;
  metragem?: number;
}

export interface Piece {
  id: string;
  materialType: string; // e.g., 'mdf', 'mdp'
  length: number;
  width: number;
  quantity: number;
  name: string;
  tapeType: string;
  tapeLetter: string;
  paintColor?: string; // New field for Metalon paint color
  area: number; // calculated mm2 (stored for caching)
  perimeter: number; // calculated mm
  tapeLength: number; // calculated mm
  screws: number; // calculated
}

export interface ProjectComponent {
  id: string;
  name: string;
  unit: string;
  value: number;
  quantity: number;
  minutage: number;
  metragem?: number;
}

export interface FixedComponent {
  id: string;
  name: string;
  unit: string;
  value: number;
  quantity: number;
  minutage: number;
}

export interface AdditionalService {
  id: string;
  description: string;
  value: number;
}

// New Interface for Manual Product Entry
export interface ProposalItem {
  id: string;
  name: string;
  quantity: number;
  value: number; // Unit value
}

export interface Category {
  id: string;
  name: string;
  idealMargin: number;
}

export interface Labor {
  id: string;
  description: string;
  minutage: number;
  valuePerMinute: number; // Can be derived or manual
  category?: 'Marcenaria' | 'Serralheria' | 'Vidraçaria' | string;
}

export interface FixedCost {
  id: string;
  description: string;
  type: 'Direct Cost' | 'Indirect Cost' | 'Expense';
  value: number;
}

export interface CardRate {
  id: string;
  installments: number; // 1, 2, 3... 12
  rate: number; // percentage
}

export interface AppSettings {
  profitMargin: number;
  extraHours: number;
  discountRate: number;
  numEmployees: number;
  hoursToWork: number;
  laborCostPerHour: number;
  productCategory: string;
  // PDF / Company Settings
  companyName?: string;
  companyCorporateName?: string; // Razão Social
  companyCNPJ?: string;
  companyAddress?: string;
  companyNeighborhood?: string; // Bairro
  companyCity?: string; // Cidade/UF
  companyCEP?: string; // CEP
  companyEmail?: string;
  companyPhone?: string;
  companyWhatsapp?: string; // Separate WhatsApp field
  warrantyTerms?: string;
  contractTerms?: string; // Contrato de Compra e Venda
  logo?: string; // Base64
  signature?: string; // Base64
}

export interface ProjectStats {
  totalArea: number;
  totalPerimeter: number;
  totalTapeLength: number; // Total tape length in mm
  totalScrews: number;
  totalMinutes: number;
  
  totalMaterialCost: number; // Combined cost
  totalMdfCost: number;      // Wood/MDF only
  totalMetalCost: number;    // Metalon only
  totalGlassCost: number;    // Glass only

  totalComponentCost: number;
  totalTapeCost: number;
  totalFixedCost: number;
  totalLaborCost: number;
  totalAdditionalServicesCost: number; // New field
  finalCost: number;
  salesPrice: number;
  profit: number;
  discountValue: number;
  
  // New Detailed Stats for specific Material Types
  totalMetalPieces: number; // For cutting/welding count
  totalMetalLength: number; // For painting (mm)
  totalGlassPerimeter: number; // For glass cutting/finish (mm)

  totalFixedDirectCost: number;
  totalFixedIndirectCost: number;
  calculatedLaborRate: number; // R$/hour based on Direct Costs
  calculatedOverheadRate: number; // R$/hour based on Indirect+Expenses
  
  // Profitability Metrics
  realizedMargin: number; // % of Sales Price that is Profit
  roi: number; // % of Return on Cost
}

export type ProposalStatus = 'Concluído' | 'Em andamento' | 'Enviado' | 'Aguardando aprovação';

export interface SavedProposal {
  id: string;
  number: string; // Format: 0001-2025
  createdAt: string;
  clientName: string;
  projectName: string;
  clientPhone?: string;       // Saved for PDF regeneration
  serviceDescription?: string; // Saved for PDF regeneration
  validityDays?: string;       // Saved for PDF regeneration
  // Extended fields for "Open" functionality
  warrantyTime?: string;
  deliveryTime?: string;
  paymentCondition?: string;
  images?: string[]; // Base64
  
  finalValue: number;
  status: ProposalStatus;    // Status do orçamento
  data: {
    pieces: Piece[];
    projectComponents: ProjectComponent[];
    fixedComponents: FixedComponent[];
    additionalServices: AdditionalService[];
    proposalProducts: ProposalItem[]; // New field for manually added products
    settings: AppSettings;
    cardRates: CardRate[];    // Snapshot of rates at time of saving
    stats: ProjectStats;      // Snapshot of calculations at time of saving
  };
  // Optional Firebase document id for cloud sync
  firebaseId?: string;
}

// Interface to pass loaded data back to Pricing component form
export interface LoadedProposalData {
    clientName: string;
    projectName: string;
    clientPhone: string;
    serviceDescription: string;
    validityDays: string;
    warrantyTime: string;
    deliveryTime: string;
    paymentCondition: string;
    images: string[];
}
