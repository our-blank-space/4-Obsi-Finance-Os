import { useMemo } from 'react';
import { TradeSide } from '../types';

interface RiskInput {
    entryPrice: string;
    amount: string;
    stopLoss: string;
    takeProfit: string;
    side: TradeSide;
}

export const useRiskCalculator = (input: RiskInput) => {
    return useMemo(() => {
        const entry = parseFloat(input.entryPrice);
        const qty = parseFloat(input.amount);
        const sl = parseFloat(input.stopLoss);
        const tp = parseFloat(input.takeProfit);

        if (isNaN(entry) || isNaN(qty) || entry <= 0 || qty <= 0) return null;

        // Cálculo de Riesgo Bruto (puede ser negativo si SL está mal puesto)
        const rawRisk = input.side === TradeSide.BUY
            ? (entry - sl) * qty
            : (sl - entry) * qty;

        const rawReward = input.side === TradeSide.BUY
            ? (tp - entry) * qty
            : (entry - tp) * qty;

        // Detectar configuración inválida ANTES de clamping
        const invalidSL = !isNaN(sl) && rawRisk < 0;
        const invalidTP = !isNaN(tp) && rawReward < 0;

        const risk = isNaN(sl) ? null : Math.max(0, rawRisk);
        const reward = isNaN(tp) ? null : Math.max(0, rawReward);
        const exposure = entry * qty;

        return {
            risk,
            reward,
            exposure,
            ratio: risk && reward && risk > 0 ? (reward / risk).toFixed(2) : '0.00',
            invalidSL,
            invalidTP
        };
    }, [input]);
};