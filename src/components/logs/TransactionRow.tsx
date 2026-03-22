import React, { memo } from 'react';
import { ArrowUpRight, ArrowDownRight, Trash2, Zap } from 'lucide-react';
import { Transaction } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { RichText } from '../ui/RichText';

import { useTranslation } from '../../hooks/useTranslation';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  privacyMode?: boolean;
  getCategoryName: (id: string | undefined) => string;
  getAccountName: (id: string | undefined) => string;
}

/**
 * Custom comparison function for React.memo
 */
const arePropsEqual = (
  prevProps: TransactionRowProps,
  nextProps: TransactionRowProps
): boolean => {
  const prev = prevProps.transaction;
  const next = nextProps.transaction;

  return (
    prev.id === next.id &&
    prev.amount === next.amount &&
    prev.date === next.date &&
    prev.type === next.type &&
    prev.note === next.note &&
    prev.areaId === next.areaId && // Check ID changes
    prev.fromId === next.fromId &&
    prev.toId === next.toId &&     // Check toId changes
    prev.area === next.area &&     // Fallback check
    prev.from === next.from &&
    prev.currency === next.currency &&
    prevProps.privacyMode === nextProps.privacyMode
    // We assume getCategoryName/getAccountName don't change identity often or it's fine
  );
};

const TransactionRowComponent: React.FC<TransactionRowProps> = ({
  transaction, onEdit, onDelete, getCategoryName, getAccountName
}) => {
  const { format } = useCurrency();
  const { t } = useTranslation();
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--background-modifier-border)]/40 hover:bg-[var(--background-secondary)]/40 transition-all cursor-pointer group active:scale-[0.99] select-none"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl flex items-center justify-center shrink-0 border ${isTransfer
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
          : isIncome
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}>
          {isTransfer ? <Zap size={16} /> : isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        </div>
        <div className="truncate min-w-0">
          <div className="text-sm sm:text-base font-bold text-[var(--text-normal)] truncate">
            <RichText text={transaction.note || t('logs.no_desc')} />
          </div>
          <div className="text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter flex gap-2">
            <span className="bg-[var(--background-secondary)] px-1 rounded">{transaction.date}</span>
            <span className="truncate max-w-[50px] sm:max-w-none text-amber-500">
              {isTransfer
                ? `${getAccountName(transaction.fromId)} ➔ ${getAccountName(transaction.toId)}`
                : getCategoryName(transaction.areaId || transaction.area)}
            </span>
            {!isTransfer && (
              <>
                <span className="opacity-40 hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  {getAccountName(transaction.fromId || transaction.from)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-3 sm:gap-4 shrink-0">
        <div className={`text-sm sm:text-base font-mono font-black ${isTransfer ? 'text-amber-500' : isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isIncome ? '+' : ''}{format(transaction.amount, transaction.currency)}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!transaction.id) {
              console.error("TransactionRow: MISSING ID!", transaction);
              return;
            }
            onDelete();
          }}

          className="p-1 sm:p-2 text-[var(--text-muted)] hover:text-rose-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all active:scale-90"
          aria-label={t('btn.delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Exportar con React.memo para prevenir re-renders innecesarios
export const TransactionRow = memo(TransactionRowComponent, arePropsEqual);