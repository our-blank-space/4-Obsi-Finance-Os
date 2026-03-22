// src/types/core.ts

// Monedas y Formatos
export type Currency = 'COP' | 'USD' | 'EUR' | 'GBP' | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'PEN';
export type Language = 'es' | 'en';

// Fechas y Frecuencias
export type Frequency = 'weekly' | 'monthly' | 'yearly' | 'custom';
export type Priority = 'low' | 'medium' | 'high';

// Sistema
export interface StateMeta {
    mode: 'production' | 'demo';
    loadedAt?: string;
    version: number;
}

export interface FeatureFlags {
    ai: boolean;
    projections: boolean;
    cashFlowChart: boolean;
    categoryChart: boolean;
    netWorthChart: boolean;
    savingsChart: boolean;
}

// --- CORE REGISTRIES ---
export interface FinanceCategory {
    id: string;
    name: string;
    type?: 'income' | 'expense' | 'invest' | 'mixed';
    isArchived: boolean;
}

export interface FinanceAccount {
    id: string;
    name: string;
    currency: Currency;
    isArchived: boolean;
}

export enum FinanceModule {
    DASHBOARD = 'dashboard',
    BALANCES = 'balances',
    LOGS = 'logs',
    RECURRENT = 'recurrent',
    BUDGETS = 'budgets',
    ASSETS = 'assets',
    REMINDERS = 'reminders',
    REVIEWS = 'reviews',
    MONTHLY_REVIEW = 'monthly_review',
    ANNUAL_REPORT = 'annual_report',
    TRADING = 'trading',
    LENDING = 'lending',
    DEBTS = 'debts',
    BUSINESS = 'business',
    SIMULATIONS = 'simulations',
    QUOTATION = 'quotation',
    CUSTODIAL = 'custodial',
    FX = 'fx',
    GUIDE = 'guide'
}
