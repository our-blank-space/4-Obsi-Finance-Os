// src/data/defaults.ts
import { Data, FinanceModule } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_AREAS, DEFAULT_ASSET_TYPES } from './taxonomy';

/**
 * AXIOMAS FINANCIEROS INICIALES
 */
export const DEFAULT_DATA: Data.PluginData = {
    version: 11,
    // ✅ ELIMINADO: 'language' (ahora vive solo en settings)

    settings: {
        transactionsFolder: 'Finance/Transactions',
        createNoteOnLog: true,
        smartLedger: true,
        loggingStrategy: 'dailyNote',
        language: 'es', // ✅ Fuente única de idioma
        geminiApiKey: '',
        autoSave: true,
        fiscalYearStart: 2020,

        // Resilience: Tasas Manuales
        useManualRates: false,
        manualExchangeRates: {},

        // Testing Mode
        testingMode: false,
        simulatedDate: undefined
    },
    features: {
        ai: true,
        projections: true,
        cashFlowChart: true,
        categoryChart: true,
        netWorthChart: true,
        savingsChart: true
    },
    projectionParams: {
        years: 20,
        expectedReturn: 8,
        inflationRate: 3
    },
    // ✅ ELIMINADO: 'exchangeRate' (singular/legacy) eliminado para evitar confusión

    exchangeRates: {
        'USD': 4000,
        'EUR': 4300,
        'GBP': 5000,
        'MXN': 230,
        'BRL': 780
    },
    exchangeRate: 4000,
    baseCurrency: 'COP',
    enabledModules: [...Object.values(FinanceModule)],
    assetTypes: DEFAULT_ASSET_TYPES,

    // Configuración Inicial de Registros
    categoryRegistry: DEFAULT_AREAS.map(area => ({
        id: `cat-${area.toLowerCase().replace(/\s+/g, '-')}`,
        name: area,
        isArchived: false
    })),
    accountRegistry: DEFAULT_ACCOUNTS.map(account => ({
        id: `acc-${account.toLowerCase().replace(/\s+/g, '-')}`,
        name: account,
        currency: 'COP' as const,
        isArchived: false
    })),

    // Estado Inicial Vacío
    transactions: [],
    recurrents: [],
    budgets: [],
    reminders: [],
    snapshots: [],
    assets: [],
    loans: [],
    debts: [],
    trades: [],
    tradingTransfers: [],

    // ✅ NUEVO: Inicialización del registro global de tags
    tags: [],

    meta: {
        mode: 'production',
        version: 11
    },
    custodialAccounts: [],

    business: {
        projects: [],
        products: [],
        sales: [],
        clients: []
    },

    scenarios: [],
};

export const DEFAULT_SETTINGS = DEFAULT_DATA.settings;