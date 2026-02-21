import React, { memo } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, YAxis } from 'recharts';
import { TrendingUp, Target, Banknote, RefreshCw } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';

interface DashboardProps {
    equity: any[];
    allocation: any[];
    strategies: any[];
    stats: {
        balance: number;
        realizedPnL: number;
        winRate: number;
        profitFactor: number;
        openRisk?: number; // Nueva prop
    };
    onSync: () => void;
    isSyncing: boolean;
    onTransfer: () => void;
    onNewTrade: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const TradingDashboard: React.FC<DashboardProps> = memo(({
    equity, allocation, strategies, stats, onSync, isSyncing, onTransfer, onNewTrade
}) => {
    const { format } = useCurrency();
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* HERO: Equity Curve */}
            <div className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] rounded-[2.5rem] p-6 sm:p-8 h-64 sm:h-72 relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div>
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={14} /> {t('trade.stats.equity')}
                        </h3>
                        <div className="text-3xl font-mono font-black text-[var(--text-normal)] mt-1 tracking-tight">
                            {format(stats.balance, 'USD')}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onSync} disabled={isSyncing} className="p-2 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:text-[var(--interactive-accent)] transition-colors disabled:opacity-50" title={t('trade.sync')}>
                            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onNewTrade} className="px-4 py-2 bg-[var(--interactive-accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-[var(--interactive-accent)]/20">
                            + {t('trade.new_pos')}
                        </button>
                    </div>
                </div>

                <div className="absolute inset-0 pt-20 px-2 pb-2">
                    <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                        <AreaChart data={equity}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--interactive-accent)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--interactive-accent)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--background-modifier-border)', fontSize: '12px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#a3a3a3' }} formatter={(val: number) => [format(val, 'USD'), t('trade.stats.equity')]} labelStyle={{ color: '#888888', marginBottom: '4px' }} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="balance" stroke="var(--interactive-accent)" strokeWidth={3} fill="url(#colorBalance)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title={t('trade.stats.pnl_real')} value={format(stats.realizedPnL, 'USD')}
                            color={stats.realizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'} icon={<Banknote size={16} />} />
                        <StatCard title={t('trade.stats.risk')} value={format(stats.openRisk || 0, 'USD')} valueSize="text-sm"
                            color="text-[var(--text-muted)]" icon={<Target size={14} />} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title={t('trade.stats.winrate')} value={`${stats.winRate.toFixed(1)}%`} color="text-amber-500" icon={<Target size={14} />} />
                        <StatCard title={t('trade.stats.profit_factor')} value={stats.profitFactor?.toFixed(2) || '---'} color="text-sky-500" icon={<TrendingUp size={14} />} />
                    </div>
                    <button onClick={onTransfer} className="w-full py-3 border border-dashed border-[var(--background-modifier-border)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-[var(--interactive-accent)] hover:text-[var(--interactive-accent)] transition-all">
                        {t('trade.modal.transfer.title')}
                    </button>
                </div>

                <div className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] rounded-3xl p-5 flex flex-col">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">{t('trade.stats.exposure')}</h3>
                    <div className="flex-1 min-h-[150px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                            <PieChart width={300} height={300}>
                                <Pie data={allocation} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                                    {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => format(v, 'USD')} contentStyle={{ backgroundColor: 'var(--background-primary)', borderRadius: '8px', border: 'none', fontSize: '10px', color: '#a3a3a3' }} itemStyle={{ color: '#a3a3a3' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#888888' }} layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] rounded-3xl p-5 flex flex-col">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">{t('trade.stats.pnl_strategy')}</h3>
                    <div className="flex-1 min-h-[150px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                            <BarChart width={300} height={300} data={strategies} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="strategy" type="category" width={70} tick={{ fontSize: 9, fontWeight: 700, fill: '#888888' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'var(--background-modifier-hover)' }} contentStyle={{ backgroundColor: 'var(--background-primary)', borderRadius: '8px', border: 'none', fontSize: '10px', color: '#a3a3a3' }} itemStyle={{ color: '#a3a3a3' }} formatter={(v: number) => format(v, 'USD')} />
                                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={12}>
                                    {strategies.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#f43f5e'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
});

const StatCard = ({ title, value, color, icon }: any) => (
    <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] p-4 rounded-2xl flex justify-between items-center shadow-sm">
        <div>
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">{title}</span>
            <span className={`text-lg font-mono font-black ${color}`}>{value}</span>
        </div>
        <div className="text-[var(--text-muted)] opacity-20">{icon}</div>
    </div>
);
