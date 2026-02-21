import { useMemo } from 'react';

export interface DealScoringInput {
    roi: number;           // % (e.g., 50 for 50%)
    margin: number;        // %
    totalInvestment: number;
    netProfit: number;
    paybackMonths?: number; // Estimated months to recover investment
    safetyMargin?: number;  // % difference between sell price and break-even price
}

export interface ScoreBreakdown {
    score: number;
    max: number;
    label: string;
    status: 'good' | 'warning' | 'bad';
}

export interface DealScore {
    totalScore: number;
    rating: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    details: {
        roi: ScoreBreakdown;
        margin: ScoreBreakdown;
        payback: ScoreBreakdown;
        safety: ScoreBreakdown;
    };
}

export const useDealScoring = (metrics: DealScoringInput): DealScore => {
    return useMemo(() => {
        // 1. ROI SCORE (Max 30)
        // Target: High ROI is king.
        let roiScore = 0;
        if (metrics.roi >= 100) roiScore = 30;
        else if (metrics.roi >= 50) roiScore = 25;
        else if (metrics.roi >= 25) roiScore = 15;
        else if (metrics.roi > 0) roiScore = 5;

        // 2. MARGIN SCORE (Max 25)
        // Target: High margin protects against errors.
        let marginScore = 0;
        if (metrics.margin >= 50) marginScore = 25;
        else if (metrics.margin >= 30) marginScore = 20;
        else if (metrics.margin >= 15) marginScore = 10;
        else if (metrics.margin > 0) marginScore = 5;

        // 3. PAYBACK SPEED (Max 20)
        // Target: Fast cash recovery.
        // Default to 0 if not provided (assume long term)
        let paybackScore = 0;
        if (metrics.paybackMonths) {
            if (metrics.paybackMonths <= 3) paybackScore = 20;
            else if (metrics.paybackMonths <= 6) paybackScore = 15;
            else if (metrics.paybackMonths <= 12) paybackScore = 10;
            else if (metrics.paybackMonths <= 24) paybackScore = 5;
        } else {
            // If not explicit, we use ROI proxy: High ROI usually means fast payback if time is constant
            // But better to be conservative.
            paybackScore = 0;
        }

        // 4. SAFETY MARGIN (Max 25)
        // Target: How much can the price drop before I lose money?
        let safetyScore = 0;
        if (metrics.safetyMargin !== undefined) {
            if (metrics.safetyMargin >= 60) safetyScore = 25;
            else if (metrics.safetyMargin >= 40) safetyScore = 20;
            else if (metrics.safetyMargin >= 20) safetyScore = 10;
            else if (metrics.safetyMargin > 0) safetyScore = 5;
        }

        const total = roiScore + marginScore + paybackScore + safetyScore;

        let rating: DealScore['rating'] = 'F';
        if (total >= 90) rating = 'S';
        else if (total >= 80) rating = 'A';
        else if (total >= 60) rating = 'B';
        else if (total >= 40) rating = 'C';
        else if (total >= 20) rating = 'D';

        return {
            totalScore: total,
            rating,
            details: {
                roi: {
                    score: roiScore, max: 30,
                    label: `${metrics.roi.toFixed(0)}% ROI`,
                    status: roiScore >= 20 ? 'good' : roiScore >= 5 ? 'warning' : 'bad'
                },
                margin: {
                    score: marginScore, max: 25,
                    label: `${metrics.margin.toFixed(0)}% Margin`,
                    status: marginScore >= 20 ? 'good' : marginScore >= 5 ? 'warning' : 'bad'
                },
                payback: {
                    score: paybackScore, max: 20,
                    label: metrics.paybackMonths ? `${metrics.paybackMonths.toFixed(1)} Mo` : 'N/A',
                    status: paybackScore >= 15 ? 'good' : paybackScore >= 5 ? 'warning' : 'bad'
                },
                safety: {
                    score: safetyScore, max: 25,
                    label: metrics.safetyMargin ? `Safe ${metrics.safetyMargin.toFixed(0)}%` : 'N/A',
                    status: safetyScore >= 20 ? 'good' : safetyScore >= 10 ? 'warning' : 'bad'
                }
            }
        };
    }, [metrics]);
};
