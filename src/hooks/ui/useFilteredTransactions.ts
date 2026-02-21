import { useMemo } from 'react';
import { Transaction } from '../../types';
import { LegacyFilterState, FilterCondition } from '../../types/filters';
import { FilterEngine } from '../../utils/filterEngine';

export const useFilteredTransactions = (
  transactions: Transaction[],
  filters: LegacyFilterState,
  advancedConditions: FilterCondition[] = [],
  toBase: (amount: number, currency: any) => number
) => {
  return useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    // 1. Filtrado Rápido (Legacy)
    let result = transactions.filter((t) => {
      if (!t) return false;
      if (filters.type !== 'all' && t.type !== filters.type) return false;

      // Hybrid Filter: Match by ID (New) or Name (Legacy)
      if (filters.area !== 'all') {
        const matchId = t.areaId === filters.area;
        const matchName = t.area === filters.area;
        if (!matchId && !matchName) return false;
      }

      if (filters.account !== 'all') {
        // Account can be 'from' or 'to' (Transfer)
        const isFrom = (t.fromId === filters.account) || (t.from === filters.account);
        const isTo = (t.toId === filters.account) || (t.to === filters.account);
        if (!isFrom && !isTo) return false;
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matches =
          (t.note || '').toLowerCase().includes(s) ||
          (t.area || '').toLowerCase().includes(s) ||
          (t.from || '').toLowerCase().includes(s) ||
          (t.date || '').includes(s) || // Permite filtrar por fecha al hacer clic en gráfico
          t.amount.toString().includes(s);
        if (!matches) return false;
      }

      const now = new Date();
      if (filters.time === 'today') return t.date === now.toISOString().split('T')[0];
      if (filters.time === 'thisMonth') return t.date.startsWith(now.toISOString().slice(0, 7));

      // ✅ Filtro Avanzado: Solo Recurrentes
      if (filters.onlyRecurrents) {
        const hasRecTag = t.tags?.some(tag => tag && tag.startsWith('rec_id:'));
        if (!hasRecTag) return false;
      }

      return true;
    });

    // 2. Filtrado Avanzado (Motor Nuevo)
    if (advancedConditions.length > 0) {
      result = FilterEngine.applyFilters(result, advancedConditions);
    }

    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filters, advancedConditions, toBase]);
};