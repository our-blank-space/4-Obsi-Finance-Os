// src/components/Dashboard.tsx
import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, Activity, Hourglass,
    ArrowUpRight, ArrowDownRight, BarChart2, PieChart as PieIcon,
    Layers, Plane, Sparkles, Bot
} from 'lucide-react';

import { TransactionType } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { useFinance } from '../context/FinanceContext';
import { useBalances } from '../hooks/useBalances';
import { Analytics } from '../utils/analytics';

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

    // ... (Memoized data logic remains identical)
    // 1. DATA PREP
    const fullHistory = useMemo(() =>
        Analytics.normalizeHistory(snapshots, toBase),
        [snapshots, toBase]);

    // 2. METRICS
    const metrics = useMemo(() => {
        if (summaries) {
            return {
                current: summaries.netWorth,
                previous: 0,
                cagr: Analytics.calculateKPIs(fullHistory).cagr,
                years: Analytics.calculateKPIs(fullHistory).years
            };
        }
        return Analytics.calculateKPIs(fullHistory);
    }, [fullHistory, summaries]);

    // 3. RUNWAY
    const runway = useMemo(() => {
        let threeMonthsAvgExpense = 0;
        if (summaries) {
            const today = new Date();
            let total = 0;
            let count = 0;
            for (let i = 1; i <= 3; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = d.toISOString().slice(0, 7);
                if (summaries.monthlyBreakdown[key]) {
                    total += summaries.monthlyBreakdown[key].expense;
                    count++;
                }
            }
            threeMonthsAvgExpense = count > 0 ? total / count : 1;
        } else {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const recentExpenses = transactions.filter(t =>
                t.type === TransactionType.EXPENSE && new Date(t.date) >= threeMonthsAgo
            );
            const totalExpense = recentExpenses.reduce((s, t) => s + toBase(t.amount, t.currency), 0);
            threeMonthsAvgExpense = totalExpense / 3 || 1;
        }
        return {
            months: liquidTotal / threeMonthsAvgExpense,
            avgExpense: threeMonthsAvgExpense
        };
    }, [transactions, liquidTotal, toBase, summaries]);

    // 4. CASH FLOW
    const cashFlowData = useMemo(() => {
        const data: Record<string, { name: string, income: number, expense: number }> = {};
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7);
            data[key] = { name: d.toLocaleString('default', { month: 'short' }), income: 0, expense: 0 };
        }
        if (summaries) {
            Object.keys(data).forEach(key => {
                if (summaries.monthlyBreakdown[key]) {
                    data[key].income = summaries.monthlyBreakdown[key].income;
                    data[key].expense = summaries.monthlyBreakdown[key].expense;
                }
            });
        } else {
            transactions.forEach(t => {
                const key = t.date.slice(0, 7);
                if (data[key]) {
                    const val = toBase(t.amount, t.currency);
                    if (t.type === TransactionType.INCOME) data[key].income += val;
                    if (t.type === TransactionType.EXPENSE) data[key].expense += val;
                }
            });
        }
        return Object.values(data);
    }, [transactions, toBase, summaries]);

    // 5. CATEGORIES
    const categoryData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        const currentMonth = new Date().toISOString().slice(0, 7);
        const map: Record<string, number> = {};
        const relevantTxs = transactions.filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth));
        relevantTxs.forEach(t => {
            const registryCategory = state.categoryRegistry?.find(c => c.id === t.areaId);
            const label = registryCategory?.name || t.area || 'Sin Categoría';
            map[label] = (map[label] || 0) + toBase(t.amount, t.currency);
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [transactions, toBase, state.categoryRegistry]);

    // 6. PROJECTIONS
    const monteCarloData = useMemo(() => {
        if (!features.projections) return [];
        return Analytics.generateMonteCarlo(
            metrics.current,
            projectionParams.years,
            projectionParams.expectedReturn,
            8,
            projectionParams.inflationRate
        );
    }, [metrics.current, features.projections, projectionParams]);

    const currentCashFlow = (cashFlowData[5]?.income || 0) - (cashFlowData[5]?.expense || 0);

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
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: number) => formatCompact(val, baseCurrency)} />
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
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: number) => formatCompact(val, baseCurrency)} />
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
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: number) => format(val, baseCurrency)} />
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
                                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--text-normal)' }} formatter={(val: number) => formatCompact(val, baseCurrency)} />
                                    <Area type="monotone" dataKey="optimistic" stroke="none" fill="#10b981" fillOpacity={0.05} />
                                    <Area type="monotone" dataKey="pessimistic" stroke="none" fill="#ef4444" fillOpacity={0.1} />
                                    <Area type="monotone" dataKey="expected" stroke="var(--interactive-accent)" strokeWidth={2} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}
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