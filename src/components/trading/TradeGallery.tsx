import React from 'react';
import { Trade } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Edit2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    trades: Trade[];
    onEdit?: (id: string) => void;
}

export const TradeGallery: React.FC<Props> = ({ trades, onEdit }) => {
    const { format } = useCurrency();
    const { t } = useTranslation();

    // Filter only trades that have images or meaningful data to show in gallery
    const galleryItems = trades.filter(t => t.chartLink);

    if (galleryItems.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed border-[var(--background-modifier-border)] rounded-3xl">
                <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest">
                    {t('trade.empty.gallery')}
                </p>
                <p className="text-[var(--text-faint)] text-xs mt-2">
                    {t('trade.empty.gallery_desc')}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryItems.map(trade => (
                <div key={trade.id} className="group relative bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">

                    {/* Image / Chart Placeholder */}
                    <div className="aspect-video bg-[var(--background-secondary)] relative overflow-hidden">
                        {trade.chartLink ? (
                            <img
                                src={trade.chartLink}
                                alt={`${trade.symbol} chart`}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1a1a1a/666?text=No+Preview';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)]">
                                <TrendingUp size={32} />
                            </div>
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-primary)] via-transparent to-transparent opacity-80" />

                        {/* Outcome Badge (Top Right) */}
                        <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${trade.outcome === 'win' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                trade.outcome === 'loss' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                    'bg-[var(--background-modifier-form-field)] text-[var(--text-muted)] border border-[var(--background-modifier-border)]'
                                }`}>
                                {trade.outcome}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 relative">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-black text-lg tracking-tight text-[var(--text-normal)] leading-none">
                                    {trade.symbol}
                                </h4>
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    {trade.strategy}
                                </span>
                            </div>
                            <div className={`text-right ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <div className="font-mono font-black text-sm">
                                    {trade.pnl >= 0 ? '+' : ''}{format(trade.pnl, trade.currency)}
                                </div>
                                {trade.rMultiple !== undefined && (
                                    <div className="text-[10px] font-bold opacity-80">
                                        {trade.rMultiple.toFixed(1)}R
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="pt-3 border-t border-[var(--background-modifier-border)] mt-3 flex justify-between items-center">
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {trade.exitDate || trade.date}
                            </span>

                            <div className="flex items-center gap-2">
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(trade.id)}
                                        className="text-[var(--text-muted)] hover:text-[var(--interactive-accent)] transition-colors p-1"
                                        title={t('trade.action.edit')}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                {trade.chartLink && (
                                    <a
                                        href={trade.chartLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--text-muted)] hover:text-[var(--interactive-accent)] transition-colors p-1"
                                        title={t('trade.action.open_chart')}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
