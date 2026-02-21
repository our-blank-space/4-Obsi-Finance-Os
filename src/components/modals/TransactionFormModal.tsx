import React from 'react';
import { Modal } from '../ui/Modal';
import { TransactionForm } from '../logs/TransactionForm';
import { Transaction, FinanceAccount, FinanceCategory } from '../../types';

import { useTranslation } from '../../hooks/useTranslation';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  accounts: FinanceAccount[];
  areas: FinanceCategory[];
  onSave: (data: any) => Promise<void> | void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  transaction,
  accounts,
  areas,
  onSave,
}) => {
  const { t } = useTranslation();
  const handleSave = async (data: any) => {
    await onSave(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? t('logs.form.edit') : t('logs.form.new')}
      // En escritorio usamos tamaño 'md', en móvil se adapta solo
      size="md"
    >
      <TransactionForm
        initialData={transaction}
        accounts={accounts}
        areas={areas}
        onSave={handleSave}
        onCancel={onClose}
      />
    </Modal>
  );
};