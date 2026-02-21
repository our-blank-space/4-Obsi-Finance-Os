import React, { useMemo } from 'react';
import { Asset } from '../../types/assets';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';
import { AssetEngine } from '../../core/analytics/AssetEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
    assets: Asset[];
}

export const AssetDashboard: React.FC<Props> = ({ assets = [] }) => {
    const { format, baseCurrency, toBase } = useCurrency();
    const { t } = useTranslation();

    const metrics = useMemo(() => {
        let totalAssets = 0;
        let totalLiabilities = 0; // In future, fetch from real debts
        let monthlyCashFlow = 0;

        assets.forEach(asset => {
            if (asset.status !== 'active') return;
            totalAssets += toBase(asset.currentValue || 0, asset.currency);
            // Liability would be calculated here if linked
            // totalLiabilities += toBase(liability, asset.currency);
            monthlyCashFlow += toBase(AssetEngine.calculateMonthlyCashFlow(asset), asset.currency);
        });

        const netWorth = totalAssets - totalLiabilities;

        return { totalAssets, totalLiabilities, netWorth, monthlyCashFlow };
    }, [assets, toBase]);

    const allocationData = useMemo(() => {
        const categories: Record<string, number> = {};
        assets.filter(a => a.status === 'active').forEach(asset => {
            const value = toBase(asset.currentValue || 0, asset.currency);
            categories[asset.category || 'Other'] = (categories[asset.category || 'Other'] || 0) + value;
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [assets, toBase]);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* NET WORTH CARD */}
            <div className="md:col-span-2 bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)] relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Wallet size={20} /></div>
                        <h3 className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-widest">{t('assets.dashboard.net_worth')}</h3>
                    </div>
                    <div className="text-4xl font-black text-[var(--text-normal)] tracking-tight mb-1">
                        {format(metrics.netWorth, baseCurrency)}
                    </div>
                    <div className="flex gap-4 text-xs font-medium text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-500" /> Assets: {format(metrics.totalAssets, baseCurrency)}</span>
                        <span className="flex items-center gap-1"><ArrowDownRight size={12} className="text-rose-500" /> Liabilities: {format(metrics.totalLiabilities, baseCurrency)}</span>
                    </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute right-0 bottom-0 opacity-5">
                    <TrendingUp size={150} />
                </div>
            </div>

            {/* CASH FLOW CARD */}
            <div className="bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)] flex flex-col justify-center">
                <h3 className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-widest mb-2">{t('assets.dashboard.est_cash_flow')}</h3>
                <div className={`text-2xl font-black ${metrics.monthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {metrics.monthlyCashFlow >= 0 ? '+' : ''}{format(metrics.monthlyCashFlow, baseCurrency)} / mo
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 opacity-70">
                    {t('assets.dashboard.cash_flow_desc')}
                </p>
            </div>

            {/* ASSET ALLOCATION */}
            <div className="md:col-span-3 bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)]">
                <h3 className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-widest mb-4">{t('assets.dashboard.allocation')}</h3>
                <div className="h-[200px] w-full flex flex-col md:flex-row items-center gap-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--background-secondary)" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(val: number) => format(val, baseCurrency)}
                                contentStyle={{ backgroundColor: 'var(--background-primary)', borderRadius: '12px', border: 'none', color: 'var(--text-normal)' }}
                                itemStyle={{ color: 'var(--text-normal)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* LEGEND */}
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start w-full md:w-1/3">
                        {allocationData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs font-bold text-[var(--text-normal)]">{entry.name}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                    ({((entry.value / metrics.totalAssets) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
