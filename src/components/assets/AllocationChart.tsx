import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AllocationItem } from '../../hooks/usePortfolioMath';
import { useCurrency } from '../../hooks/useCurrency';

import { Currency } from '../../types';

interface Props {
    data: AllocationItem[];
    currency: Currency;
}

export const AllocationChart: React.FC<Props> = ({ data, currency }) => {
    const { format } = useCurrency();

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-[var(--background-modifier-border)] rounded-2xl">
                <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                    Sin datos de asignación
                </p>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => format(value, currency)}
                        contentStyle={{
                            backgroundColor: 'var(--background-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--background-modifier-border)',
                            color: 'var(--text-normal)'
                        }}
                        itemStyle={{ color: 'var(--text-normal)' }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingLeft: '20px' }}
                        formatter={(value, entry: any) => (
                            <span className="text-xs font-semibold text-[var(--text-muted)] ml-2">
                                {value} ({data.find(d => d.name === value)?.percentage?.toFixed(1) || '0.0'}%)
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Label (Total? Or just decorative) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-32">
                {/* pr-32 to offset legend width roughly if needed, or centering logic */}
            </div>
        </div>
    );
};
