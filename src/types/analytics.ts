import { Currency } from './core';
import { Transaction, RecurrentTransaction } from './ledger';

export type InsightLevel = 'critical' | 'warning' | 'healthy' | 'excellent';

export interface AreaPerformance {
    name: string;
    amount: number;
    percentage: number;
}

export interface AssetPerformance {
    name: string;
    net: number;
    roi: number;
    currency: Currency;
}

export interface MonthlyReportData {
    month: string;
    baseCurrency: Currency;
    exchangeRate: number;
    stats: {
        income: number;
        expense: number;
        netFlow: number;
        savingsRate: number;
    };
    assets: AssetPerformance[];
    timestamp: string;
}

export interface AnnualReportData {
    year: number;
    currency: Currency;
    stats: {
        income: number;
        expense: number;
        savings: number;
        savingsRate: number;
    };
    topAreas: AreaPerformance[];
    insight: {
        level: InsightLevel;
        code: string;
    };
}

export interface ProjectionMonth {
    month: string;
    income: number;
    expense: number;
    netFlow: number;
    burnRate: number;
    balanceStart: number;
    balanceEnd: number;
    alerts: Array<{
        type: string;
        code: string;
        message: string;
    }>;
    projected?: number; // Compatibilidad con versiones anteriores si es necesario
    actual?: number;
}

export interface BalanceProjectionInput {
    transactions: Transaction[];
    recurrents: RecurrentTransaction[];
    baseCurrency: Currency;
    initialBalance: number;
    startDate: string; // YYYY-MM
    horizonMonths: number;
    toBase: (amount: number, from: Currency) => number;
}