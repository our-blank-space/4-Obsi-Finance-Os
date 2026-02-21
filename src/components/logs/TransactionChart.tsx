import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';

interface TransactionChartProps {
  data: any[];
}

export const TransactionChart: React.FC<TransactionChartProps> = ({ data }) => {
  const { state } = useFinance();
  const { t, language } = useTranslation();
  const isPrivacyMode = state.isPrivacyMode;

  // Memoizar los datos del gráfico para evitar recálculos
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!isPrivacyMode) return data;

    return data.map((d: any) => ({
      ...d,
      income: d.income > 0 ? 1 : 0,
      expense: d.expense > 0 ? 1 : 0
    }));
  }, [data, isPrivacyMode]);

  if (!data || data.length === 0) return null;

  return (
    <div className="h-full w-full relative" style={{ minHeight: 120 }}>
      {/* Header code remains... */}
      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest flex items-center gap-1">
          <BarChart3 size={10} /> {t('chart.daily_activity')}
          {isPrivacyMode && <span className="text-amber-500 ml-1">🔒</span>}
        </span>
      </div>
      <ResponsiveContainer
        width="99%"
        height="85%"
        minWidth={10}
        minHeight={10}
      >
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
          <XAxis
            dataKey="date"
            interval="preserveStartEnd"
            tickFormatter={(dateStr) => {
              const d = new Date(dateStr + 'T12:00:00');
              const locale = language === 'es' ? 'es-CO' : 'en-US';
              if (d.getDate() === 1) {
                return d.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
              }
              return d.getDate().toString();
            }}
            tick={({ x, y, payload }) => {
              const isMonth = payload.value.endsWith('-01');
              const locale = language === 'es' ? 'es-CO' : 'en-US';
              return (
                <text
                  x={x} y={Number(y) + 12}
                  fill={isMonth ? 'var(--interactive-accent)' : 'var(--text-muted)'}
                  fontSize={isMonth ? 10 : 9}
                  fontWeight={isMonth ? 900 : 400}
                  textAnchor="middle"
                >
                  {/* El formatter se aplica automáticamente */}
                  {payload.value.split('-')[2] === '01' ?
                    new Date(payload.value + 'T12:00:00').toLocaleDateString(locale, { month: 'short' }).toUpperCase() :
                    parseInt(payload.value.split('-')[2])}
                </text>
              );
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: 'var(--interactive-accent)', opacity: 0.1 }}
            contentStyle={{
              backgroundColor: 'var(--background-primary)',
              borderRadius: '12px',
              border: '1px solid var(--background-modifier-border)',
              fontSize: '10px',
              color: 'var(--text-normal)'
            }}
            formatter={(value: number, name: string) => {
              if (isPrivacyMode) {
                return [value > 0 ? '••••' : '-', name === 'income' ? t('label.income') : t('label.expense')];
              }
              const locale = language === 'es' ? 'es-CO' : 'en-US';
              return [
                new Intl.NumberFormat(locale).format(value),
                name === 'income' ? t('label.income') : t('label.expense')
              ];
            }}
            labelFormatter={(label) => t('chart.day', { n: label })}
          />
          <Bar
            dataKey="income"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={8}
          />
          <Bar
            dataKey="expense"
            fill="#f43f5e"
            radius={[4, 4, 0, 0]}
            barSize={8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};