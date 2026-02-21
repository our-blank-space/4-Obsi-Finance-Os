import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreditManager } from './CreditManager';
import { FinanceProvider } from '../context/FinanceContext';
import { DEFAULT_DATA } from '../data/defaults';
import { createMockApi } from '../test/utils/mockApi';

const mockApi = createMockApi();


jest.mock('../hooks/useCurrency', () => ({
    useCurrency: () => ({
        toBase: (val: number) => val,
        format: (val: number) => `$ ${val}`,
        baseCurrency: 'COP'
    })
}));

jest.mock('../hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: any = {
                'credit.debt.title': 'Gestor de Deudas',
                'credit.lending.title': 'Préstamos',
                'btn.add': 'Agregar',
                'common.no_records': 'No hay registros'
            };
            return map[key] || key;
        }
    })
}));

describe('CreditManager Component', () => {
    const mockProps = {
        items: [],
        onUpdate: jest.fn(),
        mode: 'debt' as const
    };

    test('renders Empty State initially', () => {
        render(
            <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
                <CreditManager {...mockProps} />
            </FinanceProvider>
        );
        expect(screen.getByText(/No hay registros/i)).toBeInTheDocument();
    });

    test('renders Add Modal when button clicked', () => {
        render(
            <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
                <CreditManager {...mockProps} />
            </FinanceProvider>
        );

        const addButton = screen.getByText(/Agregar/i);
        fireEvent.click(addButton);

        expect(screen.getByText(/Nuevo Crédito/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Acreedor/i)).toBeInTheDocument();
    });
});
