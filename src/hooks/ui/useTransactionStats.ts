import { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';

export const useTransactionStats = (
  filteredTransactions: Transaction[],
  toBase: (amount: number, currency: any) => number
) => {
  return useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;

    filteredTransactions.forEach((t) => {
      const val = toBase(t.amount, t.currency);
      if (t.type === TransactionType.INCOME) incomeTotal += val;
      if (t.type === TransactionType.EXPENSE) expenseTotal += val;
    });

    return {
      income: incomeTotal,
      expense: expenseTotal,
      net: incomeTotal - expenseTotal,
    };
  }, [filteredTransactions, toBase]);
};
