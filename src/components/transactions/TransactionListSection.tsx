import React from 'react';
import { VList } from 'virtua';
import { TransactionRow } from '../logs/TransactionRow';
import { TransactionEmptyState } from '../logs/TransactionEmptyState';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';

interface TransactionListSectionProps {
  transactions: Transaction[];
  stats: { income: number; expense: number };
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
}

export const TransactionListSection: React.FC<TransactionListSectionProps> = ({
  transactions,
  stats,
  onEdit,
  onDelete,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  const { format, baseCurrency } = useCurrency();
  const { state, getCategoryName, getAccountName } = useFinance();

  return (
    <div className="flex-1 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl sm:rounded-[2.5rem] overflow-hidden flex flex-col min-h-0">
      {/* Fila de Totales */}
      <div className="px-4 sm:px-6 py-3 border-b border-[var(--background-modifier-border)] bg-[var(--background-secondary)]/50 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
          {transactions.length} {t('logs.found')}
        </span>
        <div className="flex gap-4 font-mono font-black text-[10px] sm:text-xs">
          <span className="text-rose-500">↑ {format(stats.expense, baseCurrency)}</span>
          <span className="text-emerald-500">↓ {format(stats.income, baseCurrency)}</span>
        </div>
      </div>

      {/* Área de Scroll Virtualizada */}
      <div className="flex-1 min-h-0 bg-[var(--background-primary)]">
        {transactions.length > 0 ? (
          <VList className="custom-scrollbar">
            {transactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t.id)}
                privacyMode={state.isPrivacyMode}
                getCategoryName={getCategoryName}
                getAccountName={getAccountName}
              />
            ))}
          </VList>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <TransactionEmptyState onClear={onClearFilters} />
          </div>
        )}
      </div>
    </div>
  );
};