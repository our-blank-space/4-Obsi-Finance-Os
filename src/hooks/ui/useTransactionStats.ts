import { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';

export const useTransactionStats = (transactions: Transaction[], toBase: (amount: number, currency: string) => number) => {
    return useMemo(() => {
        let income = 0;
        let expense = 0;
        transactions.forEach(t => {
            const val = toBase(t.amount, t.currency);
            if (t.type === TransactionType.INCOME) income += val;
            if (t.type === TransactionType.EXPENSE) expense += val;
        });
        return { income, expense, net: income - expense };
    }, [transactions, toBase]);
};
