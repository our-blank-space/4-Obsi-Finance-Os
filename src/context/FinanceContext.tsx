
import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from 'react';
import { Data, Obsidian } from '../types';
import { dataReducer, INITIAL_DATA_STATE, DataAction, FinanceDataState } from './reducers/dataReducer';
import { uiReducer, INITIAL_UI_STATE, UIAction, FinanceUIState } from './reducers/uiReducer';

// Re-export Legacy State Type for backward compatibility
export type FinanceState = FinanceDataState & FinanceUIState;

// =========================================
// 1. CONTEXT DEFINITIONS (SPLIT ARCHITECTURE)
// =========================================

// Data Context (Heavy, Stable)
const DataContext = createContext<FinanceDataState | null>(null);

// UI Context (Light, Volatile)
const UIContext = createContext<FinanceUIState | null>(null);

// Dispatch Context (Stable)
const DispatchContext = createContext<React.Dispatch<any> | null>(null);

// API Context (Static)
const ApiContext = createContext<Obsidian.FinanceObsidianAPI | null>(null);

interface FinanceProviderProps {
    children: React.ReactNode;
    initialData: Data.PluginData;
    api: Obsidian.FinanceObsidianAPI;
}

// =========================================
// 2. MAIN PROVIDER
// =========================================

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children, initialData, api }) => {

    // --- 1. DATA STATE (Heavy) ---
    const [dataState, dispatchData] = useReducer(dataReducer, INITIAL_DATA_STATE, (defaultState) => {
        return {
            ...defaultState,
            ...initialData,
            // Ensure meta exists
            meta: {
                ...initialData.meta,
                mode: 'production'
            },
            history: [] // Init empty undo history
        } as FinanceDataState;
    });

    // Detect Force Reset from Parent (Refreshes state when initialData reference changes)
    useEffect(() => {
        if (initialData) {
            dispatchData({ type: 'RESET_STATE', payload: initialData });
        }
    }, [initialData]);

    // --- 2. UI STATE (Light) ---
    const [uiState, dispatchUI] = useReducer(uiReducer, {
        ...INITIAL_UI_STATE,
        // If data is loaded, stop loading
        isLoading: false
    });

    // --- 3. PERSISTENCE LAYER (DELEGATED TO SERVICE) ---
    const dataRef = useRef(dataState);

    // Keep ref synced for async access if needed
    useEffect(() => {
        dataRef.current = dataState;
    }, [dataState]);

    // Forward changes to PersistenceService (via API)
    useEffect(() => {
        // Skip initial load checks here, strict emptiness check or loaded flag is better handled in Service
        if (dataState.meta?.mode === 'demo') return;
        if (!dataState.settings.autoSave) return;

        // Direct handoff to the robust service
        // The service handles Debounce, Queueing, and Flush-on-Unload
        api.scheduleSave(dataState);

    }, [dataState, api]);

    // --- 4. DATA LOADING & EXTERNAL EVENTS ---

    // Load Summaries Async
    useEffect(() => {
        const loadSummaries = async () => {
            try {
                const summaries = await api.getSummaries();
                if (summaries) {
                    dispatchData({ type: 'SET_SUMMARIES', payload: summaries });
                }
            } catch (e) {
                console.error("Failed to load summaries", e);
            }
        };
        loadSummaries();
    }, [api]);

    // External Events Listener
    useEffect(() => {
        const handleExternalUpdate = (e: Event) => {
            if (dataRef.current.meta?.mode === 'demo') return;
            const updatedTx = (e as CustomEvent).detail;
            dispatchData({ type: 'UPDATE_TRANSACTION', payload: updatedTx });
        };
        window.addEventListener('finance-os-external-update', handleExternalUpdate);
        return () => window.removeEventListener('finance-os-external-update', handleExternalUpdate);
    }, []);

    // --- 5. UNIFIED DISPATCHER (ROUTER) ---
    const dispatch = useMemo(() => (action: DataAction | UIAction) => {
        // Simple routing based on action type prefix or known UI actions
        const uiActions = ['SET_VIEW', 'TOGGLE_PRIVACY', 'SET_LOADING', 'OPEN_MODAL', 'CLOSE_MODAL'];

        if (uiActions.includes((action as any).type)) {
            dispatchUI(action as UIAction);
        } else {
            dispatchData(action as DataAction);
        }
    }, []);

    return (
        <DataContext.Provider value={dataState}>
            <UIContext.Provider value={uiState}>
                <DispatchContext.Provider value={dispatch}>
                    <ApiContext.Provider value={api}>
                        {children}
                    </ApiContext.Provider>
                </DispatchContext.Provider>
            </UIContext.Provider>
        </DataContext.Provider>
    );
};

// =========================================
// 3. HOOKS (NEW & LEGACY)
// =========================================

// Modern Hook: Access Data State Only
export const useFinanceData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useFinanceData must be used within FinanceProvider");
    return ctx;
};

// Modern Hook: Access UI State Only
export const useFinanceUI = () => {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error("useFinanceUI must be used within FinanceProvider");
    return ctx;
};

// Modern Hook: Access Dispatch Only
export const useFinanceDispatch = () => {
    const ctx = useContext(DispatchContext);
    if (!ctx) throw new Error("useFinanceDispatch must be used within FinanceProvider");
    return ctx;
};

// --- LEGACY FACADE (MAINTAINS 100% COMPATIBILITY) ---
export const useFinance = () => {
    const data = useContext(DataContext);
    const ui = useContext(UIContext);
    const dispatch = useContext(DispatchContext);
    const api = useContext(ApiContext);

    if (!data || !ui || !dispatch || !api) {
        throw new Error("useFinance must be used within FinanceProvider");
    }

    // Reconstruct the Monolithic State Object on the fly
    // Memoized to prevent referential instability unless data/ui changes
    const state = useMemo(() => ({
        ...data,
        ...ui
    } as FinanceState), [data, ui]);

    // Helpers
    const getCategoryName = (idOrName: string | undefined): string => {
        if (!idOrName) return 'Sin Categoría';
        const cat = data.categoryRegistry.find(c => c.id === idOrName);
        return cat ? cat.name : idOrName;
    };

    const getAccountName = (idOrName: string | undefined): string => {
        if (!idOrName) return 'Sin Cuenta';
        const acc = data.accountRegistry.find(a => a.id === idOrName);
        return acc ? acc.name : idOrName;
    };

    const getAccountCurrency = (idOrName: string | undefined): string => {
        if (!idOrName) return data.baseCurrency;
        const acc = data.accountRegistry.find(a => a.id === idOrName);
        return acc ? acc.currency : data.baseCurrency;
    };

    return {
        state,
        dispatch,
        api,
        saveDataNow: async () => api.forceSave(data),
        undo: () => dispatch({ type: 'UNDO' }),
        getCategoryName,
        getAccountName,
        getAccountCurrency
    };
};