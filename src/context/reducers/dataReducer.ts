import {
    Data, Ledger, Infra, Trading, Credit, Assets, Core, Business, Custodial, Simulations
} from '../../types';

export interface FinanceDataState extends Data.PluginData {
    history: Data.PluginData[]; // Basic undo history stack
    summaries?: Infra.GlobalSummary; // Runtime summaries
}

export const INITIAL_DATA_STATE: FinanceDataState = {
    version: 10,
    settings: {
        transactionsFolder: 'Finance/Transactions',
        createNoteOnLog: false,
        smartLedger: true,
        loggingStrategy: 'singleFile',
        language: 'es',
        geminiApiKey: '',
        autoSave: true,
        fiscalYearStart: 2020,
        useManualRates: false,
        manualExchangeRates: {}
    },
    features: {
        ai: false,
        projections: false,
        cashFlowChart: true,
        categoryChart: true,
        netWorthChart: true,
        savingsChart: true
    },
    exchangeRates: {},
    exchangeRate: 0,
    baseCurrency: 'COP',
    projectionParams: { years: 5, expectedReturn: 0.1, inflationRate: 0.04 },
    categoryRegistry: [],
    accountRegistry: [],
    assetTypes: [],
    enabledModules: [],
    transactions: [],
    budgets: [],
    recurrents: [],
    reminders: [],
    snapshots: [],
    assets: [],
    loans: [],
    debts: [],
    trades: [],
    tradingTransfers: [],
    tags: [],
    meta: { mode: 'production', version: 10 },
    custodialAccounts: [],
    business: { products: [], sales: [], clients: [] },
    scenarios: [],
    history: []
};

export type DataAction =
    | { type: 'ADD_TRANSACTION'; payload: Ledger.Transaction }
    | { type: 'UPDATE_TRANSACTION'; payload: Ledger.Transaction }
    | { type: 'DELETE_TRANSACTION'; payload: string }
    | { type: 'ADD_TRANSACTIONS_BULK'; payload: Ledger.Transaction[] }
    | { type: 'HYDRATE_SHARD'; payload: Ledger.Transaction[] }
    | { type: 'UNLOAD_OLD_DATA'; payload: string }
    | { type: 'ADD_BUDGET'; payload: Ledger.Budget }
    | { type: 'UPDATE_BUDGET'; payload: Ledger.Budget }
    | { type: 'DELETE_BUDGET'; payload: string }
    | { type: 'SET_DATA'; payload: Data.PluginData }
    | { type: 'SET_SUMMARIES'; payload: Infra.GlobalSummary }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<Data.PluginData> }
    | { type: 'UPDATE_FEATURE_FLAGS'; payload: Partial<Core.FeatureFlags> }
    | { type: 'LOAD_DATA'; payload: Data.PluginData }
    | { type: 'LOAD_DEMO_DATA'; payload: Data.PluginData }
    | { type: 'SET_SCENARIOS'; payload: Simulations.Scenario[] }
    | { type: 'ADD_CUSTODIAL_ACCOUNT'; payload: Custodial.CustodialAccount }
    | { type: 'UPDATE_CUSTODIAL_ACCOUNT'; payload: Custodial.CustodialAccount }
    | { type: 'ADD_CUSTODIAL_TRANSACTION'; payload: { accountId: string; transaction: Custodial.CustodialTransaction } }
    | { type: 'UPDATE_BUSINESS_DATA'; payload: Partial<Business.BusinessData> }
    | { type: 'LOAD_YEAR_HISTORY'; payload: Ledger.Transaction[] }
    | { type: 'SET_TRADES'; payload: Trading.Trade[] }
    | { type: 'SET_TRANSFERS'; payload: Trading.TradingTransfer[] }
    | { type: 'SET_RECURRENTS'; payload: Ledger.RecurrentTransaction[] }
    | { type: 'EXECUTE_RECURRENT'; payload: { transaction: Ledger.Transaction; recurrentId: string; nextDate: string; amountOverride?: number } }
    | { type: 'SET_LOANS'; payload: Credit.Loan[] }
    | { type: 'SET_DEBTS'; payload: Credit.Debt[] }
    | { type: 'SET_ASSETS'; payload: Assets.AssetProject[] }
    | { type: 'SET_REMINDERS'; payload: Infra.Reminder[] }
    | { type: 'SET_BUDGETS'; payload: Ledger.Budget[] }
    | { type: 'ADD_SNAPSHOT'; payload: Infra.WeeklySnapshot }
    | { type: 'UPDATE_SNAPSHOT'; payload: Infra.WeeklySnapshot }
    | { type: 'DELETE_SNAPSHOT'; payload: string }
    | { type: 'RESET_STATE'; payload: Data.PluginData }
    | { type: 'UNDO' };

