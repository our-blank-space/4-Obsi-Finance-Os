import React, { useState, useEffect } from 'react';
import { Trade, TradeSide, Currency, TradeStatus, TradeOutcome, TradingAccountType } from '../../../types';
import { Modal, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { NumericInput } from '../../ui/NumericInput';
import { useRiskCalculator } from '../../../hooks/useRiskCalculator';
import { TradingEngine } from '../../../logic/trading.engine';
import { Calculator, Target, ShieldAlert, Image } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (trade: Trade) => void;
    initialData?: Trade | null;
    accountBalance: number;
    activeTab: TradingAccountType;
}

const INITIAL_STATE = {
    symbol: '', market: 'Crypto', strategy: 'Trend', side: TradeSide.BUY,
    entryPrice: '', amount: '', stopLoss: '', takeProfit: '', fee: '0', notes: '',
    currency: 'USD' as Currency, chartLink: ''
};

export const TradeFormModal: React.FC<Props> = ({
    isOpen, onClose, onSave, initialData, accountBalance, activeTab
}) => {
    const { format } = useCurrency();
    const { t } = useTranslation();
    const [form, setForm] = useState(INITIAL_STATE);
    const [riskPercent, setRiskPercent] = useState('1');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({
                    ...initialData,
                    entryPrice: initialData.entryPrice.toString(),
                    amount: initialData.amount.toString(),
                    stopLoss: initialData.stopLoss?.toString() || '',
                    takeProfit: initialData.takeProfit?.toString() || '',
                    fee: initialData.fee.toString(),
                    notes: initialData.notes || '',
                    chartLink: initialData.chartLink || '',
                    currency: initialData.currency || 'USD' as Currency
                });
            } else {
                setForm({ ...INITIAL_STATE, currency: 'USD' });
            }
        }
    }, [isOpen, initialData]);

    const riskMetrics = useRiskCalculator({
        entryPrice: form.entryPrice,
        amount: form.amount,
        stopLoss: form.stopLoss,
        takeProfit: form.takeProfit,
        side: form.side
    });

    const handleAutoResize = () => {
        const size = TradingEngine.calculatePositionSize(
            accountBalance,
            parseFloat(form.entryPrice),
            parseFloat(form.stopLoss),
            parseFloat(riskPercent)
        );
        if (size && isFinite(size)) setForm(prev => ({ ...prev, amount: size.toFixed(6) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Trade = {
            id: initialData?.id || crypto.randomUUID(),
            date: initialData?.date || new Date().toISOString().split('T')[0],
            ...form,
            symbol: form.symbol.toUpperCase(),
            entryPrice: parseFloat(form.entryPrice),
            amount: parseFloat(form.amount),
            stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
            takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
            fee: parseFloat(form.fee) || 0,
            status: initialData?.status || TradeStatus.OPEN,
            outcome: initialData?.outcome || TradeOutcome.OPEN,
            pnl: initialData?.pnl || -parseFloat(form.fee || '0'),
            pnlPercentage: initialData?.pnlPercentage || 0,
            accountType: activeTab,
            exitPrice: initialData?.exitPrice || null,
            currentPrice: initialData?.currentPrice || null,
            chartLink: form.chartLink || undefined
        };
        onSave(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('trade.modal.trade.edit') : t('trade.modal.trade.new')} size="lg" icon={<Target size={24} />}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                        <Input label={t('trade.col.symbol')} value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} placeholder="BTC" autoFocus />
                    </div>
                    <div className="col-span-8 flex gap-2 items-end">
                        <div className="flex-1 bg-[var(--background-modifier-form-field)] p-1 rounded-xl border border-[var(--background-modifier-border)] flex gap-1">
                            <button type="button" onClick={() => setForm({ ...form, side: TradeSide.BUY })}
                                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${form.side === TradeSide.BUY ? '!bg-emerald-600 !text-white shadow-md' : 'bg-emerald-600/10 text-[var(--text-muted)] hover:bg-emerald-600/20'}`}>
                                {t('trade.modal.trade.buy')}
                            </button>
                            <button type="button" onClick={() => setForm({ ...form, side: TradeSide.SELL })}
                                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${form.side === TradeSide.SELL ? '!bg-rose-600 !text-white shadow-md' : 'bg-rose-600/10 text-[var(--text-muted)] hover:bg-rose-600/20'}`}>
                                {t('trade.modal.trade.sell')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <NumericInput label={t('trade.form.entry')} value={form.entryPrice} onValueChange={v => setForm({ ...form, entryPrice: v })} currency={form.currency} />
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <NumericInput label={t('trade.form.size')} value={form.amount} onValueChange={v => setForm({ ...form, amount: v })} />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAutoResize} title={t('trade.modal.trade.calc_size') || "Calcular tamaño"} disabled={!form.entryPrice || !form.stopLoss}>
                            <Calculator size={16} />
                        </Button>
                    </div>
                </div>

                <div className="bg-[var(--background-secondary)]/50 p-5 rounded-2xl border border-[var(--background-modifier-border)] space-y-4 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                        <div className="text-[10px] font-black uppercase text-[var(--interactive-accent)] flex items-center gap-2">
                            <ShieldAlert size={12} /> {t('trade.modal.trade.risk_mgt')}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">{t('trade.modal.trade.risk_max')}</span>
                            <input type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="w-12 bg-transparent border-b border-[var(--background-modifier-border)] text-center text-xs font-black outline-none focus:border-[var(--interactive-accent)]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <NumericInput label={t('trade.form.sl')} value={form.stopLoss} onValueChange={v => setForm({ ...form, stopLoss: v })} currency={form.currency} className={riskMetrics?.invalidSL ? 'border-rose-500' : ''} />
                        <NumericInput label={t('trade.form.tp')} value={form.takeProfit} onValueChange={v => setForm({ ...form, takeProfit: v })} currency={form.currency} className={riskMetrics?.invalidTP ? 'border-rose-500' : ''} />
                    </div>

                    {riskMetrics && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                            <RiskCard label={t('trade.modal.trade.risk_cash')} value={riskMetrics.risk !== null ? `-${format(riskMetrics.risk, form.currency)}` : '---'} color="text-rose-500" />
                            <RiskCard label={t('trade.modal.trade.reward_cash')} value={riskMetrics.reward !== null ? `+${format(riskMetrics.reward, form.currency)}` : '---'} color="text-emerald-500" />
                            <RiskCard label={t('trade.modal.trade.ratio')} value={`1 : ${riskMetrics.ratio}`} color={parseFloat(riskMetrics.ratio) >= 2 ? 'text-emerald-500' : 'text-amber-500'} />
                            <RiskCard label="INVERSIÓN" value={`${format(riskMetrics.exposure, form.currency)}`} color="text-sky-500" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('trade.modal.trade.strategy')} value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} placeholder={t('trade.modal.trade.strategy_placeholder')} />
                    <NumericInput label={t('trade.form.fees')} value={form.fee} onValueChange={v => setForm({ ...form, fee: v })} currency={form.currency} />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label={t('trade.modal.trade.chart_link')}
                        value={form.chartLink || ''}
                        onChange={e => setForm({ ...form, chartLink: e.target.value })}
                        placeholder={t('trade.modal.trade.chart_placeholder')}
                        icon={<Image size={14} />}
                    />
                </div>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button type="submit" disabled={!form.symbol || !form.entryPrice || !form.amount}>{t('trade.modal.trade.save')}</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

const RiskCard = ({ label, value, color }: any) => (
    <div className="bg-[var(--background-primary)] p-2 rounded-xl border border-[var(--background-modifier-border)] text-center">
        <div className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-0.5">{label}</div>
        <div className={`font-mono text-xs font-black ${color}`}>{value}</div>
    </div>
);
