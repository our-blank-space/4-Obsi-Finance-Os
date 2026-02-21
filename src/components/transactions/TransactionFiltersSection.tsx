import React from 'react';
import { TransactionFilters } from '../logs/TransactionFilters';
import { Filter, Calendar, X, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { FinanceAccount, FinanceCategory } from '../../types';
import { LegacyFilterState } from '../../types/filters';
import { useTranslation } from '../../hooks/useTranslation';

interface TransactionFiltersSectionProps {
  accounts: FinanceAccount[];
  areas: FinanceCategory[];
  setFilters: (filters: LegacyFilterState) => void;
  filters: LegacyFilterState;
  isFiltersVisible: boolean;
  setIsFiltersVisible: (visible: boolean) => void;
}

export const TransactionFiltersSection: React.FC<TransactionFiltersSectionProps> = ({
  accounts,
  areas,
  filters,
  setFilters,
  isFiltersVisible,
  setIsFiltersVisible,
}) => {
  const { t } = useTranslation();
  // Detectar si hay un filtro de fecha activo (formato YYYY-MM-DD)
  const isDateFilter = filters.search && /^\d{4}-\d{2}-\d{2}$/.test(filters.search);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      setFilters({ ...filters, search: date, time: 'all' });
    }
  };

  const clearDateFilter = () => {
    setFilters({ ...filters, search: '', time: 'thisMonth' });
  };

  return (
    <div className="space-y-3 shrink-0">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar - Reemplaza funcionalidad de fecha si se usa */}
        <div className="flex-1">
          <Input
            placeholder={t('logs.filter.search_placeholder') || "Buscar..."}
            value={isDateFilter ? '' : filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, time: 'all' })}
            icon={<Search size={14} />}
            rightElement={
              filters.search && !isDateFilter ? (
                <button
                  onClick={() => setFilters({ ...filters, search: '', time: 'thisMonth' })}
                  className="hover:text-[var(--text-normal)] transition-colors"
                >
                  <X size={14} />
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="flex gap-2 justify-between">
          {/* Selector de Fecha - Estilo Obsidian */}
          <div className="relative flex items-center group">
            <Calendar
              size={14}
              className={`absolute left-3.5 pointer-events-none transition-colors z-10 ${isDateFilter ? 'text-[var(--interactive-accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-normal)]'}`}
            />
            <input
              type="date"
              value={isDateFilter ? filters.search : ''}
              onChange={handleDateChange}
              className={`
              pl-10 pr-3 py-2 h-10 rounded-2xl
              border bg-[var(--background-modifier-form-field)]
              text-sm font-medium
              focus:outline-none focus:ring-1 focus:ring-[var(--interactive-accent)]/50 focus:border-[var(--interactive-accent)]
              cursor-pointer transition-all duration-200
              appearance-none
              [&::-webkit-calendar-picker-indicator]:hidden
              ${isDateFilter
                  ? 'border-[var(--interactive-accent)] text-[var(--text-normal)] ring-1 ring-[var(--interactive-accent)]/20'
                  : 'border-[var(--background-modifier-border)] text-[var(--text-muted)] hover:border-[var(--interactive-accent)]'
                }
            `}
              style={{ colorScheme: 'dark' }}
            />
            {isDateFilter && (
              <button
                onClick={clearDateFilter}
                className="absolute right-8 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-error)] hover:bg-[var(--background-modifier-error-hover)] transition-all"
                aria-label="Limpiar fecha"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className={`
            flex items-center gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all text-xs font-bold uppercase tracking-wide
            ${isFiltersVisible
                ? 'bg-[var(--interactive-accent)] text-white border-[var(--interactive-accent)] shadow-lg shadow-[var(--interactive-accent)]/20'
                : 'bg-[var(--background-secondary)] border-[var(--background-modifier-border)] text-[var(--text-muted)] hover:text-[var(--text-normal)]'
              }
          `}
            aria-label="Toggle filters"
          >
            <Filter size={14} />
            {isFiltersVisible ? t('logs.filters.hide') : t('logs.filters.show')}
          </button>
        </div>
      </div>

      <TransactionFilters
        visible={isFiltersVisible}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};
