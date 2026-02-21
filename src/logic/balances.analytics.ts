// src/logic/balances.analytics.ts
import { Currency, Transaction, TransactionType } from '../types';

export interface FinancialHealth {
  score: number;
  status: 'OPTIMAL' | 'STABLE' | 'CRITICAL';
  liquidityRatio: number;
  alerts: { type: 'danger' | 'warning' | 'info'; message: string }[];
  recommendations: string[];
}

export const BalancesAnalytics = {
  // 1. Cálculo de ROI Inteligente (Capital Aportado vs Valor Actual)
  calculateSmartROI: (accountId: string, accountName: string, currentBalanceBase: number, transactions: Transaction[], toBase: (amount: number, currency: Currency) => number) => {
    const isInvest = /invest|inversión|stock|crypto|real_estate|propiedad/i.test(accountName);
    if (!isInvest) return null;

    // Solo contamos flujos externos (Capital Real) y GASTOS reales. 
    // Las transferencias entre mis propias cuentas de inversión son NEUTRALES.
    const netCapitalAportado = transactions.reduce((sum, t) => {
      const val = toBase(t.amount, t.currency);

      // Entrada desde cuenta externa (no inversión)
      // Normalización V3: Match por ID o por nombre legacy
      const isTarget = t.toId === accountId || t.to === accountName;
      const isFromInvest = /invest/i.test(t.from || '');

      if (isTarget && !isFromInvest) return sum + val;

      // Gasto real desde esta cuenta
      const isSource = t.fromId === accountId || t.from === accountName;
      if (isSource && t.type === TransactionType.EXPENSE) return sum - val;

      return sum;
    }, 0);

    if (netCapitalAportado <= 0) return null;
    return ((currentBalanceBase - netCapitalAportado) / netCapitalAportado) * 100;
  },

  // 2. Motor de Salud Financiera
  computeHealth: (total: number, liquid: number, balances: Record<string, Partial<Record<Currency, number>>>, t: (k: string, p?: any) => string): FinancialHealth => {
    const alerts: FinancialHealth['alerts'] = [];
    const recs: string[] = [];

    const liquidityRatio = total > 0 ? (liquid / total) : 0;

    // Reglas de negocio
    if (liquidityRatio < 0.15) {
      alerts.push({ type: 'danger', message: t('bal.alert.low_liquidity') });
      recs.push(t('bal.alert.low_liquidity_rec'));
    } else if (liquidityRatio > 0.50 && total > 1000000) {
      alerts.push({ type: 'warning', message: t('bal.alert.high_liquidity') });
      recs.push(t('bal.alert.high_liquidity_rec'));
    }

    // Detección de cuentas en rojo
    Object.entries(balances).forEach(([acc, currs]) => {
      if (Object.values(currs).some((v) => (v || 0) < 0)) {
        alerts.push({ type: 'danger', message: t('bal.alert.overdraft', { account: acc }) });
      }
    });

    let score = Math.round(liquidityRatio * 100);
    if (liquidityRatio >= 0.2 && liquidityRatio <= 0.4) score = 95; // El "Sweet Spot"

    return {
      score,
      liquidityRatio,
      status: score > 70 ? 'OPTIMAL' : score > 40 ? 'STABLE' : 'CRITICAL',
      alerts,
      recommendations: recs
    };
  }
};