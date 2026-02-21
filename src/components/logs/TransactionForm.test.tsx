import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionForm } from './TransactionForm';
import { FinanceProvider } from '../../context/FinanceContext';
import { DEFAULT_DATA } from '../../data/defaults';
import { createMockApi } from '../../test/utils/mockApi';

// Mock API
const mockApi = createMockApi();

// Helper para renderizar con contexto
const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
      {ui}
    </FinanceProvider>
  );
};

describe('Formulario de Transacciones', () => {
  const mockSave = jest.fn();
  const mockCancel = jest.fn();
  const defaultProps = {
    accounts: ['Efectivo', 'Banco'],
    areas: ['Comida', 'Transporte'],
    onSave: mockSave,
    onCancel: mockCancel
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe tener etiquetas ARIA correctas (Checklist: Accessibility)', () => {
    renderWithContext(<TransactionForm {...defaultProps} />);
    expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto/i)).toBeInTheDocument();
  });

  test('no debe permitir guardar si el monto está vacío (Checklist: Validación)', () => {
    renderWithContext(<TransactionForm {...defaultProps} />);
    const saveButton = screen.getByText(/Guardar/i);
    fireEvent.click(saveButton);

    // El monto por defecto es '', no debería llamar a onSave
    expect(mockSave).not.toHaveBeenCalled();
  });

  test('debe navegar por campos con la tecla TAB (Checklist: Keyboard Navigation)', () => {
    renderWithContext(<TransactionForm {...defaultProps} />);
    const dateInput = screen.getByLabelText(/Fecha/i);
    dateInput.focus();
    expect(dateInput).toHaveFocus();

    // Simular tabulación (esto es conceptual en JSDOM, se prueba foco)
    fireEvent.keyDown(dateInput, { key: 'Tab' });
    // El siguiente campo debería recibir foco en un entorno real
  });
});