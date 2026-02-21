// src/core/analytics/MonthlyEngine.ts
import { Transaction, Asset, Currency, TransactionType } from '../../types';
import { MonthlyReportData, AssetPerformance } from '../../types/analytics';
import { AssetEngine } from './AssetEngine';

export const MonthlyEngine = {

    generate: (
        transactions: readonly Transaction[],
        assets: readonly Asset[],
        month: string, // YYYY-MM
        baseCurrency: Currency,
        exchangeRateToBase: number
    ): MonthlyReportData => {

        const monthTransactions = transactions.filter(
            t => t.date.slice(0, 7) === month
        );

        const toBase = (amount: number, curr: Currency): number => {
            if (curr === baseCurrency) return amount;
            return baseCurrency === 'COP'
                ? amount * exchangeRateToBase
                : amount / exchangeRateToBase;
        };

        const income = sumByType(monthTransactions, TransactionType.INCOME, toBase);
        const expense = sumByType(monthTransactions, TransactionType.EXPENSE, toBase);

        const assetPerformance: AssetPerformance[] = assets.map(a => {
            // Lifecycle ROI using the robust AssetEngine
            const roi = AssetEngine.calculateROI(a);

            // Monthly Net Flow for this specific month
            const monthTxs = (a.transactions || []).filter(e => e.date.slice(0, 7) === month);
            const revenue = monthTxs.filter(e => e.type === 'revenue').reduce((s, e) => s + e.amount, 0);
            const costs = monthTxs.filter(e => ['cost', 'maintenance', 'tax', 'loan_payment', 'improvement'].includes(e.type)).reduce((s, e) => s + e.amount, 0);
            const net = revenue - costs;

            return {
                name: a.name,
                net,
                roi,
                currency: a.currency
            };
        }).sort((a, b) => b.roi - a.roi);

        const netFlow = income - expense;
        const savingsRate = income > 0 ? (netFlow / income) * 100 : 0;

        return {
            month,
            baseCurrency,
            exchangeRate: exchangeRateToBase,
            stats: { income, expense, netFlow, savingsRate },
            assets: assetPerformance,
            timestamp: new Date().toISOString()
        };
    },

    convertToMarkdown: (data: MonthlyReportData, isPrivate: boolean, t: (k: string) => string): string => {
        const mask = (val: number) => isPrivate ? '••••••' : val.toLocaleString();

        return [
            `---`,
            `type: financial-review`,
            `month: ${data.month}`,
            `base_currency: ${data.baseCurrency}`,
            `rate: ${data.exchangeRate}`,
            `generated: ${data.timestamp}`,
            `---`,
            ``,
            `# 📊 ${t('report.financial_review')} - ${data.month}`,
            ``,
            `## 💰 ${t('report.flow_summary')}`,
            `- **${t('stats.income')}:** ${mask(data.stats.income)} ${data.baseCurrency}`,
            `- **${t('stats.expense')}:** ${mask(data.stats.expense)} ${data.baseCurrency}`,
            `- **${t('stats.net_flow')}:** ${mask(data.stats.netFlow)} ${data.baseCurrency}`,
            `- **${t('stats.savings_rate')}:** ${data.stats.savingsRate.toFixed(1)}%`,
            ``,
            `## 🐖 ${t('report.asset_performance')}`,
            data.assets.length
                ? data.assets.map(a =>
                    `- **${a.name}:** ${mask(a.net)} ${a.currency} (ROI: ${a.roi.toFixed(1)}%)`
                ).join('\n')
                : `_${t('report.no_assets')}_`,
            ``,
            `---`,
            `*Generado por FinanceOS*`
        ].join('\n');
    }
};

function sumByType(
    txs: readonly Transaction[],
    type: TransactionType,
    toBase: (amt: number, curr: Currency) => number
): number {
    return txs
        .filter(t => t.type === type)
        .reduce((s, t) => s + toBase(t.amount, t.currency), 0);
}
