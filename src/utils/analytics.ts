// src/utils/analytics.ts
import { WeeklySnapshot, AssetProject, Trade, Loan, Debt, Currency } from '../types';

type ConverterFn = (amount: number, currency: Currency) => number;
export type TimeRange = '1Y' | '5Y' | '10Y' | 'ALL';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

export const Analytics = {
  
  /**
   * 1. Normaliza el historial de snapshots a la moneda base.
   */
  normalizeHistory: (snapshots: WeeklySnapshot[], toBase: ConverterFn) => {
    if (!snapshots.length) return [];
    
    return [...snapshots]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(s => ({
        date: s.date,
        timestamp: new Date(s.date).getTime(),
        nominalVal: toBase(s.patrimonio, s.currency),
      }));
  },

  /**
   * 2. Calcula valor real ajustado por inflación.
   */
  getAdjustedHistory: (
    fullHistory: { date: string; timestamp: number; nominalVal: number }[],
    range: TimeRange,
    inflationRate: number
  ) => {
    if (!fullHistory.length) return [];

    const now = Date.now();
    let cutoff = 0;

    switch (range) {
      case '1Y': cutoff = now - MS_PER_YEAR; break;
      case '5Y': cutoff = now - (5 * MS_PER_YEAR); break;
      case '10Y': cutoff = now - (10 * MS_PER_YEAR); break;
      default: cutoff = 0;
    }

    const filtered = fullHistory.filter(d => d.timestamp >= cutoff);
    if (!filtered.length) return [];

    return filtered.map(d => {
      const yearsAgo = (now - d.timestamp) / MS_PER_YEAR;
      const realVal = d.nominalVal * Math.pow(1 + (inflationRate / 100), yearsAgo);
      return { ...d, realVal };
    });
  },

  /**
   * 3. Calcula KPIs financieros (CAGR, años registrados).
   */
  calculateKPIs: (data: { timestamp: number; nominalVal: number }[]) => {
    if (data.length < 2) return { cagr: 0, years: 0, current: data[0]?.nominalVal || 0 };

    const start = data[0];
    const end = data[data.length - 1];
    const years = (end.timestamp - start.timestamp) / MS_PER_YEAR;

    let cagr = 0;
    if (start.nominalVal > 0 && end.nominalVal > 0 && years > 0.1) {
      cagr = (Math.pow(end.nominalVal / start.nominalVal, 1 / years) - 1) * 100;
    }

    return { cagr, years, current: end.nominalVal };
  },

  /**
   * 4. NUEVO: Simulador de Monte Carlo (Zona de Probabilidad)
   * En lugar de una línea recta, genera tres escenarios basados en volatilidad.
   */
  generateMonteCarlo: (
    startValue: number, 
    years: number, 
    baseReturn: number, 
    volatility: number,
    inflationRate: number = 0
  ) => {
    if (startValue <= 0) return [];
    
    const results = [];
    const netReturn = baseReturn - inflationRate; // Retorno real esperado

    for (let year = 0; year <= years; year++) {
      // Escenario Pesimista (p10): Mal desempeño del mercado o alta inflación
      const p10 = startValue * Math.pow(1 + (netReturn - volatility) / 100, year);
      
      // Escenario Esperado (p50): El promedio estadístico
      const p50 = startValue * Math.pow(1 + netReturn / 100, year);
      
      // Escenario Optimista (p90): Mercado alcista o baja inflación
      const p90 = startValue * Math.pow(1 + (netReturn + volatility) / 100, year);

      results.push({
        year: `+${year}`,
        pessimistic: Math.round(p10),
        expected: Math.round(p50),
        optimistic: Math.round(p90),
        // Útil para gráficos de área:
        range: [Math.round(p10), Math.round(p90)]
      });
    }
    return results;
  },

  /**
   * 5. Proyección simple (Línea Recta) - Se mantiene por compatibilidad.
   */
  generateProjection: (
    startValue: number,
    years: number,
    returnRate: number,
    inflationRate: number
  ) => {
    if (startValue <= 0) return [];
    
    const data = [];
    let currentNominal = startValue;

    for (let i = 0; i <= years; i++) {
      const realValue = currentNominal / Math.pow(1 + (inflationRate / 100), i);
      data.push({
        year: `+${i}`,
        value: Math.round(currentNominal),
        inflationAdjusted: Math.round(realValue)
      });
      currentNominal = currentNominal * (1 + (returnRate / 100));
    }
    return data;
  },

  /**
   * 6. Desglose de Composición de Activos.
   */
  getComposition: (
    currentNetWorth: number,
    data: {
      assets: AssetProject[],
      trades: Trade[],
      loans: Loan[],
      debts: Debt[]
    },
    toBase: ConverterFn
  ) => {
    const sum = (items: any[], fn: (i: any) => number, getCurr: (i: any) => Currency) => 
      items.reduce((acc, item) => acc + toBase(fn(item), getCurr(item)), 0);

    const assetsVal = sum(data.assets, 
      (a) => a.entries.reduce((acc: number, e: any) => e.type === 'revenue' ? acc + e.amount : acc - e.amount, 0),
      (a) => a.currency
    );

    const tradesVal = sum(data.trades, 
      (t) => t.status === 'open' ? (t.amount * (t.currentPrice || t.entryPrice)) : t.pnl + (t.amount * t.entryPrice), 
      (t) => t.currency
    );

    const loansVal = sum(data.loans, (l) => l.principal - l.collected, (l) => l.currency);
    const debtsVal = sum(data.debts, (d) => d.principal - d.paid, (d) => d.currency);

    const liquidityVal = Math.max(0, currentNetWorth - (assetsVal + tradesVal + loansVal - debtsVal));

    return { assetsVal, tradesVal, loansVal, debtsVal, liquidityVal };
  }
}; 