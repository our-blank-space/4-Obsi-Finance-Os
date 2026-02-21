
import { renderHook, act } from '@testing-library/react';
import { useTaxonomy } from '../hooks/useTaxonomy';
import { TransactionType, PluginData } from '../types';

// 1. Mock Data Setup (Phase 4 Normalized)
const MOCK_DATA: Partial<PluginData> = {
    transactions: [
        { id: '1', date: '2026-01-01', amount: 10, type: TransactionType.EXPENSE, area: 'Uber', from: 'Cash', currency: 'USD' } as any,
        { id: '2', date: '2026-01-02', amount: 20, type: TransactionType.EXPENSE, area: 'Food', from: 'Bank', currency: 'USD' } as any
    ],
    recurrents: [],
    budgets: [],
    categoryRegistry: [{ id: 'cat-uber', name: 'Uber' }, { id: 'cat-trans', name: 'Transport' }, { id: 'cat-food', name: 'Food' }] as any,
    accountRegistry: [{ id: 'acc-cash', name: 'Cash' }, { id: 'acc-bank', name: 'Bank' }] as any
};

const mockDispatch = jest.fn();

// 2. Mock useFinance Hook (Avoids Provider/JSX entirely)
jest.mock('../context/FinanceContext', () => ({
    useFinance: () => ({
        state: MOCK_DATA,
        dispatch: mockDispatch
    })
}));

describe('Taxonomy Manager Logic', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('Rename: Should dispatch UPDATE_SETTINGS with migrated transactions and registry', async () => {
        const { result } = renderHook(() => useTaxonomy());

        await act(async () => {
            await result.current.renameEntity('area', 'Uber', 'Transport');
        });

        // El hook hace 2 dispatches: SET_LOADING (primero) y UPDATE_SETTINGS (segundo)
        expect(mockDispatch).toHaveBeenCalled();

        // Buscar el dispatch de UPDATE_SETTINGS
        const updateCall = mockDispatch.mock.calls.find((call: any) => call[0].type === 'UPDATE_SETTINGS');
        expect(updateCall).toBeDefined();

        const payload = updateCall[0].payload;

        // Check Registry update
        const renamedCat = payload.categoryRegistry.find((c: any) => c.id === 'cat-uber');
        expect(renamedCat.name).toBe('Transport');

        // Check Transaction Migration (legacy field for UI)
        const migratedTx = payload.transactions.find((t: any) => t.id === '1');
        expect(migratedTx.area).toBe('Transport');
    });

    it('Check Dependencies: Should return correct count', () => {
        const { result } = renderHook(() => useTaxonomy());
        const deps = result.current.checkDependencies('area', 'Uber');
        expect(deps.txCount).toBe(1);
    });

    it('Delete: Should remove from Registry', async () => {
        const { result } = renderHook(() => useTaxonomy());

        await act(async () => {
            await result.current.deleteEntity('area', 'Food');
        });

        // Buscar el dispatch de UPDATE_SETTINGS
        const updateCall = mockDispatch.mock.calls.find((call: any) => call[0].type === 'UPDATE_SETTINGS');
        expect(updateCall).toBeDefined();

        const payload = updateCall[0].payload;

        const foodExists = payload.categoryRegistry.some((c: any) => c.name === 'Food');
        expect(foodExists).toBe(false);
    });
});
