import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DemoSimulator from './DemoSimulator';
import { FinanceProvider } from '../context/FinanceContext';
import { DEFAULT_DATA } from '../data/defaults';
import { createMockApi } from '../test/utils/mockApi';

const mockApi = createMockApi();

describe('DemoSimulator Component', () => {
    const mockOnLoad = jest.fn();

    test('renders demo scenario description', () => {
        render(
            <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
                <DemoSimulator onLoadData={mockOnLoad} />
            </FinanceProvider>
        );

        // Verificar que se muestre el título "Demo Completo"
        expect(screen.getByText(/Demo Completo/i)).toBeInTheDocument();
        // Verificar el mensaje de advertencia
        expect(screen.getByText(/Advertencia: Borrará tus datos actuales/i)).toBeInTheDocument();
    });

    test('buttons valid actions', () => {
        render(
            <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
                <DemoSimulator onLoadData={mockOnLoad} />
            </FinanceProvider>
        );
        const btn = screen.getByText(/Cargar Datos Demo/i);
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();
    });
});
