import { useMemo } from 'react';
import { AssetProject, Currency } from '../types';
import { useCurrency } from './useCurrency';
import { CurrencyMath } from '../utils/math';
import { calculateXIRR } from '../utils/financial';

// Palette for Asset Types
const SUBTLE_COLORS = [
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
];

export interface AllocationItem {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

export const usePortfolioMath = (assets: AssetProject[]) => {
    const { toBase, baseCurrency } = useCurrency();

    return useMemo(() => {
        let totalInvested = 0;
        let totalValuation = 0;

        // Arrays for Global IRR Calculation
        const globalCashFlowValues: number[] = [];
        const globalCashFlowDates: Date[] = [];

        assets.forEach(asset => {
            // Usamos CurrencyMath para sumar las entradas del activo
            const investedRaw = asset.entries
                .filter(e => e.type === 'investment' || e.type === 'expense')
                .reduce((sum, e) => CurrencyMath.add(sum, e.amount), 0);

            const invested = toBase(investedRaw, asset.currency);

            // Valor actual o inversión si no se ha definido
            const valuationRaw = asset.currentValue || investedRaw;
            const valuation = toBase(valuationRaw, asset.currency);

            totalInvested = CurrencyMath.add(totalInvested, invested);
            totalValuation = CurrencyMath.add(totalValuation, valuation);

            // --- Collect Cash Flows for IRR ---
            asset.entries.forEach(entry => {
                const amountBase = toBase(entry.amount, asset.currency);
                const date = new Date(entry.date);
                if (isNaN(date.getTime())) return;

                if (entry.type === 'investment' || entry.type === 'expense') {
                    // Outflow (Negative)
                    globalCashFlowValues.push(-amountBase);
                    globalCashFlowDates.push(date);
                } else if (entry.type === 'withdrawal' || entry.type === 'revenue') {
                    // Inflow (Positive)
                    globalCashFlowValues.push(amountBase);
                    globalCashFlowDates.push(date);
                }
            });

            // Add Current Valuation as "Terminal Value" (Positive Inflow if sold today)
            if (valuation > 0) {
                globalCashFlowValues.push(valuation);
                globalCashFlowDates.push(new Date());
            }
        });

        const totalPnL = CurrencyMath.subtract(totalValuation, totalInvested);
        const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        // Calculate IRR (XIRR)
        // returns decimal (0.12 = 12%), we want percentage for consistency with ROI
        const irrDecimal = calculateXIRR(globalCashFlowValues, globalCashFlowDates);
        const irr = irrDecimal * 100;

        // Allocation Calculation
        const allocationMap = new Map<string, number>();
        assets.forEach(asset => {
            const valuationRaw = asset.currentValue || 0;
            const valuation = toBase(valuationRaw, asset.currency);
            const type = asset.type || 'Other';
            const current = allocationMap.get(type) || 0;
            allocationMap.set(type, CurrencyMath.add(current, valuation));
        });

        const allocation: AllocationItem[] = Array.from(allocationMap.entries()).map(([name, value], index) => ({
            name,
            value,
            percentage: totalValuation > 0 ? (value / totalValuation) * 100 : 0,
            color: SUBTLE_COLORS[index % SUBTLE_COLORS.length]
        })).sort((a, b) => b.value - a.value);

        return {
            totalInvested,
            totalValuation,
            totalPnL,
            roi,
            irr, // Exposed
            currency: baseCurrency,
            allocation
        };
    }, [assets, toBase, baseCurrency]);
};
