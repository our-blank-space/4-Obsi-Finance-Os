import { useMemo } from 'react';
import { RecurrentTransaction, Currency } from '../../types';
import { RecurrentEngine } from '../../core/analytics/RecurrentEngine';

export const useRecurrentAnalytics = (
  recurrents: RecurrentTransaction[],
  toBase: (amt: number, curr: Currency) => number
) => {
  return useMemo(() => {
    const burnRate = RecurrentEngine.calculateMonthlyBurnRate(recurrents, toBase);
    
    // Usamos el helper optimizado del Engine
    const timeline = RecurrentEngine.getTimeline(recurrents);

    const pendingVariableCount = recurrents.filter(r => r.isActive && r.isVariable).length;

    return { burnRate, timeline, pendingVariableCount };
  }, [recurrents, toBase]);
};