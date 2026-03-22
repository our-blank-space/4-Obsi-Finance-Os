// src/types/business.ts
// === SISTEMA AGROPECUARIO ===
// Gestión de lotes de cerdos, aves, y cultivos con costos, ventas y clientes.

// ------------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------------

/** Tipo de proyecto agropecuario */
export type FarmProjectType = 'pig_fattening' | 'sow' | 'poultry' | 'crop';

/** Estado del lote */
export type FarmProjectStatus = 'active' | 'closed';

/** Tipo de costo dentro del lote */
export type FarmCostCategory =
    | 'purchase'       // Compra inicial del animal/semilla
    | 'feed_preinit'   // Cuido pre-inicio
    | 'feed_init'      // Cuido inicio
    | 'feed_growth'    // Cuido levante / engorde
    | 'medicine'       // Medicamentos / vacunas
    | 'bedding'        // Cascarilla / camas
    | 'logistics'      // Fletes / Transporte / Combustible
    | 'labor'          // Mano de obra
    | 'other';         // Otros

/** Modo de venta de cerdo */
export type PigSaleMode = 'canal' | 'live_weight';

/** Tipo de pago de cliente */
export type ClientPaymentStatus = 'paid' | 'partial' | 'pending';

// ------------------------------------------------------------------
// COSTOS
// ------------------------------------------------------------------

export interface FarmCost {
    id: string;
    date: string;
    description: string;
    category: FarmCostCategory;
    amount: number;
    /** Cantidad física comprada (ej. kilos de cuido, dosis de vacuna, bultos) */
    quantity?: number;
}

// ------------------------------------------------------------------
// VENTA INDIVIDUAL (registro de lo que compró el cliente)
// ------------------------------------------------------------------

export interface PigSaleDetail {
    mode: PigSaleMode;
    /** 'canal': precio por kg de canal */
    pricePerKg?: number;
    /** 'canal': peso del canal en kg */
    canalWeightKg?: number;
    /** 'live_weight': precio por kg en pie */
    pricePerKgLive?: number;
    /** 'live_weight': peso vivo en kg */
    liveWeightKg?: number;
    /** Cortes vendidos (costilla, lomo, etc.) */
    cuts?: { name: string; weightKg: number; pricePerKg: number }[];
}

export interface PoultrySaleDetail {
    /** Cantidad de aves */
    quantity: number;
    /** Precio por libra (variable) */
    pricePerLb: number;
    /** Peso promedio por ave en libras */
    weightPerBirdLb: number;
    /** Precio alternativo por entable (ave entera) */
    entablePricePerBird?: number;
    /** Si se vendió por entable en lugar de por libra */
    soldByEntable?: boolean;
}

export interface FarmSale {
    id: string;
    projectId: string;
    date: string;
    clientId?: string;
    clientName?: string;
    /** Monto total de la venta */
    totalAmount: number;
    /** Cuánto abonó en el momento */
    amountPaid: number;
    /** Saldo pendiente */
    balance: number;
    paymentStatus: ClientPaymentStatus;
    note?: string;
    /** Detalle específico del tipo de venta */
    pigDetail?: PigSaleDetail;
    poultryDetail?: PoultrySaleDetail;
}

// ------------------------------------------------------------------
// CLIENTES
// ------------------------------------------------------------------

export interface ClientPayment {
    id: string;
    date: string;
    amount: number;
    note?: string;
}

export interface FarmClient {
    id: string;
    name: string;
    phone?: string;
    notes?: string;
    /** Historial de pagos abonados en sus deudas */
    payments: ClientPayment[];
}

// ------------------------------------------------------------------
// PROYECTOS / LOTES
// ------------------------------------------------------------------

export interface FarmProject {
    id: string;
    type: FarmProjectType;
    name: string;
    status: FarmProjectStatus;
    startDate: string;
    closeDate?: string;
    notes?: string;

    // --- Biometría General ---
    breed?: string;                 // Raza (Duroc, Landrace, Pietrain, etc.)
    birthDate?: string;             // Fecha de nacimiento
    mortalityCount?: number;        // Bajas / muertes durante el ciclo
    weightLogs?: {                  // Registro cronológico de pesajes
        date: string;
        weightKg: number;
        note?: string;
    }[];

    // --- Específico Cerdos de Engorde / Cerda Cría ---
    /** Número de animales al inicio */
    initialCount?: number;
    /** Peso de entrada (kg) */
    entryWeightKg?: number;
    /** ¿Es cerda de cría? */
    isSow?: boolean;

    // --- Módulo Cría (Gestión Reproductiva) ---
    inseminationDate?: string;      // Fecha servicios / inyección pajilla
    expectedDeliveryDate?: string;  // Fecha proyectada de parto
    liveBirths?: number;            // Lechones vivos
    deadBirths?: number;            // Lechones muertos
    weaningDate?: string;           // Fecha de destete
    weaningWeightKg?: number;       // Peso salida de la camada

    // --- Específico Aves ---
    /** Precio de referencia por libra (pollo) */
    refPricePerLb?: number;
    /** Precio de referencia por entable */
    refEntablePrice?: number;

    // --- Específico Cultivos ---
    cropType?: string;
    areaSqM?: number;

    /** Lista de costos del lote */
    costs: FarmCost[];
}

// ------------------------------------------------------------------
// CONTENEDOR PRINCIPAL (BusinessData)
// ------------------------------------------------------------------

export interface BusinessData {
    projects: FarmProject[];
    sales: FarmSale[];
    clients: FarmClient[];
}
