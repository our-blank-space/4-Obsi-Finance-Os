import React, { useState } from 'react';
import { Trade } from '../../../types';
import { Modal, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { NumericInput } from '../../ui/NumericInput';
import { Input } from '../../ui/Input';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (price: number, fees: number, note: string, closeAmount: number) => void;
    trade: Trade | null;
}

export const SmartCloseModal: React.FC<Props> = ({
    isOpen, onClose, onConfirm, trade
}) => {
    const { t } = useTranslation();
    const [price, setPrice] = useState('');
    const [fees, setFees] = useState('0');
    const [note, setNote] = useState('');
    const [closeAmount, setCloseAmount] = useState('');

    // Reset when opening
    React.useEffect(() => {
        if (isOpen && trade) {
            setPrice(trade.currentPrice?.toString() || trade.entryPrice.toString());
            setCloseAmount(trade.amount.toString());
        }
    }, [isOpen, trade]);

    if (!trade) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('trade.modal.close.title')} size="sm">
            <div className="space-y-4">
                <div className="p-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--background-modifier-border)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{trade.symbol}</div>
                    <div className="text-xs font-medium">{trade.amount} @ {trade.entryPrice}</div>
                </div>

                <NumericInput label={t('trade.modal.close.price_label')} value={price} onValueChange={setPrice} autoFocus />
                <NumericInput label={t('trade.modal.close.amount_label')} value={closeAmount} onValueChange={setCloseAmount} />
                <NumericInput label={t('trade.modal.close.fees_label')} value={fees} onValueChange={setFees} />
                <Input label={t('trade.modal.close.note_label')} value={note} onChange={e => setNote(e.target.value)} />

                <ModalFooter>
                    <Button variant="secondary" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button onClick={() => onConfirm(parseFloat(price), parseFloat(fees), note, parseFloat(closeAmount))} variant="success">
                        {t('trade.modal.close.exec')}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
};
