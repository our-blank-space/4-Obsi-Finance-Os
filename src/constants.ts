/**
 * CONSTANTES DE DOMINIO - PROCESOS PRODUCTIVOS
 * Usamos 'as const' para inmutabilidad y tipado literal estricto.
 */
export const BATCH_STAGES = {
    livestock: [
        'Gestación',
        'Lactancia',
        'Destete',
        'Crecimiento',
        'Engorde',
        'Venta'
    ],
    poultry: [
        'Recepción',
        'Inicio',
        'Crecimiento',
        'Engorde',
        'Sacrificio'
    ],
    agriculture: [
        'Preparación Suelo',
        'Siembra',
        'Crecimiento',
        'Floración',
        'Cosecha',
        'Secado'
    ],
    other: [
        'Planeación',
        'Ejecución',
        'Cierre'
    ]
} as const; // <--- LA CLAVE: Convierte string[] en tuplas de lectura readonly

/**
 * SISTEMA DE DISEÑO - PALETA DE COLORES
 */

// 1. Paleta Primitiva (Raw Tokens)
const PALETTE = {
    emerald800: '#065f46',
    amber600: '#d97706',
    cyan600: '#0891b2',
    red600: '#dc2626',
    green600: '#16a34a',
    slate500: '#64748b'
} as const;

// 2. Colores Semánticos (Intención de Uso)
// Usa estos en la UI para facilitar cambios de tema futuros
export const COLORS = {
    // Identidad
    primary: PALETTE.emerald800,
    secondary: PALETTE.amber600,
    accent: PALETTE.cyan600,

    // Feedback
    danger: PALETTE.red600,
    success: PALETTE.green600,
    neutral: PALETTE.slate500,

    // Alias funcionales (Ejemplo: Finanzas)
    income: PALETTE.green600,
    expense: PALETTE.red600,
    investment: PALETTE.cyan600,
} as const;
