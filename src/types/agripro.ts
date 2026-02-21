import { BATCH_STAGES } from '../constants';

// --- DOMAIN TYPES DERIVADOS (Single Source of Truth) ---

// Tipo: 'livestock' | 'poultry' | 'agriculture' | 'other'
export type ProductionType = keyof typeof BATCH_STAGES;

// Tipo Inteligente: Extrae los strings literales de las etapas
// Ejemplo: 'Gestación' | 'Lactancia' | ...
// Usamos inferencia para cada subgrupo
export type StageLivestock = typeof BATCH_STAGES.livestock[number];
export type StagePoultry = typeof BATCH_STAGES.poultry[number];
export type StageAgriculture = typeof BATCH_STAGES.agriculture[number];
export type StageOther = typeof BATCH_STAGES.other[number];

// Tipo Unión Global de Etapas
export type ProductionStage = StageLivestock | StagePoultry | StageAgriculture | StageOther;

// --- MODELOS DE DATOS ---

export interface Batch {
    id: string;
    name: string;
    type: ProductionType;
    currentStage: ProductionStage;
    startDate: string;
    estimatedEndDate?: string;

    // Métricas
    quantity: number; // Cabezas / Plantas / Unidades
    costBasis: number;
    projectedRevenue: number;

    // Estado
    status: 'active' | 'completed' | 'archived';
    tags?: string[];
}
