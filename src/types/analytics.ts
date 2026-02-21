// src/types/analytics.ts
import { Currency } from './core';

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