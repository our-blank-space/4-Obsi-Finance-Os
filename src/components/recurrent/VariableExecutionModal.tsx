import React, { useState } from 'react';
import { RecurrentTransaction } from '../../types';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NumericInput } from '../ui/NumericInput';
import { Zap } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    item: RecurrentTransaction | null;
    onClose: () => void;
    onConfirm: (item: RecurrentTransaction, amount: number) => void;
}

export const VariableExecutionModal: React.FC<Props> = ({ item, onClose, onConfirm }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');

    if (!item) return null;

    const handleConfirm = () => {
        const val = parseFloat(amount);
        if (val > 0) onConfirm(item, val);
    };

    return (
        <Modal
            isOpen={!!item}
            onClose={onClose}
            title={t('rec.exec.title', { name: item.name })}
            size="sm"
            icon={<Zap className="text-amber-500" />}
        >
            <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                    {t('rec.exec.desc')}
                </p>
                <NumericInput
                    label={t('rec.exec.amount_label')}
                    value={amount}
                    onValueChange={setAmount}
                    currency={item.currency}
                    autoFocus
                />
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button onClick={handleConfirm} disabled={!amount} intent="create">
                        {t('rec.exec.register')}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
};