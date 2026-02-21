// src/application/useTransactionsController.ts
import { useMemo, useCallback } from 'react';
import { Transaction } from '../types';
import { useFinance } from '../context/FinanceContext';
import { useAI } from '../hooks/useAI';

/**
 * Interfaz que define las capacidades del controlador.
 * Exportada para que los tests y componentes tengan tipado fuerte.
 */
export interface TransactionsController {
  transactions: Transaction[];
  stats: {
    income: number;
    expense: number;
    balance: number;
  };
  add(tx: Transaction): Promise<void>;
  update(tx: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
  importCSV(txs: Transaction[]): Promise<void>;
  parseFromAI(input: string): Promise<Partial<Transaction> | null>;
}

/**
 * Hook principal para la gestión de transacciones.
 * CLAVE: Se añade 'export' al inicio para resolver el error TS2459.
 */
export function useTransactionsController(): TransactionsController {
  const { state, dispatch, api } = useFinance();
  const { transactions } = state;
  const { parseTransaction } = useAI();

  // Cálculo de estadísticas consolidadas
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  // Acciones CRUD enviadas al Reducer global
  const add = useCallback(async (tx: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });

    // Sincronizar Ledger Mensual (Solo si está activado)
    if (state.settings.smartLedger && api && api.updateMonthlyLedger) {
      await api.updateMonthlyLedger([...transactions, tx], tx.date);
    }
  }, [dispatch, api, transactions, state.settings.smartLedger]);

  const update = useCallback(async (tx: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: tx });

    if (state.settings.smartLedger && api && api.updateMonthlyLedger) {
      const updatedList = transactions.map(t => t.id === tx.id ? tx : t);
      await api.updateMonthlyLedger(updatedList, tx.date);
    }
  }, [dispatch, api, transactions, state.settings.smartLedger]);

  const remove = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    if (tx && api && api.updateMonthlyLedger) {
      const updatedList = transactions.filter(t => t.id !== id);
      await api.updateMonthlyLedger(updatedList, tx.date);
    }
  }, [dispatch, api, transactions]);

  const importCSV = useCallback(async (txs: Transaction[]) => {
    dispatch({ type: 'ADD_TRANSACTIONS_BULK', payload: txs });
  }, [dispatch]);

  const parseFromAI = useCallback(async (input: string) => {
    return parseTransaction(input);
  }, [parseTransaction]);

  return {
    transactions,
    stats,
    add,
    update,
    remove,
    importCSV,
    parseFromAI
  };
}