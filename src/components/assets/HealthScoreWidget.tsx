import React from 'react';
import { Asset } from '../../types';
import { useFinancialHealth } from '../../hooks/useFinancialHealth';
import { Activity, ShieldCheck, PieChart, TrendingUp, DollarSign } from 'lucide-react';

interface Props {
    assets: Asset[];
}

export const HealthScoreWidget: React.FC<Props> = ({ assets }) => {
    const { score, details } = useFinancialHealth(assets);

    // Color logic
    const getColor = (s: number) => {
        if (s >= 80) return '#10B981'; // Emerald
        if (s >= 50) return '#F59E0B'; // Amber
        return '#F43F5E'; // Rose
    };

    const scoreColor = getColor(score);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)] h-full flex flex-col relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-10 opacity-5 blur-xl bg-gradient-to-br from-[var(--interactive-accent)] to-transparent rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} /> Salud Financiera
                </h3>
            </div>

            <div className="flex flex-col items-center justify-center flex-1">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* SVG Ring */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="transparent"
                            stroke="var(--background-modifier-border)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="transparent"
                            stroke={scoreColor}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-[var(--text-normal)]">{score}</span>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Puntos</span>
                    </div>
                </div>
            </div>

            {/* Checklist */}
            <div className="mt-4 space-y-2">
                <HealthItem
                    icon={<PieChart size={12} />}
                    label="Diversificación"
                    status={details.diversification.status}
                    value={details.diversification.label}
                />
                <HealthItem
                    icon={<DollarSign size={12} />}
                    label="Liquidez"
                    status={details.liquidity.status}
                    value={details.liquidity.label}
                />
                <HealthItem
                    icon={<TrendingUp size={12} />}
                    label="Rendimiento"
                    status={details.performance.status}
                    value={details.performance.label}
                />
                <HealthItem
                    icon={<Activity size={12} />}
                    label="Actividad"
                    status={details.activity.status}
                    value={details.activity.label}
                />
            </div>
        </div>
    );
};

const HealthItem = ({ icon, label, status, value }: { icon: any, label: string, status: string, value: string }) => (
    <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] mr-1">{value}</span>
            <div className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
        </div>
    </div>
);