export function dataReducer(state: FinanceDataState, action: DataAction): FinanceDataState {
    switch (action.type) {
        case 'ADD_TRANSACTIONS_BULK':
            return {
                ...state,
                history: [...state.history, state],
                transactions: [...action.payload, ...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };

        case 'HYDRATE_SHARD':
            // Fusionamos los datos del shard en el estado global sin duplicados
            const combined = [...state.transactions];
            action.payload.forEach(tx => {
                if (!combined.some(t => t.id === tx.id)) combined.push(tx);
            });
            // Ordenar por fecha descendente
            combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { ...state, transactions: combined };

        case 'UPDATE_SETTINGS':
            // Used for generic partial updates (settings, enabledModules, etc.)
            return { ...state, ...action.payload };

        case 'UPDATE_FEATURE_FLAGS':
            return {
                ...state,
                features: { ...state.features, ...action.payload }
            };

        case 'LOAD_DATA':
            return { ...state, ...action.payload };

        case 'LOAD_DEMO_DATA':
            return {
                ...state,
                ...action.payload,
                meta: { ...action.payload.meta, mode: 'demo' as any }
            };

        case 'SET_SCENARIOS':
            return { ...state, scenarios: action.payload };

        case 'ADD_CUSTODIAL_ACCOUNT':
            return { ...state, custodialAccounts: [...state.custodialAccounts, action.payload] };

        case 'UPDATE_CUSTODIAL_ACCOUNT':
            return {
                ...state,
                custodialAccounts: state.custodialAccounts.map(a => a.id === action.payload.id ? action.payload : a)
            };

        case 'ADD_CUSTODIAL_TRANSACTION':
            return {
                ...state,
                custodialAccounts: state.custodialAccounts.map(a =>
                    a.id === action.payload.accountId
                        ? { ...a, transactions: [action.payload.transaction, ...a.transactions] }
                        : a
                )
            };

        case 'UPDATE_BUSINESS_DATA':
            return { ...state, business: { ...state.business, ...action.payload } };

        case 'LOAD_YEAR_HISTORY':
            // Similar to HYDRATE_SHARD but specific intent
            const combinedHistory = [...state.transactions];
            action.payload.forEach(tx => {
                if (!combinedHistory.some(t => t.id === tx.id)) combinedHistory.push(tx);
            });
            combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { ...state, transactions: combinedHistory };

        case 'SET_TRADES':
            return { ...state, trades: action.payload };

        case 'SET_TRANSFERS':
            return { ...state, tradingTransfers: action.payload };

        case 'SET_RECURRENTS':
            return { ...state, recurrents: action.payload };

        case 'EXECUTE_RECURRENT':
            return {
                ...state,
                transactions: [action.payload.transaction, ...state.transactions],
                history: [...state.history, state], // Undo point
                recurrents: state.recurrents.map(r => r.id === action.payload.recurrentId ? {
                    ...r,
                    nextDate: action.payload.nextDate,
                    lastExecuted: new Date().toISOString().split('T')[0]
                } : r)
            };

        case 'SET_LOANS':
            return { ...state, loans: action.payload };

        case 'SET_DEBTS':
            return { ...state, debts: action.payload };

        case 'SET_ASSETS':
            return { ...state, assets: action.payload };

        case 'SET_REMINDERS':
            return { ...state, reminders: action.payload };

        case 'SET_BUDGETS':
            return { ...state, budgets: action.payload };

        case 'ADD_SNAPSHOT':
            return { ...state, snapshots: [action.payload, ...state.snapshots] };

        case 'UPDATE_SNAPSHOT':
            return {
                ...state,
                snapshots: state.snapshots.map(s => s.id === action.payload.id ? action.payload : s)
            };

        case 'DELETE_SNAPSHOT':
            return { ...state, snapshots: state.snapshots.filter(s => s.id !== action.payload) };

        case 'UNLOAD_OLD_DATA':
            // Don't unload current year data to avoid UI flickering or missing hot data
            const currentYearPrefix = new Date().getFullYear().toString();
            if (action.payload.startsWith(currentYearPrefix)) return state;

            return {
                ...state,
                transactions: state.transactions.filter(t => !t.date.startsWith(action.payload))
            };

        case 'UPDATE_TRANSACTION':
            const oldStateUpdate = { ...state, history: [...state.history, state] }; // Save for Undo
            if (oldStateUpdate.history.length > 20) oldStateUpdate.history.shift(); // Limit history

            return {
                ...oldStateUpdate,
                transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t)
            };

        case 'ADD_TRANSACTION':
            const oldStateAdd = { ...state, history: [...state.history, state] };
            return {
                ...oldStateAdd,
                transactions: [action.payload, ...state.transactions]
            };

        case 'DELETE_TRANSACTION':
            if (!action.payload) {
                console.warn("[Reducer] Attempted DELETE_TRANSACTION with empty payload. Aborting.");
                return state;
            }

            const initialCount = state.transactions.length;
            const kept = state.transactions.filter(t => t.id !== action.payload);

            if (kept.length === 0 && initialCount > 1) {
                console.error("[Reducer] CRITICAL: Deleted ALL transactions! Checking IDs of first 5:", state.transactions.slice(0, 5).map(t => t.id));
            }

            const oldStateDel = { ...state, history: [...state.history, state] };
            return {
                ...oldStateDel,
                transactions: kept
            };

        case 'ADD_BUDGET':
            return {
                ...state,
                budgets: [...state.budgets, action.payload]
            };

        case 'UPDATE_BUDGET':
            return {
                ...state,
                budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b)
            };

        case 'DELETE_BUDGET':
            return {
                ...state,
                budgets: state.budgets.filter(b => b.id !== action.payload)
            };

        case 'SET_DATA':
            return { ...state, ...action.payload };

        case 'SET_SUMMARIES':
            return { ...state, summaries: action.payload };

        case 'UNDO':
            if (state.history.length === 0) return state;
            const previous = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);
            return {
                ...previous,
                history: newHistory
            };

        case 'RESET_STATE':
            return {
                ...INITIAL_DATA_STATE,
                ...action.payload,
                history: []
            } as FinanceDataState;

        default:
            return state;
    }
}
