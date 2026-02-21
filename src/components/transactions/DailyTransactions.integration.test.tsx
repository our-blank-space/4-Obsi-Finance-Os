import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DailyTransactionsContainer } from './DailyTransactionsContainer';
import { FinanceProvider } from '../../context/FinanceContext';
import { DEFAULT_DATA } from '../../data/defaults';
import { createMockApi } from '../../test/utils/mockApi';

// Mock de la API de Obsidian
const mockApi = createMockApi();

describe('Flujo de Usuario FinanceOS', () => {
  test('debe abrir el modal de "Nuevo" y cerrarlo', async () => {
    // CLAVE: Envolvemos en el Provider real con datos por defecto
    render(
      <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
        <DailyTransactionsContainer
          accounts={[{ id: 'acc-1', name: 'Banco', currency: 'COP', isArchived: false }]}
          areas={[{ id: 'cat-1', name: 'Salud', type: 'expense', isArchived: false }]}
        />
      </FinanceProvider>
    );

    const addButton = screen.getByText(/NUEVO/i);
    fireEvent.click(addButton);

    expect(screen.getByText(/Nuevo Movimiento/i)).toBeInTheDocument();

    const cancelButton = screen.getByText(/Cancelar/i);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Nuevo Movimiento/i)).not.toBeInTheDocument();
    });
  });
});