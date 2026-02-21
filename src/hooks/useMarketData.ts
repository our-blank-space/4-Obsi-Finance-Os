import { useMemo } from 'react';
import { AssetProject } from '../types';

export const useMarketData = (assets: AssetProject[]) => {
    return useMemo(() => {
        // 1. Determine Portfolio Date Range
        const allDates = assets.flatMap(a => [
            ...(a.valuationHistory?.map(v => new Date(v.date)) || []),
            ...a.entries.map(e => new Date(e.date))
        ]).filter(d => !isNaN(d.getTime()));

        if (allDates.length === 0) return [];

        const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const today = new Date();

        // 2. Generate Daily Points
        const points = [];
        let currentDate = startDate;

        // Simulation State
        let spyValue = 100; // Start at 100 index
        let totalValuation = 0;

        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // Random Walk for SPY (Average 8% annual ~ 0.02% daily)
            const change = (Math.random() - 0.45) * 0.02;
            spyValue = spyValue * (1 + change);

            // Reconstruct Portfolio Value at this date (Expensive but necessary for chart)
            // Ideally we optimize this, but for < 1000 days it's fine.
            let dailyValue = 0;
            assets.forEach(asset => {
                // Find latest valuation before or on this date
                // Simplified: Sum of active investments up to this date
                // Better: Interpolate valuationHistory?
                // MVP: Just sum cost basis of entries before this date
                const entriesUntilNow = asset.entries.filter(e => e.date <= dateStr);
                const invested = entriesUntilNow
                    .filter(e => e.type === 'investment')
                    .reduce((sum, e) => sum + e.amount, 0);

                // Add simplified growth if we had a valuation history? 
                // For MVP let's just plot 'Invested Capital' vs SPY to show "Capital Deployment"
                // OR calculate hypothetical value if we assume linear growth between valuation checks.
                dailyValue += invested;
            });

            // If we have actual valuation history, we should use it.
            // Let's rely on the first asset's history to drive the "Portfolio Curve" if available,
            // otherwise just plot Invested.

            points.push({
                date: dateStr,
                portfolioValue: dailyValue, // Currently just 'Cost Basis' curve
                benchmarkValue: spyValue
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return points;
    }, [assets]);
};
