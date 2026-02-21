import React, { useState, useMemo } from 'react';
import { ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from '../ui/Modal';
import { NumericInput } from '../ui/NumericInput';
import { Button } from '../ui/Button';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';
import { useFinance } from '../../context/FinanceContext';

interface QuickTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transfer: any) => void;
  source: string;
  target: string;
  sourceBalance?: number; // Balance disponible en la cuenta origen
}

export const QuickTransferModal: React.FC<QuickTransferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  source,
  target,
  sourceBalance = 0
}) => {
  const [amount, setAmount] = useState('');
  const { baseCurrency, format } = useCurrency();
  const { getAccountName } = useFinance();
  const { t } = useTranslation();

  // Resolución de nombres
  const sourceName = useMemo(() => getAccountName(source), [source, getAccountName]);
  const targetName = useMemo(() => getAccountName(target), [target, getAccountName]);

  // Validación de transferencia
  const validation = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;

    if (source === target) {
      return { valid: false, error: t('bal.modal.same_account') };
    }

    if (numAmount <= 0) {
      return { valid: false, error: t('bal.modal.amount_positive') };
    }

    if (numAmount > sourceBalance) {
      return {
        valid: false,
        error: t('bal.modal.insufficient_funds', { amount: format(sourceBalance, baseCurrency) })
      };
    }

    return { valid: true, error: null };
  }, [amount, source, target, sourceBalance, format, baseCurrency]);

  const handleConfirm = () => {
    if (!validation.valid) return;

    const numAmount = parseFloat(amount);

    onConfirm({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type: 'transfer',
      amount: numAmount,
      from: source,
      to: target,
      currency: baseCurrency,
      note: '⚡ Transferencia Rápida',
      area: 'Transferencia'
    });

    // Reset form
    setAmount('');
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('bal.modal.title')} icon={<Zap className="text-amber-500" />} size="sm">
      <div className="space-y-6">
        {/* Origen y Destino */}
        <div className="flex items-center justify-between p-4 bg-[var(--background-secondary)] rounded-2xl border border-[var(--background-modifier-border)]">
          <div className="text-center flex-1">
            <span className="font-bold text-sm block truncate px-2">{sourceName}</span>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              {t('bal.modal.available', { amount: format(sourceBalance, baseCurrency) })}
            </div>
          </div>

          <div className="px-4">
            <ArrowRight size={16} className="text-[var(--text-muted)]" />
          </div>

          <div className="text-center flex-1 text-right">
            <span className="font-bold text-sm block truncate px-2">{targetName}</span>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 opacity-0">.</div>
          </div>
        </div>

        {/* Input de monto */}
        <NumericInput
          label={t('bal.modal.amount_label')}
          value={amount}
          onValueChange={setAmount}
          currency={baseCurrency}
          autoFocus
        />

        {/* Mensaje de error */}
        {amount && !validation.valid && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            <AlertTriangle size={14} />
            {validation.error}
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose}>{t('btn.cancel')}</Button>
          <Button
            onClick={handleConfirm}
            disabled={!amount || !validation.valid}
            className="bg-amber-500 text-white disabled:opacity-50"
          >
            {t('bal.modal.transfer_now')}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};