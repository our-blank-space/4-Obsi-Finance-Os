import React from 'react';
import { Trade, TradeSide } from '../../types';
import { Button } from '../../components/ui/Button';
import { Lock, Edit2, Trash2, Layers, TrendingUp } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    trades: Trade[];
    onClosePosition: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export const ActiveTradesList: React.FC<Props> = ({ trades, onClosePosition, onEdit, onDelete }) => {
    const { format } = useCurrency();
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 pl-2">
                <Layers size={14} /> {t('trade.open_pos')}
            </h3>

            {trades.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-[var(--background-modifier-border)] rounded-[2rem] text-center text-[var(--text-muted)] bg-[var(--background-secondary)]/20">
                    <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('trade.empty.positions')}</span>
                </div>
            ) : (
                trades.map(trade => (
                    <div key={trade.id} className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl p-6 hover:border-[var(--text-normal)] transition-all group relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${trade.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pl-4">
                            <div className="flex gap-4 items-center">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg ${trade.side === TradeSide.BUY ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                    {trade.side === TradeSide.BUY ? 'L' : 'S'}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-[var(--text-normal)] tracking-tight">{trade.symbol}</h4>
                                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{trade.strategy}</div>
                                </div>
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <DetailItem label={t('trade.form.entry')} value={trade.entryPrice} />
                                <DetailItem label={t('label.actual') || 'Actual'} value={trade.currentPrice || '---'} />
                                <DetailItem label={t('label.value') || 'Value'} value={format(trade.amount * (trade.currentPrice || trade.entryPrice), trade.currency)} />
                                <DetailItem label="PnL" value={`${trade.pnl >= 0 ? '+' : ''}${format(trade.pnl, trade.currency)}`}
                                    className={trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                                    subtext={`${trade.pnlPercentage.toFixed(2)}%`} />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => onClosePosition(trade.id)}><Lock size={14} className="mr-1" /> {t('trade.action.close')}</Button>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(trade.id)}><Edit2 size={14} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(trade.id)} className="text-rose-500"><Trash2 size={14} /></Button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const DetailItem = ({ label, value, className = "", subtext }: any) => (
    <div>
        <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-wider mb-0.5">{label}</div>
        <div className={`font-mono font-bold text-sm ${className}`}>
            {value} {subtext && <span className="text-[10px] opacity-60 ml-1">{subtext}</span>}
        </div>
    </div>
);
