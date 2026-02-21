import React, { useMemo } from 'react';
import { Asset } from '../../types/assets';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';
import { AssetEngine } from '../../core/analytics/AssetEngine';
import { Building2, TrendingUp, Wallet, ArrowRight, Car, Smartphone, Home, Briefcase, GraduationCap, Gem } from 'lucide-react';

interface Props {
    asset: Asset;
    onClick: () => void;
}

export const AssetCard: React.FC<Props> = ({ asset, onClick }) => {
    const { format } = useCurrency();
    const { t } = useTranslation();

    const metrics = useMemo(() => ({
        netValue: AssetEngine.calculateNetValue(asset),
        cashFlow: AssetEngine.calculateMonthlyCashFlow(asset),
        roi: AssetEngine.calculateROI(asset)
    }), [asset]);

    const getIcon = () => {
        const cat = asset.category?.toLowerCase() || '';
        if (cat.includes('real estate')) return <Home size={24} />;
        if (cat.includes('vehicle')) return <Car size={24} />;
        if (cat.includes('tech')) return <Smartphone size={24} />;
        if (cat.includes('financial')) return <Wallet size={24} />;
        if (cat.includes('business')) return <Briefcase size={24} />;
        return <Gem size={24} />;
    };

    return (
        <div
            onClick={onClick}
            className="group bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-3xl p-6 cursor-pointer hover:border-[var(--interactive-accent)] transition-all hover:shadow-lg relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--background-primary)] rounded-2xl text-[var(--interactive-accent)] border border-[var(--background-modifier-border)]">
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-normal)] leading-tight">{asset.name}</h3>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mt-0.5">{t(`assets.cat.${asset.category?.toLowerCase().replace(' ', '_')}`) || asset.category}</div>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black border ${metrics.roi >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                    {t('asset.roi')} {metrics.roi.toFixed(1)}%
                </div>
            </div>

            <div className="space-y-1 relative z-10">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{t('assets.detail.current_value')}</div>
                <div className="text-2xl font-black text-[var(--text-normal)] tracking-tight">
                    {format(asset.currentValue || 0, asset.currency)}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--background-modifier-border)] flex justify-between items-center relative z-10">
                <div className="text-xs font-medium text-[var(--text-muted)]">
                    <span className={metrics.cashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {metrics.cashFlow > 0 ? '+' : ''}{format(metrics.cashFlow, asset.currency)}/mo
                    </span>
                </div>
                <div className="p-2 rounded-full bg-[var(--background-primary)] text-[var(--text-muted)] group-hover:bg-[var(--interactive-accent)] group-hover:text-white transition-colors">
                    <ArrowRight size={14} />
                </div>
            </div>

            {/* DECORATION */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150">
                {getIcon()}
            </div>
        </div>
    );
};
