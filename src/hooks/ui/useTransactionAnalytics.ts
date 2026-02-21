import { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { useTransactionFilters } from './useTransactionFilters';
import { useFilteredTransactions } from './useFilteredTransactions';
import { useTransactionStats } from './useTransactionStats';
import { useCurrency } from '../useCurrency';
import { useTranslation } from '../useTranslation';

export { DEFAULT_FILTERS } from '../../storage/TransactionFilterStorage';
export type { LegacyFilterState as FilterState } from '../../types/filters';

export const useTransactionAnalytics = (transactions: Transaction[]) => {
  const { t, language } = useTranslation();
  const { filters, setFilters } = useTransactionFilters();
  const { toBase } = useCurrency();

  // En el futuro, 'advancedConditions' vendrá de un estado o prop
  const filtered = useFilteredTransactions(transactions, filters, [], toBase);
  const stats = useTransactionStats(filtered, toBase);

  const feedback = useMemo(() => {
    if (filtered.length === 0) return t('logs.no_records');
    // Clarificar que esto es del período/filtros actuales
    const locale = language === 'es' ? 'es-CO' : 'en-US';
    const netFormatted = new Intl.NumberFormat(locale).format(Math.abs(stats.net));
    const prefix = stats.net >= 0 ? '+' : '-';
    return t('logs.net_period', { val: `${prefix}${netFormatted}` });
  }, [filtered, stats, t, language]);

  const chartData = useMemo(() => {
    const daysMap: Record<string, any> = {};
    filtered.forEach(t => {
      const val = toBase(t.amount, t.currency);
      if (!daysMap[t.date]) {
        daysMap[t.date] = { date: t.date, label: t.date.slice(8, 10), income: 0, expense: 0 };
      }
      if (t.type === TransactionType.INCOME) daysMap[t.date].income += val;
      if (t.type === TransactionType.EXPENSE) daysMap[t.date].expense += val;
    });
    return Object.values(daysMap).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(-14);
  }, [filtered, toBase]);

  return { filters, setFilters, filtered, stats, chartData, feedback };
};