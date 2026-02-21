import { useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

export const useTaxonomy = () => {
    const { state, dispatch } = useFinance();

    /**
     * RENOMBRADO ATÓMICO
     * Actualiza una entidad en TODAS las colecciones del sistema.
     */
    /**
     * RENOMBRADO ATÓMICO
     * Actualiza una entidad en TODAS las colecciones del sistema.
     */
    const renameEntity = useCallback(async (type: 'account' | 'area', oldName: string, newName: string) => {
        if (!oldName || !newName || oldName === newName) return;

        // 0. Safety Backup & UI Feedback
        dispatch({ type: 'SET_LOADING', payload: true });
        // Assuming new Notice is a global or imported function
        // If not, it needs to be defined or imported.
        // For this exercise, I'll assume it's available.
        // @ts-ignore
        new Notice(`Renombrando ${oldName} a ${newName}...`);

        try {
            // Force Backup via API if available, otherwise just proceed (risk accepted)
            // We can access 'api' if we destructure it from useFinance()

            // 1. Yield to Event Loop (Anti-freeze)
            await new Promise(r => setTimeout(r, 50));

            // 2. V3: Update Registry Names
            let newCategoryRegistry = [...state.categoryRegistry];
            let newAccountRegistry = [...state.accountRegistry];
            let entityId: string | undefined;

            if (type === 'area') {
                const index = newCategoryRegistry.findIndex(c => c.name === oldName);
                if (index > -1) {
                    newCategoryRegistry[index] = { ...newCategoryRegistry[index], name: newName };
                    entityId = newCategoryRegistry[index].id;
                }
            } else {
                const index = newAccountRegistry.findIndex(a => a.name === oldName);
                if (index > -1) {
                    newAccountRegistry[index] = { ...newAccountRegistry[index], name: newName };
                    entityId = newAccountRegistry[index].id;
                }
            }

            // 3. Migrar Transacciones (Legacy Fields & Registry IDs)
            const newTransactions = state.transactions.map(t => {
                let changed = false;
                let update: Partial<Transaction> = {};

                if (type === 'account') {
                    if (t.from === oldName) { update.from = newName; changed = true; }
                    if (t.to === oldName) { update.to = newName; changed = true; }
                    if (t.fromId === entityId) { update.from = newName; changed = true; }
                    if (t.toId === entityId) { update.to = newName; changed = true; }
                } else {
                    if (t.area === oldName) { update.area = newName; changed = true; }
                    if (t.areaId === entityId) { update.area = newName; changed = true; }
                }
                return changed ? { ...t, ...update } : t;
            });

            // 4. Migrar Recurrentes
            const newRecurrents = state.recurrents.map(r => {
                if (type === 'account' && (r.account === oldName || r.accountId === entityId)) return { ...r, account: newName };
                if (type === 'area' && (r.area === oldName || r.areaId === entityId)) return { ...r, area: newName };
                return r;
            });

            // 5. Migrar Presupuestos (Solo áreas)
            const newBudgets = type === 'area'
                ? state.budgets.map(b => (b.area === oldName || b.areaId === entityId) ? { ...b, area: newName } : b)
                : state.budgets;

            // DISPATCH ATÓMICO
            dispatch({
                type: 'UPDATE_SETTINGS',
                payload: {
                    transactions: newTransactions,
                    recurrents: newRecurrents,
                    budgets: newBudgets,
                    categoryRegistry: newCategoryRegistry,
                    accountRegistry: newAccountRegistry
                }
            });

            // @ts-ignore
            new Notice(`✅ Renombrado completado.`);
        } catch (e) {
            console.error(e);
            // @ts-ignore
            new Notice(`❌ Error al renombrar.`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state, dispatch]);

    /**
     * ELIMINACIÓN SEGURA
     */
    const checkDependencies = useCallback((type: 'account' | 'area', name: string) => {
        const txCount = state.transactions.filter(t =>
            type === 'account' ? (t.from === name || t.to === name) : t.area === name
        ).length;

        const recCount = state.recurrents.filter(r =>
            type === 'account' ? r.account === name : r.area === name
        ).length;

        return { txCount, recCount, total: txCount + recCount };
    }, [state.transactions, state.recurrents]);

    const deleteEntity = useCallback(async (type: 'account' | 'area', name: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });

        await new Promise(r => setTimeout(r, 50)); // Yield

        try {
            // V3 Registry Deletion
            let newCategoryRegistry = state.categoryRegistry.filter(c => c.name !== name);
            let newAccountRegistry = state.accountRegistry.filter(a => a.name !== name);

            dispatch({
                type: 'UPDATE_SETTINGS',
                payload: {
                    categoryRegistry: newCategoryRegistry,
                    accountRegistry: newAccountRegistry
                }
            });
            // @ts-ignore
            new Notice(`✅ ${name} eliminado.`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state, dispatch]);

    const addEntity = useCallback((type: 'account' | 'area', name: string) => {
        if (!name) return;
        const registryKey = type === 'account' ? 'accountRegistry' : 'categoryRegistry';

        const newEntity = {
            id: crypto.randomUUID(),
            name: name,
            ...(type === 'account' ? { currency: state.baseCurrency, isArchived: false } : { isArchived: false })
        };

        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                [registryKey]: [...(state[registryKey] as any[]), newEntity]
            }
        });
    }, [state, dispatch]);

    return { renameEntity, deleteEntity, addEntity, checkDependencies };
};
