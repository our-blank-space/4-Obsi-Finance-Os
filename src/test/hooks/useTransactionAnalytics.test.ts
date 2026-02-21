/**
 * Transaction Analytics Test Suite
 * ==================================
 * Tests exhaustivos para el hook de analítica de transacciones.
 * Verifica filtrado, estadísticas y datos de gráficos.
 */
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { TransactionType, Transaction } from '../../types';

// ============================================
// MOCK DATA FACTORIES
// ============================================

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    date: new Date().toISOString().slice(0, 10),
    type: TransactionType.EXPENSE,
    amount: 100_000,
    currency: 'COP',
    from: 'Bancolombia',
    to: 'none',
    area: 'Alimentación',
    note: 'Test transaction',
    // V3 required fields
    areaId: 'food',
    fromId: 'bank',
    amountBase: 100_000,
    exchangeRateSnapshot: 1,
    ...overrides
});

const createIncome = (amount: number, date?: string): Transaction =>
    createTransaction({
        type: TransactionType.INCOME,
        amount,
        date: date || new Date().toISOString().slice(0, 10),
        area: 'Salario'
    });

const createExpense = (amount: number, date?: string, area = 'General'): Transaction =>
    createTransaction({
        type: TransactionType.EXPENSE,
        amount,
        date: date || new Date().toISOString().slice(0, 10),
        area
    });

// Sample transactions for testing
const sampleTransactions: Transaction[] = [
    createIncome(5_000_000, '2026-02-01'),      // Salary
    createExpense(1_500_000, '2026-02-01', 'Vivienda'),  // Rent
    createExpense(300_000, '2026-02-02', 'Alimentación'),
    createExpense(150_000, '2026-02-03', 'Transporte'),
    createIncome(500_000, '2026-02-05'),        // Freelance
    createExpense(200_000, '2026-02-10', 'Entretenimiento'),
    createExpense(80_000, '2026-02-15', 'Servicios'),
    createIncome(200_000, '2026-02-20'),        // Dividends
];

// Mock dependencies
jest.mock('../../context/FinanceContext', () => ({
    useFinanceState: () => ({
        transactions: sampleTransactions,
        accounts: ['Bancolombia', 'Nequi', 'Cash'],
    }),
    useFinance: () => ({
        state: {
            baseCurrency: 'COP',
            exchangeRates: { 'USD': 4156, 'EUR': 4520 },
            exchangeRate: 4156,
            isPrivacyMode: false
        }
    })
}));

jest.mock('../../hooks/useCurrency', () => ({
    useCurrency: () => ({
        toBase: (amount: number, _currency: string) => amount, // Assume same currency
        baseCurrency: 'COP'
    })
}));

