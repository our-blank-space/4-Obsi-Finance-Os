import { useMemo } from 'react';
import { TransactionType, Ledger, Core, UI } from '../types';
import { Analytics } from '../utils/analytics';

export const useDashboardMetrics = (
    state: any,
    toBase: any,
    liquidTotal: number
) => {
    const { transactions, snapshots, features, projectionParams, summaries, categoryRegistry } = state;

    const fullHistory = useMemo(() =>
        Analytics.normalizeHistory(snapshots, toBase),
        [snapshots, toBase]
    );

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
            const recentExpenses = transactions.filter((t: any) =>
                t.type === TransactionType.EXPENSE && new Date(t.date) >= threeMonthsAgo
            );
            const totalExpense = recentExpenses.reduce((s: any, t: any) => s + toBase(t.amount, t.currency), 0);
            threeMonthsAvgExpense = totalExpense / 3 || 1;
        }
        return {
            months: liquidTotal / threeMonthsAvgExpense,
            avgExpense: threeMonthsAvgExpense
        };
    }, [transactions, liquidTotal, toBase, summaries]);

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
            transactions.forEach((t: any) => {
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

    const categoryData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        const currentMonth = new Date().toISOString().slice(0, 7);
        const map: Record<string, number> = {};
        const relevantTxs = transactions.filter((t: any) => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth));
        relevantTxs.forEach((t: any) => {
            const registryCategory = categoryRegistry?.find((c: any) => c.id === t.areaId);
            const label = registryCategory?.name || t.area || 'Sin Categoría';
            map[label] = (map[label] || 0) + toBase(t.amount, t.currency);
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [transactions, toBase, categoryRegistry]);

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

    const recentTimeline = useMemo(() => {
        const sorted = [...transactions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.slice(0, 6);
    }, [transactions]);

    return {
        fullHistory,
        metrics,
        runway,
        cashFlowData,
        categoryData,
        monteCarloData,
        currentCashFlow,
        recentTimeline
    };
};
