import React from 'react';
import { render, screen } from '@testing-library/react';
import Budgets from './Budgets';
import { FinanceProvider } from '../context/FinanceContext';
import { DEFAULT_DATA } from '../data/defaults';
import { createMockApi } from '../test/utils/mockApi';
import { BudgetType } from '../types';

const mockApi = createMockApi();

// Mock hooks
jest.mock('../hooks/useCurrency', () => ({
    useCurrency: () => ({
        convert: (val: number) => val,
        toBase: (val: number) => val,
        format: (val: number) => `$ ${val}`,
        baseCurrency: 'COP'
    })
}));

jest.mock('../hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: any = {
                'bud.new': 'Nuevo Presupuesto',
                'bud.title': 'Presupuestos',
                'bud.health.coverage': 'Cobertura',
                'bud.income_goals': 'Metas de Ingreso',
                'bud.expense_limits': 'Límites de Gasto'
            };
            return map[key] || key;
        }
    })
}));

// Mock useBudgetMonitor
jest.mock('../hooks/useBudgetMonitor', () => ({
    useBudgetMonitor: () => ({
        income: [],
        expenses: [],
        summary: {
            coverage: 1.5,
            isSustainable: true,
            monthProgress: 50
        },
        status: 'ready'
    })
}));

describe('Budgets Component', () => {
    const testData = {
        ...DEFAULT_DATA,
        budgets: [
            {
                id: '1',
                areaId: 'cat-1',
                area: 'Comida',
                amount: 500000,
                currency: 'COP' as const,
                type: BudgetType.EXPENSE
            }
        ],
        categoryRegistry: [
            { id: 'cat-1', name: 'Comida', type: 'expense' as const, isArchived: false },
            { id: 'cat-2', name: 'Transporte', type: 'expense' as const, isArchived: false }
        ]
    };

    test('renders budget component with title', () => {
        render(
            <FinanceProvider initialData={testData} api={mockApi}>
                <Budgets />
            </FinanceProvider>
        );

        // Validate Header
        expect(screen.getByText(/Presupuestos/i)).toBeInTheDocument();

        // Check for budget sections
        expect(screen.getByText(/Metas de Ingreso/i)).toBeInTheDocument();
        expect(screen.getByText(/Límites de Gasto/i)).toBeInTheDocument();
    });
});
