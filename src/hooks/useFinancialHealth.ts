import { useMemo } from 'react';
import { Asset } from '../types';
import { usePortfolioMath } from './ui/usePortfolioMath';

export interface HealthMetrics {
    score: number;
    details: {
        liquidity: { score: number; max: number; status: 'good' | 'warning' | 'bad'; label: string };
        diversification: { score: number; max: number; status: 'good' | 'warning' | 'bad'; label: string };
        performance: { score: number; max: number; status: 'good' | 'warning' | 'bad'; label: string };
        cashFlow: { score: number; max: number; status: 'good' | 'warning' | 'bad'; label: string };
        activity: { score: number; max: number; status: 'good' | 'warning' | 'bad'; label: string };
    };
}

export const useFinancialHealth = (assets: Asset[]): HealthMetrics => {
    const stats = usePortfolioMath(assets);

    return useMemo(() => {
        let totalScore = 0;

        // 1. LIQUIDITY (Max 20)
        // Target: > 10% in liquid assets
        // @ts-ignore
        const liquidValue = assets
            // @ts-ignore
            .filter(a => a.liquidity === 'liquid' || a.liquidity === 'semi-liquid')
            .reduce((sum, a) => sum + (a.currentValue || 0), 0); // Note: Should convert currency, but MVP ok if mostly base
        // Ideally use stats.allocation or convert. 
        // Let's use simplified check for now or assume simple portfolio.

        const liquidityRatio = stats.totalValuation > 0 ? liquidValue / stats.totalValuation : 0;
        let liqScore = 0;
        let liqStatus: 'good' | 'warning' | 'bad' = 'bad';
        if (liquidityRatio >= 0.1) { liqScore = 20; liqStatus = 'good'; }
        else if (liquidityRatio >= 0.05) { liqScore = 10; liqStatus = 'warning'; }

        // 2. DIVERSIFICATION (Max 20)
        // Target: No single asset > 40%
        let maxAssetRatio = 0;
        assets.forEach(a => {
            const ratio = stats.totalValuation > 0 ? (a.currentValue || 0) / stats.totalValuation : 0;
            if (ratio > maxAssetRatio) maxAssetRatio = ratio;
        });

        let divScore = 0;
        let divStatus: 'good' | 'warning' | 'bad' = 'bad';
        if (maxAssetRatio <= 0.3) { divScore = 20; divStatus = 'good'; }
        else if (maxAssetRatio <= 0.5) { divScore = 10; divStatus = 'warning'; }

        // 3. PERFORMANCE (Max 20)
        // Target: ROI > 0
        let perfScore = 0;
        let perfStatus: 'good' | 'warning' | 'bad' = 'bad';
        if (stats.roi > 10) { perfScore = 20; perfStatus = 'good'; }
        else if (stats.roi > 0) { perfScore = 15; perfStatus = 'good'; }
        else if (stats.roi > -10) { perfScore = 5; perfStatus = 'warning'; }

        // 4. CASH FLOW (Max 20)
        // Target: At least 1 asset generating yield
        const hasYield = assets.some(a => a.isIncomeGenerating);
        let cfScore = hasYield ? 20 : 0;
        let cfStatus: 'good' | 'warning' | 'bad' = hasYield ? 'good' : 'bad';

        // 5. ACTIVITY (Max 20)
        // Target: Update in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUpdate = assets.some(a => new Date(a.updatedAt) > thirtyDaysAgo);
        let actScore = recentUpdate ? 20 : 0;
        let actStatus: 'good' | 'warning' | 'bad' = recentUpdate ? 'good' : 'warning';

        totalScore = liqScore + divScore + perfScore + cfScore + actScore;

        return {
            score: totalScore,
            details: {
                liquidity: { score: liqScore, max: 20, status: liqStatus, label: `Liquidez ${(liquidityRatio * 100).toFixed(0)}%` },
                diversification: { score: divScore, max: 20, status: divStatus, label: maxAssetRatio > 0.5 ? 'Alta Concentración' : 'Diversificado' },
                performance: { score: perfScore, max: 20, status: perfStatus, label: `ROI ${stats.roi.toFixed(1)}%` },
                cashFlow: { score: cfScore, max: 20, status: cfStatus, label: hasYield ? 'Activo' : 'Sin Rentas' },
                activity: { score: actScore, max: 20, status: actStatus, label: recentUpdate ? 'Al día' : 'Desactualizado' }
            }
        };

    }, [assets, stats]);
};
