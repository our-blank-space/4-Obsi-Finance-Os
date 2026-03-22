import React, { useMemo } from 'react';
import { Transaction, FinanceAccount, FinanceCategory } from '../../types';
import { Modal } from '../ui/Modal';
import { TransactionForm } from './TransactionForm';

interface QuickTransactionOverlayProps {
  transactionType: 'expense' | 'income' | 'transfer';
  accounts: FinanceAccount[];
  areas: FinanceCategory[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const QuickTransactionOverlay: React.FC<QuickTransactionOverlayProps> = ({
  transactionType,
  accounts,
  areas,
  onClose,
  onSave,
}) => {
  const modalTitle = useMemo(() => {
    const titles = {
      expense: 'Nuevo Gasto Rápido',
      income: 'Nuevo Ingreso Rápido',
      transfer: 'Movimiento Rápido',
    };
    return titles[transactionType] || 'Nuevo Movimiento';
  }, [transactionType]);

  return (
    // size="sm" para que sea compacto y rápido
    <Modal isOpen={true} onClose={onClose} title={modalTitle} size="sm">
      <TransactionForm
        initialType={transactionType}
        accounts={accounts}
        areas={areas}
        onSave={async (data: any) => {
          await onSave(data);
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};