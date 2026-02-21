// src/core/analytics/AnnualEngine.ts
import { Transaction, TransactionType, Currency } from '../../types';
import { AnnualReportData, InsightLevel } from '../../types/analytics';

export const AnnualEngine = {

    generate: (
        transactions: readonly Transaction[],
        year: number,
        baseCurrency: Currency,
        exchangeRateToBase: number
    ): AnnualReportData => {

        const yearTransactions = transactions.filter(t => {
            const [y] = t.date.split('-');
            return Number(y) === year;
        });

        let income = 0;
        let expense = 0;
        const areaMap: Record<string, number> = {};

        for (const t of yearTransactions) {
            const normalized = normalizeCurrency(
                t.amount,
                t.currency,
                baseCurrency,
                exchangeRateToBase
            );

            if (t.type === TransactionType.INCOME) {
                income += normalized;
            }

            if (t.type === TransactionType.EXPENSE) {
                expense += normalized;
                const area = t.area ?? 'unspecified';
                areaMap[area] = (areaMap[area] ?? 0) + normalized;
            }
        }

        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        const topAreas = Object.entries(areaMap)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: expense > 0 ? (amount / expense) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            year,
            currency: baseCurrency,
            stats: { income, expense, savings, savingsRate },
            topAreas,
            insight: determineInsight(savings, savingsRate)
        };
    }
};

function normalizeCurrency(
    amount: number,
    from: Currency,
    to: Currency,
    rateToBase: number
): number {
    if (from === to) return amount;
    return to === 'COP' ? amount * rateToBase : amount / rateToBase;
}

function determineInsight(
    savings: number,
    rate: number
): { level: InsightLevel; code: string } {
    if (savings < 0) return { level: 'critical', code: 'negative_flow' };
    if (rate < 10) return { level: 'warning', code: 'low_savings' };
    if (rate < 30) return { level: 'healthy', code: 'healthy_savings' };
    return { level: 'excellent', code: 'high_performance' };
} 
