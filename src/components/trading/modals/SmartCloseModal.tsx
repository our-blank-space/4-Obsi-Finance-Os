import React, { useState, useMemo } from 'react';
import { Trade } from '../../../types';
import { Modal, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { NumericInput } from '../../ui/NumericInput';
import { useCurrency } from '../../../hooks/useCurrency';
import { TradingEngine } from '../../../logic/trading.engine';
import { Calculator, AlertTriangle, Sliders } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (price: number, fees: number, note: string, amountToClose: number) => void;
    trade: Trade | null;
}

export const SmartCloseModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, trade }) => {
    const { format } = useCurrency();
    const { t } = useTranslation();
    const [exitPrice, setExitPrice] = useState('');
    const [exitFees, setExitFees] = useState('');
    const [note, setNote] = useState('');

    // NUEVO ESTADO: Cantidad a cerrar
    const [closeAmount, setCloseAmount] = useState('');
    const [percentage, setPercentage] = useState(100);

    React.useEffect(() => {
        if (isOpen && trade) {
            setExitPrice(trade.currentPrice?.toString() || '');
            setExitFees(trade.fee.toString());
            setNote('');
            // Por defecto cerramos todo
            setCloseAmount(trade.amount.toString());
            setPercentage(100);
        }
    }, [isOpen, trade]);

    // Handler para el Slider de Porcentaje
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!trade) return;
        const pct = parseFloat(e.target.value);
        setPercentage(pct);
        const amt = trade.amount * (pct / 100);
        // Redondeo seguro a 6 decimales para crypto
        setCloseAmount(parseFloat(amt.toFixed(6)).toString());
    };

    const simulation = useMemo(() => {
        if (!trade || !exitPrice || !closeAmount) return null;

        const price = parseFloat(exitPrice);
        const qty = parseFloat(closeAmount);
        const fees = parseFloat(exitFees) || 0;

        if (isNaN(price) || isNaN(qty) || qty <= 0 || qty > trade.amount) return null;

        // PnL calculado SOLO sobre la porción que cerramos
        const grossPnL = TradingEngine.calculatePnL(
            trade.side, trade.entryPrice, price, qty, 0
        );

        // Fees estimados (Asumimos que el input de fee es por ESTA transacción de cierre)
        const netPnL = grossPnL - fees;

        // Costo base de la porción que cerramos
        const investedPortion = trade.entryPrice * qty;
        const roi = investedPortion > 0 ? (netPnL / investedPortion) * 100 : 0;

        // R-Multiple
        let riskPortion = 0;
        if (trade.stopLoss) {
            riskPortion = Math.abs(trade.entryPrice - trade.stopLoss) * qty;
        }
        const rMultiple = riskPortion > 0 ? (netPnL / riskPortion) : 0;

        return { netPnL, roi, rMultiple, grossPnL, isPartial: qty < trade.amount };
    }, [trade, exitPrice, exitFees, closeAmount]);

    const handleConfirm = () => {
        if (exitPrice && closeAmount) {
            onConfirm(parseFloat(exitPrice), parseFloat(exitFees) || 0, note, parseFloat(closeAmount));
        }
    };

    if (!trade) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('trade.modal.close.title', { symbol: trade.symbol })} size="md">
            <div className="space-y-6">

                {/* 1. SECCIÓN DE CANTIDAD (NUEVA) */}
                <div className="bg-[var(--background-secondary)] p-4 rounded-xl border border-[var(--background-modifier-border)] space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                            <Sliders size={14} /> {t('trade.modal.close.amount')}
                        </span>
                        <span className={`text-xs font-bold ${percentage < 100 ? 'text-[var(--interactive-accent)]' : 'text-[var(--text-normal)]'}`}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>

                    <input
                        type="range"
                        min="1" max="100" step="1"
                        value={percentage}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-[var(--background-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--interactive-accent)]"
                    />

                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <NumericInput
                                label={t('trade.modal.close.units')}
                                value={closeAmount}
                                onValueChange={(v) => {
                                    setCloseAmount(v);
                                    const val = parseFloat(v);
                                    if (trade.amount > 0) setPercentage(Math.min(100, (val / trade.amount) * 100));
                                }}
                            />
                        </div>
                        <div className="text-right pb-2">
                            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{t('label.remaining') || 'Restante'}</div>
                            <div className="font-mono font-bold text-sm">
                                {(trade.amount - (parseFloat(closeAmount) || 0)).toFixed(6)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. PRECIO Y FEES */}
                <div className="grid grid-cols-2 gap-4">
                    <NumericInput label={t('trade.modal.close.exit_price')} value={exitPrice} onValueChange={setExitPrice} currency={trade.currency} autoFocus />
                    <NumericInput label={t('trade.modal.close.exit_fees')} value={exitFees} onValueChange={setExitFees} currency={trade.currency} />
                </div>

                {/* 3. SIMULACIÓN (Actualizada) */}
                {simulation ? (
                    <div className={`p-4 rounded-2xl border-2 transition-all ${simulation.netPnL >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">
                                    {simulation.isPartial ? t('trade.modal.close.pnl_partial') : t('trade.modal.close.pnl_total')}
                                </div>
                                <div className={`text-3xl font-mono font-black tracking-tighter ${simulation.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {simulation.netPnL >= 0 ? '+' : ''}{format(simulation.netPnL, trade.currency)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black opacity-80">{simulation.rMultiple.toFixed(2)}R</div>
                                <div className="text-[10px] font-bold text-[var(--text-muted)]">{t('trade.modal.close.risk_multiple')}</div>
                            </div>
                        </div>
                        {simulation.isPartial && (
                            <div className="mt-3 pt-3 border-t border-[var(--background-modifier-border)]/20 text-xs font-medium opacity-80 flex items-center gap-2">
                                <AlertTriangle size={12} className="text-amber-500" />
                                <span>{t('trade.modal.close.remaining_desc', { amt: (trade.amount - parseFloat(closeAmount)).toFixed(6) })}</span>
                            </div>
                        )}
                        <div className="flex gap-4 mt-2 text-xs font-bold text-[var(--text-muted)]">
                            <span>{t('trade.modal.close.roi')}: {simulation.roi.toFixed(2)}%</span>
                            {/* Mostrar advertencia si el PnL es positivo pero las comisiones se comen la ganancia */}
                            {simulation.grossPnL > 0 && simulation.netPnL < 0 && (
                                <span className="text-amber-500 flex items-center gap-1">
                                    <AlertTriangle size={10} /> {t('trade.modal.close.high_fees')}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-[var(--text-muted)] bg-[var(--background-secondary)] rounded-2xl border border-dashed border-[var(--background-modifier-border)]">
                        <Calculator size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">{t('trade.modal.close.simulate_desc')}</p>
                    </div>
                )}

                <Input label={t('trade.modal.close.note_label')} value={note} onChange={e => setNote(e.target.value)} placeholder={t('trade.modal.close.note_placeholder')} />

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button onClick={handleConfirm} disabled={!simulation} className={simulation && simulation.netPnL < 0 ? 'bg-rose-600' : 'bg-emerald-600'}>
                        {simulation?.isPartial ? t('trade.modal.close.confirm_partial') : t('trade.modal.close.confirm_full')}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
};
