import { Asset, AssetTransaction, AssetLiability } from '../../types/assets';
import { Currency } from '../../types/core';

export const AssetEngine = {
    // 1. Current Net Value (Asset Value - Liability)
    calculateNetValue: (asset: Asset, liabilityRemaining: number = 0): number => {
        return (asset.currentValue || 0) - liabilityRemaining;
    },

    // 2. Total Cost of Ownership (Purchase + Expenses + Interest + Improvements)
    calculateTCO: (asset: Asset, liabilityInterestPaid: number = 0): number => {
        const expensesAndImprovements = (asset.transactions || [])
            .filter(t => t.type === 'cost' || t.type === 'maintenance' || t.type === 'tax' || t.type === 'loan_payment' || t.type === 'improvement')
            .reduce((sum, t) => sum + t.amount, 0);

        return (asset.purchasePrice || 0) + expensesAndImprovements + liabilityInterestPaid;
    },

    // 3. Return on Investment (ROI)
    // ROI = (Total Income - Total Expenses + Unrealized Gain) / Total Invested
    calculateROI: (asset: Asset): number => {
        const income = (asset.transactions || [])
            .filter(t => t.type === 'revenue')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = (asset.transactions || [])
            .filter(t => t.type === 'cost' || t.type === 'maintenance' || t.type === 'tax')
            .reduce((sum, t) => sum + t.amount, 0);

        const improvements = (asset.transactions || [])
            .filter(t => t.type === 'improvement')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalInvested = (asset.purchasePrice || 0) + improvements;

        // Unrealized Gain = Current Value - Total Invested (Basis)
        const unrealizedGain = (asset.currentValue || 0) - totalInvested;

        const totalGain = (income - expenses) + unrealizedGain;
        const denominator = totalInvested || 1; // Avoid division by zero

        return (totalGain / denominator) * 100;
    },

    // 4. Depreciation (Linear)
    calculateDepreciation: (asset: Asset): number => {
        if (!asset.isDepreciating || !asset.purchasePrice || !asset.usefulLifeYears) return 0;

        const ageYears = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (ageYears >= asset.usefulLifeYears) return asset.purchasePrice - (asset.residualValue || 0);

        const annualDepreciation = (asset.purchasePrice - (asset.residualValue || 0)) / asset.usefulLifeYears;
        const totalDepreciation = annualDepreciation * ageYears;

        return totalDepreciation;
    },

    // 5. Cash Flow (Monthly Average)
    calculateMonthlyCashFlow: (asset: Asset): number => {
        if (!asset.isIncomeGenerating) {
            // Expenses only
            const monthlyExpenses = (asset.transactions || [])
                .filter(t => t.isRecurrent && (t.type === 'cost' || t.type === 'maintenance'))
                .reduce((sum, t) => sum + t.amount, 0);
            return -monthlyExpenses; // Negative cash flow
        }

        // Revenue - Expenses
        const monthlyRevenue = (asset.transactions || [])
            .filter(t => t.isRecurrent && t.type === 'revenue')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = (asset.transactions || [])
            .filter(t => t.isRecurrent && t.type !== 'revenue')
            .reduce((sum, t) => sum + t.amount, 0);

        return monthlyRevenue - monthlyExpenses;
    },

    // 6. Net Investment (Purchase + Expenses - Revenue)
    // Positive = Outstanding Investment (Still recovering)
    // Negative = Net Profit (Paid off)
    calculateNetInvestment: (asset: Asset): number => {
        const expenses = (asset.transactions || [])
            .filter(t => t.type === 'cost' || t.type === 'maintenance' || t.type === 'tax' || t.type === 'loan_payment' || t.type === 'improvement')
            .reduce((sum, t) => sum + t.amount, 0);

        const revenue = (asset.transactions || [])
            .filter(t => t.type === 'revenue')
            .reduce((sum, t) => sum + t.amount, 0);

        return (asset.purchasePrice || 0) + expenses - revenue;
    }
};
