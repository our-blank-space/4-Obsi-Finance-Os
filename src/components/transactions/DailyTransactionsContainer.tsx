import React, { useMemo } from 'react';
import { Transaction, FinanceAccount, FinanceCategory } from '../../types';
import { TransactionListView } from './TransactionListView';
import { QuickTransactionOverlay } from './QuickTransactionOverlay';
import { useTransactionAnalytics } from '../../hooks/ui/useTransactionAnalytics';
import { useTransactionsController } from '../../application/useTransactionsController';

interface DailyTransactionsProps {
  accounts: FinanceAccount[];
  areas: FinanceCategory[];
  className?: string;
  externalOpenModal?: 'none' | 'expense' | 'income' | 'transfer';
  onCloseExternal?: () => void;
  isOverlayMode?: boolean;
}

export const DailyTransactionsContainer: React.FC<DailyTransactionsProps> = ({
  isOverlayMode = false,
  externalOpenModal = 'none',
  onCloseExternal,
  accounts,
  areas,
  className,
}) => {
  // Conectamos con el controlador de la aplicación
  const { transactions, add, update, remove } = useTransactionsController();

  // Inicializamos la analítica aquí para pasar los datos ya procesados
  const analytics = useTransactionAnalytics(transactions);

  const handleSaveOverlay = async (data: Transaction) => {
    await add(data);
  };

  // Decidimos si mostramos solo el modal (overlay) o la app completa
  const shouldRenderOverlay = useMemo(() => {
    return isOverlayMode && externalOpenModal !== 'none';
  }, [isOverlayMode, externalOpenModal]);

  if (shouldRenderOverlay) {
    return (
      <QuickTransactionOverlay
        transactionType={externalOpenModal as 'expense' | 'income' | 'transfer'}
        accounts={accounts}
        areas={areas}
        onClose={onCloseExternal || (() => { })}
        onSave={handleSaveOverlay}
      />
    );
  }

  return (
    <TransactionListView
      analytics={analytics}
      accounts={accounts}
      areas={areas}
      className={className}
      onAddTransaction={add}
      onUpdateTransaction={update}
      onDeleteTransaction={remove}
    />
  );
};