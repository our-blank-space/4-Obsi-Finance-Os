import { useMemo, useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../../types';

export type TimeFilter = 'all' | 'today' | '7d' | 'thisMonth' | 'lastMonth';

export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  time: TimeFilter;
  area: string;
  account: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  type: 'all',
  time: 'thisMonth',
  area: 'all',
  account: 'all'
};

export const useTransactionAnalytics = (transactions: Transaction[], toBase: any) => {
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('f-os-log-filters');
    return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
  });

  useEffect(() => {
    localStorage.setItem('f-os-log-filters', JSON.stringify(filters));
  }, [filters]);

  const { filtered, stats, chartData } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);

    let incomeTotal = 0;
    let expenseTotal = 0;
    const daysMap: Record<string, any> = {};

    const filtered = transactions.filter(t => {
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.area !== 'all' && t.area !== filters.area) return false;
      if (filters.account !== 'all' && t.from !== filters.account && t.to !== filters.account) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!(t.note.toLowerCase().includes(s) || t.area.toLowerCase().includes(s) || t.amount.toString().includes(s))) return false;
      }

      if (filters.time === 'today') return t.date === todayStr;
      if (filters.time === 'thisMonth') return t.date.startsWith(thisMonthStr);
      
      return true;
    });

    filtered.forEach(t => {
      const val = toBase(t.amount, t.currency);
      if (t.type === TransactionType.INCOME) incomeTotal += val;
      if (t.type === TransactionType.EXPENSE) expenseTotal += val;

      if (!daysMap[t.date]) daysMap[t.date] = { date: t.date, label: t.date.slice(8, 10), income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) daysMap[t.date].income += val;
      if (t.type === TransactionType.EXPENSE) daysMap[t.date].expense += val;
    });

    return {
      filtered: [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
      stats: { income: incomeTotal, expense: expenseTotal, net: incomeTotal - expenseTotal },
      chartData: Object.values(daysMap).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(-14)
    };
  }, [transactions, filters, toBase]);

  return { filters, setFilters, filtered, stats, chartData };
};