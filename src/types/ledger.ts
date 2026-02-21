// src/types/ledger.ts
import { Currency, Priority } from './core';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
    TRANSFER = 'transfer',
    INVESTMENT = 'investment',
    REVALUATION = 'revaluation'
}

export enum TransactionSentiment {
    NEED = 'need',
    WANT = 'want',
    INVESTMENT = 'invest',
    REGRET = 'regret'
}

export interface Transaction {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    currency: Currency;

    // Normalización V3 (Obligatorios)
    areaId: string;
    fromId: string;
    toId?: string;

    // Legacy / UI Helpers
    from: string;
    to: string;
    area: string;

    note: string;
    sentiment?: TransactionSentiment;
    aiInsight?: string;
    wikilink?: string;
    tags?: string[];

    // Auditoría
    amountBase: number;
    exchangeRateSnapshot: number;
}

export interface Budget {
    id: string;
    areaId: string;
    area: string;
    amount: number;
    currency: Currency;
    type: TransactionType; // Reutilizamos el enum o creamos BudgetType
}

export interface RecurrentTransaction {
    id: string;
    name: string;
    amount: number;
    currency: Currency;
    type: TransactionType;
    frequency: 'weekly' | 'monthly' | 'yearly' | 'custom';
    nextDate: string;
    isActive: boolean;
    isVariable?: boolean;
    areaId?: string;
    accountId?: string;
    // ... campos legacy necesarios para UI actual
    area: string;
    account: string;
    isTrial?: boolean;
    trialEndDate?: string;
    anchorDay?: number;
}
