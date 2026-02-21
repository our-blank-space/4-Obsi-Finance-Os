import React from 'react';
import { VList } from 'virtua';
import { Trade } from '../../types';
import { Image, Trash2, Edit2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    trades: Trade[];
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
}

export const TradeHistoryTable: React.FC<Props> = ({ trades, onDelete, onEdit }) => {
    const { format } = useCurrency();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-[600px] bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2rem] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-7 bg-[var(--background-primary)] text-[9px] uppercase font-black text-[var(--text-muted)] border-b border-[var(--background-modifier-border)] py-4 px-2 shrink-0">
                <div className="px-2">{t('trade.col.date')}</div>
                <div className="px-2">{t('trade.col.symbol')}</div>
                <div className="px-2 text-right">R</div>
                <div className="px-2 text-right">{t('trade.col.pnl')}</div>
                <div className="px-2 text-center">{t('trade.col.chart')}</div>
                <div className="px-2 text-right">{t('trade.col.result')}</div>
                <div className="px-2 text-right">{t('trade.col.actions')}</div>
            </div>

            {/* Virtualized Body */}
            <div className="flex-1 min-h-0 bg-[var(--background-secondary)]">
                <VList className="custom-scrollbar">
                    {trades.map(trade => (
                        <div key={trade.id} className="grid grid-cols-7 items-center border-b border-[var(--background-modifier-border)] hover:bg-[var(--background-modifier-hover)] transition-colors group py-3 px-2">
                            <div className="px-2 text-xs font-mono font-bold text-[var(--text-muted)]">{trade.exitDate || trade.date}</div>
                            <div className="px-2 font-black text-[var(--text-normal)]">
                                {trade.symbol}
                                <span className="block text-[9px] text-[var(--text-muted)] font-normal mt-0.5">{trade.strategy}</span>
                            </div>
                            <div className={`px-2 text-right font-mono font-bold text-xs ${trade.rMultiple && trade.rMultiple > 0 ? 'text-emerald-500' : trade.rMultiple && trade.rMultiple < 0 ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
                                {trade.rMultiple ? `${trade.rMultiple.toFixed(1)}R` : '-'}
                            </div>
                            <div className={`px-2 text-right font-mono font-black ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trade.pnl >= 0 ? '+' : ''}{format(trade.pnl, trade.currency)}
                            </div>
                            <div className="px-2 text-center flex justify-center">
                                {trade.chartLink ? (
                                    <a href={trade.chartLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--background-modifier-form-field)] hover:bg-[var(--interactive-accent)] hover:text-white transition-colors text-[var(--text-muted)]">
                                        <Image size={14} />
                                    </a>
                                ) : (
                                    <span className="opacity-20">-</span>
                                )}
                            </div>
                            <div className="px-2 text-right">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${trade.outcome === 'win' ? 'bg-emerald-500/10 text-emerald-500' : trade.outcome === 'loss' ? 'bg-rose-500/10 text-rose-500' : 'text-[var(--text-muted)] bg-[var(--background-modifier-form-field)]'}`}>
                                    {trade.outcome}
                                </span>
                            </div>
                            <div className="px-2 text-right flex justify-end gap-1">
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(trade.id)}
                                        className="p-2 rounded-lg hover:bg-[var(--interactive-accent)] hover:text-white text-[var(--text-muted)] transition-colors"
                                        title={t('trade.action.edit')}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => onDelete(trade.id)}
                                    className="p-2 rounded-lg hover:bg-[var(--background-modifier-error)] hover:text-white text-[var(--text-muted)] transition-colors"
                                    title={t('trade.delete.title')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </VList>
            </div >
        </div >
    );
};
