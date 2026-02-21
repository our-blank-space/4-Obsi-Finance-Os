import { renderHook } from '@testing-library/react';
import { useTransactionAnalytics } from './useTransactionAnalytics';
import { Transaction, TransactionType } from '../../types';

jest.mock('../useCurrency', () => ({
  useCurrency: () => ({ toBase: (amt: number) => amt })
}));
jest.mock('../useTranslation', () => ({
  useTranslation: () => ({ t: (s: string) => s })
}));

const mockTransactions: Transaction[] = [
  { id: '1', amount: 100, type: TransactionType.INCOME, date: '2026-02-01', area: 'Salary', from: 'Bank', to: 'none', note: 'Test', currency: 'COP', areaId: 'salary', fromId: 'bank', amountBase: 100, exchangeRateSnapshot: 1 },
  { id: '2', amount: 40, type: TransactionType.EXPENSE, date: '2026-02-02', area: 'Food', from: 'Cash', to: 'none', note: 'Lunch', currency: 'COP', areaId: 'food', fromId: 'cash', amountBase: 40, exchangeRateSnapshot: 1 }
];

describe('Analítica de Transacciones', () => {
  test('debe calcular correctamente el balance neto', () => {
    const { result } = renderHook(() => useTransactionAnalytics(mockTransactions));
    expect(result.current.stats.net).toBe(60);
  });
});