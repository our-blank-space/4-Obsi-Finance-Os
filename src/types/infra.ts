
import { Currency, Priority } from './core';

export interface WeeklySnapshot {
    id: string;
    date: string;
    values: Record<string, number>;
    patrimonio: number;
    currency: Currency;
    note?: string;
}

export interface Reminder {
    id: string;
    title: string;
    dueDate: string;
    amount?: number;
    currency?: Currency;
    category: string;
    isCompleted: boolean;
    priority: Priority;
    note?: string;
}

export interface GlobalSummary {
    totalIncome: number;
    totalExpense: number;
    netWorth: number;
    avgMonthlyBurnRate: number;
    savingsRate: number;
    runwayMonths: number;
    monthlyBreakdown: Record<string, any>;
    lastUpdated: string;
}
