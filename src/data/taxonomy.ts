// src/data/taxonomy.ts

export type AccountCategory = 'liquid' | 'investment' | 'debt' | 'other';

export interface AccountDefinition {
    value: string;
    label: string;
    category: AccountCategory;
    icon?: string; // Future-proof for UI icons
}

/* =========================================
   RICH DATA (Source of Truth)
   ========================================= */

export const ACCOUNT_DEFINITIONS: AccountDefinition[] = [
    // Liquidez
    { value: 'Efectivo', label: 'Efectivo / Billetera', category: 'liquid' },
    { value: 'Caja Fuerte', label: 'Caja Fuerte', category: 'liquid' },
    { value: 'Nequi', label: 'Nequi', category: 'liquid' },
    { value: 'Daviplata', label: 'Daviplata', category: 'liquid' },
    { value: 'Bancolombia', label: 'Bancolombia', category: 'liquid' },
    { value: 'Davivienda', label: 'Davivienda', category: 'liquid' },
    { value: 'Custodia', label: 'Cuenta de Custodia', category: 'investment' },

    // Otros
    { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', category: 'debt' },
    { value: 'Inversiones', label: 'Inversiones Generales', category: 'investment' }
];

export const AREA_DEFINITIONS = [
    { value: 'Alimentación', label: 'Comida y Mercado', type: 'essential' },
    { value: 'Transporte', label: 'Transporte y Movilidad', type: 'essential' },
    { value: 'Vivienda', label: 'Arriendo / Hipoteca', type: 'essential' },
    { value: 'Servicios', label: 'Servicios Públicos', type: 'essential' },
    { value: 'Salud', label: 'Salud y Bienestar', type: 'essential' },
    { value: 'Entretenimiento', label: 'Ocio y Diversión', type: 'discretionary' },
    { value: 'Educación', label: 'Formación y Libros', type: 'growth' },
    { value: 'Compras', label: 'Ropa y Tecnología', type: 'discretionary' },
    { value: 'Impuestos', label: 'Impuestos y Tasas', type: 'financial' },
    { value: 'Salario', label: 'Sueldo e Ingresos Lab.', type: 'income' },
    { value: 'Ventas', label: 'Ventas y Negocios', type: 'income' },
    { value: 'Otros', label: 'Sin Clasificar', type: 'other' }
] as const;

/* =========================================
   COMPATIBILITY LAYER (Flat Lists)
   Use these for current Select inputs until refactor.
   ========================================= */

export const DEFAULT_ACCOUNTS = ACCOUNT_DEFINITIONS.map(a => a.value);
export const DEFAULT_AREAS = AREA_DEFINITIONS.map(a => a.value);

export const DEFAULT_ASSET_TYPES = [
    'Real Estate',
    'Vehicles',
    'Jewelry & Art',
    'Electronics',
    'Private Equity',
    'Other'
]; 