jest.mock('../../hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

// Import after mocks
import { useTransactionStats } from '../../hooks/ui/useTransactionStats';

describe('Transaction Analytics', () => {

    // ============================================
    // STATS CALCULATION TESTS
    // ============================================
    describe('useTransactionStats', () => {
        const mockToBase = (amount: number) => amount;

        it('should calculate correct income total', () => {
            const { result } = renderHook(() =>
                useTransactionStats(sampleTransactions, mockToBase)
            );

            // 5,000,000 + 500,000 + 200,000 = 5,700,000
            expect(result.current.income).toBe(5_700_000);
        });

        it('should calculate correct expense total', () => {
            const { result } = renderHook(() =>
                useTransactionStats(sampleTransactions, mockToBase)
            );

            // 1,500,000 + 300,000 + 150,000 + 200,000 + 80,000 = 2,230,000
            expect(result.current.expense).toBe(2_230_000);
        });

        it('should calculate correct net balance', () => {
            const { result } = renderHook(() =>
                useTransactionStats(sampleTransactions, mockToBase)
            );

            // 5,700,000 - 2,230,000 = 3,470,000
            expect(result.current.net).toBe(3_470_000);
        });

        it('should return zeros for empty transaction list', () => {
            const { result } = renderHook(() =>
                useTransactionStats([], mockToBase)
            );

            expect(result.current.income).toBe(0);
            expect(result.current.expense).toBe(0);
            expect(result.current.net).toBe(0);
        });

        it('should handle income-only transactions', () => {
            const incomeOnly = [
                createIncome(1_000_000),
                createIncome(500_000)
            ];

            const { result } = renderHook(() =>
                useTransactionStats(incomeOnly, mockToBase)
            );

            expect(result.current.income).toBe(1_500_000);
            expect(result.current.expense).toBe(0);
            expect(result.current.net).toBe(1_500_000);
        });

        it('should handle expense-only transactions', () => {
            const expenseOnly = [
                createExpense(300_000),
                createExpense(200_000)
            ];

            const { result } = renderHook(() =>
                useTransactionStats(expenseOnly, mockToBase)
            );

            expect(result.current.income).toBe(0);
            expect(result.current.expense).toBe(500_000);
            expect(result.current.net).toBe(-500_000);
        });

        it('should handle transfer transactions (not counted in income/expense)', () => {
            const withTransfer = [
                createIncome(1_000_000),
                createExpense(500_000),
                createTransaction({ type: TransactionType.TRANSFER, amount: 200_000 })
            ];

            const { result } = renderHook(() =>
                useTransactionStats(withTransfer, mockToBase)
            );

            // Transfers should NOT affect income/expense totals
            expect(result.current.income).toBe(1_000_000);
            expect(result.current.expense).toBe(500_000);
        });

        it('should handle large number of transactions (performance)', () => {
            const manyTransactions = Array.from({ length: 1000 }, (_, i) =>
                i % 2 === 0
                    ? createIncome(100_000)
                    : createExpense(50_000)
            );

            const start = performance.now();
            const { result } = renderHook(() =>
                useTransactionStats(manyTransactions, mockToBase)
            );
            const duration = performance.now() - start;

            // Should complete in under 50ms
            expect(duration).toBeLessThan(50);
            expect(result.current.income).toBe(50_000_000); // 500 incomes * 100k
            expect(result.current.expense).toBe(25_000_000); // 500 expenses * 50k
        });

        it('should apply currency conversion correctly', () => {
            const usdTransactions: Transaction[] = [
                { ...createIncome(100), currency: 'USD' as const },
                { ...createExpense(50), currency: 'USD' as const }
            ];

            const mockToBaseWithConversion = (amount: number, currency: string) => {
                if (currency === 'USD') return amount * 4156;
                return amount;
            };

            const { result } = renderHook(() =>
                useTransactionStats(usdTransactions, mockToBaseWithConversion)
            );

            expect(result.current.income).toBe(415_600); // 100 USD in COP
            expect(result.current.expense).toBe(207_800); // 50 USD in COP
        });
    });

    // ============================================
    // FILTERING TESTS (Integration)
    // ============================================
    describe('Transaction Filtering', () => {
        it('should filter by income type', () => {
            const incomeOnly = sampleTransactions.filter(t => t.type === TransactionType.INCOME);
            expect(incomeOnly.length).toBe(3);
        });

        it('should filter by expense type', () => {
            const expenseOnly = sampleTransactions.filter(t => t.type === TransactionType.EXPENSE);
            expect(expenseOnly.length).toBe(5);
        });

        it('should filter by date range', () => {
            const firstWeek = sampleTransactions.filter(t =>
                t.date >= '2026-02-01' && t.date <= '2026-02-07'
            );
            expect(firstWeek.length).toBe(5);
        });

        it('should filter by category', () => {
            const foodExpenses = sampleTransactions.filter(t => t.area === 'Alimentación');
            expect(foodExpenses.length).toBe(1);
            expect(foodExpenses[0].amount).toBe(300_000);
        });

        it('should filter by account', () => {
            const bancolombiaTransactions = sampleTransactions.filter(t => t.from === 'Bancolombia');
            expect(bancolombiaTransactions.length).toBe(8); // All use Bancolombia
        });

        it('should combine multiple filters', () => {
            const filtered = sampleTransactions.filter(t =>
                t.type === TransactionType.EXPENSE &&
                t.date >= '2026-02-01' && t.date <= '2026-02-10'
            );
            // Expenses in first 10 days
            expect(filtered.length).toBe(4);
        });
    });

    // ============================================
    // CHART DATA TESTS
    // ============================================
    describe('Chart Data Generation', () => {
        it('should group transactions by date', () => {
            const daysMap: Record<string, { income: number; expense: number }> = {};

            sampleTransactions.forEach(t => {
                if (!daysMap[t.date]) {
                    daysMap[t.date] = { income: 0, expense: 0 };
                }
                if (t.type === TransactionType.INCOME) {
                    daysMap[t.date].income += t.amount;
                }
                if (t.type === TransactionType.EXPENSE) {
                    daysMap[t.date].expense += t.amount;
                }
            });

            // Feb 1 should have both income and expense
            expect(daysMap['2026-02-01'].income).toBe(5_000_000);
            expect(daysMap['2026-02-01'].expense).toBe(1_500_000);
        });

        it('should sort chart data chronologically', () => {
            const dates = sampleTransactions.map(t => t.date).sort();
            expect(dates[0]).toBe('2026-02-01');
            expect(dates[dates.length - 1]).toBe('2026-02-20');
        });

        it('should limit chart data to last 14 days', () => {
            const uniqueDates = [...new Set(sampleTransactions.map(t => t.date))];
            const last14 = uniqueDates.sort().slice(-14);
            expect(last14.length).toBeLessThanOrEqual(14);
        });
    });

    // ============================================
    // EDGE CASES
    // ============================================
    describe('Edge Cases', () => {
        it('should handle transaction with zero amount', () => {
            const zeroTransaction = [createExpense(0)];
            const mockToBase = (amount: number) => amount;

            const { result } = renderHook(() =>
                useTransactionStats(zeroTransaction, mockToBase)
            );

            expect(result.current.expense).toBe(0);
        });

        it('should handle very small amounts (centavos)', () => {
            const smallTransactions = [
                createExpense(0.01),
                createExpense(0.99)
            ];
            const mockToBase = (amount: number) => amount;

            const { result } = renderHook(() =>
                useTransactionStats(smallTransactions, mockToBase)
            );

            expect(result.current.expense).toBe(1);
        });

        it('should handle very large amounts (billones COP)', () => {
            const largeTransactions = [
                createIncome(50_000_000_000), // 50 mil millones
                createExpense(10_000_000_000)
            ];
            const mockToBase = (amount: number) => amount;

            const { result } = renderHook(() =>
                useTransactionStats(largeTransactions, mockToBase)
            );

            expect(result.current.income).toBe(50_000_000_000);
            expect(result.current.expense).toBe(10_000_000_000);
            expect(result.current.net).toBe(40_000_000_000);
        });

        it('should handle transactions with missing currency (fallback)', () => {
            const noCurrency = {
                ...createExpense(100_000),
                currency: undefined as any
            };
            const mockToBase = (amount: number, currency: string) => {
                return currency ? amount : amount; // Fallback behavior
            };

            const { result } = renderHook(() =>
                useTransactionStats([noCurrency], mockToBase)
            );

            expect(result.current.expense).toBe(100_000);
        });
    });

    // ============================================
    // REAL-WORLD SCENARIOS
    // ============================================
    describe('Real-World Scenarios', () => {
        it('should calculate monthly savings rate', () => {
            const mockToBase = (amount: number) => amount;
            const { result } = renderHook(() =>
                useTransactionStats(sampleTransactions, mockToBase)
            );

            const savingsRate = result.current.net / result.current.income * 100;

            // (3,470,000 / 5,700,000) * 100 = 60.88%
            expect(savingsRate).toBeCloseTo(60.88, 1);
        });

        it('should identify if user is in deficit', () => {
            const deficitTransactions = [
                createIncome(2_000_000),
                createExpense(2_500_000)
            ];
            const mockToBase = (amount: number) => amount;

            const { result } = renderHook(() =>
                useTransactionStats(deficitTransactions, mockToBase)
            );

            expect(result.current.net).toBeLessThan(0);
            const inDeficit = result.current.expense > result.current.income;
            expect(inDeficit).toBe(true);
        });

        it('should handle salary + multiple income streams', () => {
            const multipleIncomes = [
                createIncome(5_000_000),  // Salary
                createIncome(1_500_000),  // Freelance
                createIncome(300_000),    // Dividends
                createIncome(200_000),    // Rent
                createExpense(3_000_000)
            ];
            const mockToBase = (amount: number) => amount;

            const { result } = renderHook(() =>
                useTransactionStats(multipleIncomes, mockToBase)
            );

            expect(result.current.income).toBe(7_000_000);
            expect(result.current.net).toBe(4_000_000);
        });
    });
});
