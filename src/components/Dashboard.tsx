// src/components/Dashboard.tsx
import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, Activity, Hourglass, List,
    ArrowUpRight, ArrowDownRight, BarChart2, PieChart as PieIcon,
    Layers, Plane, Sparkles, Bot
} from 'lucide-react';

import { TransactionType } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { useFinance } from '../context/FinanceContext';
import { useBalances } from '../hooks/useBalances';
import { Analytics } from '../utils/analytics';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

// --- CONSTANTES DE DISEÑO ---
const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const TOOLTIP_STYLE = {
    backgroundColor: 'var(--background-primary)',
    borderColor: 'var(--background-modifier-border)',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    color: 'var(--text-normal)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
};

export const Dashboard: React.FC = () => {
    // ... Context hooks (unchanged)
    const { state } = useFinance();
    const { transactions, snapshots, features, projectionParams, baseCurrency, summaries } = state;
    const { toBase, format, formatCompact } = useCurrency();
    const { t } = useTranslation();
    const { liquidTotal } = useBalances();

    // Hook Custom para métricas complejas (Desacople vista/logica)
    const {
        fullHistory,
        metrics,
        runway,
        cashFlowData,
        categoryData,
        monteCarloData,
        currentCashFlow,
        recentTimeline
    } = useDashboardMetrics(
        {
            transactions,
            snapshots,
            features,
            projectionParams,
            baseCurrency,
            summaries,
            categoryRegistry: state.categoryRegistry
        } as any,
        toBase,
        liquidTotal
    );

    // --- AI EVALUATOR (Logic unchanged) ---
    const [isEvaluating, setIsEvaluating] = React.useState(false);
    const [aiResult, setAiResult] = React.useState<{ score: number, advice: string } | null>(null);
    const evaluateFinance = async () => {
        if (!state.settings.geminiApiKey) {
            alert(t('common.no_api_key'));
            return;
        }
        setIsEvaluating(true);
        try {
            const { GoogleGenAI, Type } = await import("@google/genai");
            const genAI = new GoogleGenAI({ apiKey: state.settings.geminiApiKey });
            const prompt = `
                Act as a heavy financial advisor. Evaluate this monthly financial snapshot:
                - Net Worth: ${formatCompact(metrics.current, baseCurrency)}
                - Monthly CashFlow: ${formatCompact(currentCashFlow, baseCurrency)}
                - Runway: ${runway.months.toFixed(1)} months
                - Years of History: ${metrics.years.toFixed(1)}
                Return a JSON with: score (0-100), advice (max 20 words, spanish, direct).
            `;
            const response = await genAI.models.generateContent({
                model: "gemini-2.0-flash", contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, advice: { type: Type.STRING } } } }
            });
            const text = response.text;
            if (text) setAiResult(JSON.parse(text));
        } catch (e) {
            console.error("AI Error", e);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-8 pb-10 animate-in fade-in duration-500 max-w-6xl mx-auto overflow-hidden">

            {/* HEADER KPIS */}
            <header className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                <KpiCard title={t('dash.net_worth')} value={formatCompact(metrics.current, baseCurrency)} icon={<Activity size={14} />} />
                <KpiCard title={t('dash.cashflow')} value={formatCompact(currentCashFlow, baseCurrency)} icon={currentCashFlow >= 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />} subtext={t('dash.current_month')}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashFlowData}>
                            <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#colorIncome)" fillOpacity={0.1} />
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </KpiCard>

                <div className={`p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-sm transition-all ${runway.months < 3 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--background-secondary)]/30 border-[var(--background-modifier-border)]'}`}>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                        <Plane size={12} className={runway.months < 3 ? 'text-rose-500' : 'text-emerald-500'} /> {t('dash.runway')}
                    </div>
                    <div className="mt-2">
                        <div className="text-lg sm:text-xl font-mono font-black text-[var(--text-normal)]">
                            {runway.months > 60 ? '> 5 Años' : `${runway.months.toFixed(1)}m`}
                        </div>
                    </div>
                </div>

                <KpiCard title={t('dash.cagr')} value={`${metrics.cagr.toFixed(1)}%`} icon={<TrendingUp size={14} />} />

                {features.ai && (
                    <div className={`p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-sm transition-all relative overflow-hidden group ${aiResult ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[var(--background-secondary)]/30 border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)]/50'}`} onClick={evaluateFinance}>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                                <Bot size={12} className={isEvaluating ? 'animate-spin text-[var(--interactive-accent)]' : aiResult ? 'text-indigo-400' : ''} /> {t('ai.evaluator_btn')}
                            </div>
                            <div className="mt-2">
                                {isEvaluating ? (
                                    <div className="text-xs font-mono text-[var(--text-muted)] animate-pulse">{t('ai.evaluator_btn_busy')}</div>
                                ) : aiResult ? (
                                    <div>
                                        <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400">{aiResult.score}/100</div>
                                        <div className="text-[10px] font-bold leading-tight mt-1 opacity-80">{aiResult.advice}</div>
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] transition-colors cursor-pointer">
                                        Click to Evaluate
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {features.cashFlowChart && (
                    <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 sm:p-8 rounded-[2rem] shadow-sm">
                        <h3 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-4 flex items-center gap-2">
                            <BarChart2 size={14} className="text-[var(--interactive-accent)]" /> {t('dash.chart.title')}
                        </h3>
                        <div className="h-[220px] sm:h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cashFlowData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--text-muted)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: any) => formatCompact(val, baseCurrency)} />
                                    <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} barSize={15} />
                                    <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {features.categoryChart && (
                    <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 sm:p-8 rounded-[2rem] shadow-sm">
                        <h3 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-4 flex items-center gap-2">
                            <PieIcon size={14} className="text-[var(--interactive-accent)]" /> {t('dash.monthly_expenses')}
                        </h3>
                        <div className="h-[220px] sm:h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                        {categoryData.map((_, i) => (
                                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: any) => formatCompact(val, baseCurrency)} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span style={{ color: 'var(--text-normal)', fontSize: '9px', fontWeight: 600 }}>{value}</span>} wrapperStyle={{ paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {features.netWorthChart && (
                    <section className="lg:col-span-2 bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 sm:p-8 rounded-[2rem] shadow-sm">
                        <h3 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-4 flex items-center gap-2">
                            <Layers size={14} className="text-[var(--interactive-accent)]" /> {t('dash.chart.title')}
                        </h3>
                        <div className="h-[250px] sm:h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={fullHistory}>
                                    <defs>
                                        <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--interactive-accent)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--interactive-accent)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--text-muted)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} minTickGap={40} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: any) => format(val, baseCurrency)} />
                                    <Area type="monotone" dataKey="nominalVal" stroke="var(--interactive-accent)" strokeWidth={3} fill="url(#colorNw)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {features.projections && (
                    <section className="lg:col-span-2 bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-primary)] border border-[var(--background-modifier-border)] p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden">
                        {/* Simulation Content */}
                        <div className="relative z-10 flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black italic text-[var(--text-normal)] flex items-center gap-2">
                                    <Sparkles className="text-[var(--interactive-accent)]" size={18} /> {t('dash.simulator')}
                                </h3>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-tight">{t('dash.simulator_prob').replace('{n}', String(projectionParams.years))}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1">{t('dash.scenario_likely')}</div>
                                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
                                    {monteCarloData.length > 0 ? formatCompact(monteCarloData[monteCarloData.length - 1].expected, baseCurrency) : '---'}
                                </div>
                            </div>
                        </div>
                        <div className="h-[200px] sm:h-[250px] relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monteCarloData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="var(--text-muted)" />
                                    <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: any) => formatCompact(val, baseCurrency)} />
                                    <Area type="monotone" dataKey="optimistic" stroke="none" fill="#10b981" fillOpacity={0.05} />
                                    <Area type="monotone" dataKey="pessimistic" stroke="none" fill="#ef4444" fillOpacity={0.1} />
                                    <Area type="monotone" dataKey="expected" stroke="var(--interactive-accent)" strokeWidth={2} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {/* NEW: RECENT TRANSACTIONS TIMELINE (Gantt-ish Style) */}
                <section className="lg:col-span-2 bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 sm:p-8 rounded-[2rem] shadow-sm">
                    <h3 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-6 flex items-center gap-2">
                        <List size={14} className="text-[var(--interactive-accent)]" /> Flujo de Caja Reciente
                    </h3>
                    <div className="flex flex-col gap-3">
                        {recentTimeline.length === 0 ? (
                            <div className="text-center text-[var(--text-muted)] text-sm py-8 font-bold">Sin transacciones recientes</div>
                        ) : (
                            recentTimeline.map(tx => {
                                const isIncome = tx.type === TransactionType.INCOME;
                                const isTransfer = tx.type === TransactionType.TRANSFER;
                                const colorClass = isIncome ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : isTransfer ? 'border-amber-500 bg-amber-500/5 text-amber-600' : 'border-rose-500 bg-rose-500/5 text-rose-600';
                                const sign = isIncome ? '+' : isTransfer ? '' : '-';

                                return (
                                    <div key={tx.id} className={`flex items-center justify-between p-4 rounded-xl border-l-4 border-y border-r border-y-transparent border-r-transparent hover:border-r-[var(--background-modifier-border)] hover:border-y-[var(--background-modifier-border)] transition-all ${colorClass}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col min-w-[60px]">
                                                <span className="text-[10px] uppercase font-bold opacity-70">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                <span className="text-[9px] opacity-50">{new Date(tx.date).getFullYear()}</span>
                                            </div>
                                            <div className="w-px h-8 bg-current opacity-20 hidden sm:block"></div>
                                            <div className="flex flex-col mx-2 sm:mx-4">
                                                <span className="text-sm font-bold truncate max-w-[120px] sm:max-w-xs">{tx.note || tx.area || 'Sin Descripción'}</span>
                                                <span className="text-[10px] uppercase font-bold opacity-70 tracking-wider truncate max-w-[100px] sm:max-w-[200px]">{tx.area} • {tx.from}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="font-mono font-black text-sm sm:text-base whitespace-nowrap">
                                                {sign}{format(tx.amount, tx.currency)}
                                            </span>
                                            {tx.status === 'pending' && <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">Pending</span>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

// --- SUBCOMPONENTES ---

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    subtext?: string;
    className?: string;
}

const KpiCard: React.FC<KpiCardProps & { children?: React.ReactNode }> = ({ title, value, icon, subtext, className = "", children }) => (
    <div className={`bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-5 rounded-2xl flex flex-col justify-between backdrop-blur-sm group hover:border-[var(--interactive-accent)]/40 hover:bg-[var(--background-secondary)]/50 transition-all duration-300 relative overflow-hidden ${className}`}>
        <div className="relative z-10">
            <div className="flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">
                {icon} {title}
            </div>
            <div className="mt-2">
                <div className="text-lg sm:text-xl font-mono font-black tracking-tight text-[var(--text-normal)]">{value}</div>
                {subtext && <div className="text-[8px] font-bold text-[var(--text-muted)] mt-0.5 truncate">{subtext}</div>}
            </div>
        </div>
        {children && (
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 group-hover:opacity-50 transition-opacity">
                {children}
            </div>
        )}
    </div>
);

export default Dashboard;