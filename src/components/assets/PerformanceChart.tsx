import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useCurrency } from '../../hooks/useCurrency';

export interface PerformancePoint {
    date: string;
    portfolioValue: number;
    benchmarkValue?: number; // e.g. SPY normalized
}

interface Props {
    data: PerformancePoint[];
    showBenchmark?: boolean;
}

export const PerformanceChart: React.FC<Props> = ({ data, showBenchmark = true }) => {
    const { format, baseCurrency } = useCurrency();

    // Normalize Data for Comparison (Percentage Growth)
    const normalizedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const startPortfolio = data[0].portfolioValue;
        const startBenchmark = data[0].benchmarkValue || 100;

        return data.map(d => ({
            ...d,
            portfolioPct: startPortfolio > 0 ? ((d.portfolioValue - startPortfolio) / startPortfolio) * 100 : 0,
            benchmarkPct: d.benchmarkValue ? ((d.benchmarkValue - startBenchmark) / startBenchmark) * 100 : 0
        }));
    }, [data]);

    if (data.length === 0) {
        return <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)] italic">Sin datos históricos suficientes</div>;
    }

    return (
        <div className="w-full h-full min-h-[250px] text-xs">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <LineChart data={normalizedData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--background-modifier-border)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        tickFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                    />
                    <YAxis
                        stroke="var(--text-muted)"
                        tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)}%`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--background-primary)',
                            borderColor: 'var(--background-modifier-border)',
                            borderRadius: '12px',
                            color: 'var(--text-normal)'
                        }}
                        formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name === 'portfolioPct' ? 'Mi Portafolio' : 'S&P 500']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="portfolioPct"
                        stroke="var(--interactive-accent)"
                        strokeWidth={2}
                        dot={false}
                        name="Mi Portafolio"
                    />
                    {showBenchmark && (
                        <Line
                            type="monotone"
                            dataKey="benchmarkPct"
                            stroke="#64748b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            name="S&P 500 (Benchmark)"
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
