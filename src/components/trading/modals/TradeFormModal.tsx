import React, { useState, useEffect } from 'react';
import { Trade, TradeSide, TradeStatus, TradeOutcome, TradingAccountType } from '../../../types';
import { Modal, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { NumericInput } from '../../ui/NumericInput';
import { SelectStyled } from '../../ui/SelectStyled';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (trade: Trade) => void;
    initialData?: Trade;
    accountBalance: number;
    activeTab: TradingAccountType;
}

export const TradeFormModal: React.FC<Props> = ({
    isOpen, onClose, onSave, initialData, accountBalance, activeTab
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<Trade>>({
        symbol: '',
        market: '',
        strategy: 'None',
        side: TradeSide.BUY,
        entryPrice: 0,
        amount: 0,
        fee: 0,
        currency: 'USD',
        notes: '',
        accountType: activeTab
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                symbol: '',
                market: '',
                strategy: 'None',
                side: TradeSide.BUY,
                entryPrice: 0,
                amount: 0,
                fee: 0,
                currency: 'USD',
                notes: '',
                accountType: activeTab
            });
        }
    }, [initialData, activeTab]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trade: Trade = {
            id: initialData?.id || crypto.randomUUID(),
            date: initialData?.date || new Date().toISOString().split('T')[0],
            symbol: formData.symbol || '',
            market: formData.market || '',
            strategy: formData.strategy || 'None',
            side: formData.side || TradeSide.BUY,
            status: initialData?.status || TradeStatus.OPEN,
            entryPrice: formData.entryPrice || 0,
            exitPrice: initialData?.exitPrice || null,
            currentPrice: initialData?.currentPrice || formData.entryPrice || 0,
            amount: formData.amount || 0,
            fee: formData.fee || 0,
            currency: formData.currency || 'USD' as any,
            pnl: initialData?.pnl || 0,
            pnlPercentage: initialData?.pnlPercentage || 0,
            outcome: initialData?.outcome || TradeOutcome.OPEN,
            accountType: activeTab,
            notes: formData.notes || '',
            ...formData
        } as Trade;
        onSave(trade);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('trade.edit') : t('trade.new')} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('trade.symbol')} value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} placeholder="BTC/USD" />
                    <Input label={t('trade.market')} value={formData.market} onChange={e => setFormData({ ...formData, market: e.target.value })} placeholder="Binance" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 focus-within:border-[var(--interactive-accent)]">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 block">
                            {t('trade.side')}
                        </label>
                        <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, side: TradeSide.BUY })}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.side === TradeSide.BUY ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--background-primary)]'}`}
                            >
                                {t('trade.side.buy')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, side: TradeSide.SELL })}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.side === TradeSide.SELL ? 'bg-rose-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--background-primary)]'}`}
                            >
                                {t('trade.side.sell')}
                            </button>
                        </div>
                    </div>
                    <Input label={t('trade.strategy')} value={formData.strategy} onChange={e => setFormData({ ...formData, strategy: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <NumericInput label={t('trade.entry_price')} value={formData.entryPrice?.toString() || ''} onValueChange={v => setFormData({ ...formData, entryPrice: parseFloat(v) })} />
                    <NumericInput label={t('trade.amount')} value={formData.amount?.toString() || ''} onValueChange={v => setFormData({ ...formData, amount: parseFloat(v) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <NumericInput label={t('trade.fee')} value={formData.fee?.toString() || ''} onValueChange={v => setFormData({ ...formData, fee: parseFloat(v) })} />
                    <NumericInput label={t('trade.stop_loss')} value={formData.stopLoss?.toString() || ''} onValueChange={v => setFormData({ ...formData, stopLoss: parseFloat(v) })} />
                </div>
                <Input label={t('label.note')} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button type="submit" intent="save">{t('btn.save')}</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};
