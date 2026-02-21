import React, { useMemo } from 'react';
// Importamos el nuevo componente
import { SelectStyled } from '../ui/SelectStyled';
import { useFinance } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';

export const TransactionFilters = React.memo(({ visible, filters, setFilters }: any) => {
  const { state } = useFinance();
  const { t } = useTranslation();
  const { categoryRegistry, accountRegistry } = state;

  const timeOptions = useMemo(() => [
    { value: 'all', label: t('logs.filter.time.all') },
    { value: 'today', label: t('logs.filter.time.today') },
    { value: '7d', label: t('logs.filter.time.7d') },
    { value: 'thisMonth', label: t('logs.filter.time.thisMonth') },
    { value: 'lastMonth', label: t('logs.filter.time.lastMonth') },
  ], [t]);

  const areaOptions = useMemo(() => [
    { value: 'all', label: t('logs.filter.all') },
    ...categoryRegistry.map(c => ({ value: c.id, label: c.name }))
  ], [categoryRegistry, t]);

  const accountOptions = useMemo(() => [
    { value: 'all', label: t('logs.filter.all') },
    ...accountRegistry.map(a => ({ value: a.id, label: a.name }))
  ], [accountRegistry, t]);

  if (!visible) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[var(--background-secondary)]/30 rounded-3xl border border-[var(--background-modifier-border)] animate-in slide-in-from-top-2">
      <SelectStyled
        label={t('logs.filter.time')}
        value={filters.time}
        onChange={value => setFilters({ ...filters, time: value })}
        options={timeOptions}
      />

      <SelectStyled
        label={t('logs.filter.category')}
        value={filters.area}
        onChange={value => setFilters({ ...filters, area: value })}
        options={areaOptions}
      />

      <SelectStyled
        label={t('logs.filter.account')}
        value={filters.account}
        onChange={value => setFilters({ ...filters, account: value })}
        options={accountOptions}
      />

      {/* ✅ Filtro Avanzado: Solo Recurrentes */}
      <div className="md:col-span-3 flex items-center gap-2 pt-2 border-t border-[var(--background-modifier-border)] mt-1">
        <input
          type="checkbox"
          id="onlyRecurrents"
          checked={!!filters.onlyRecurrents}
          onChange={(e) => setFilters({ ...filters, onlyRecurrents: e.target.checked })}
          className="rounded border-[var(--background-modifier-border)] bg-[var(--background-primary)] text-[var(--interactive-accent)] focus:ring-[var(--interactive-accent)]"
        />
        <label htmlFor="onlyRecurrents" className="text-xs font-bold text-[var(--text-muted)] cursor-pointer select-none">
          {t('logs.filter.only_recurrent')}
        </label>
      </div>
    </div>
  );
});