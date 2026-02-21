
import { Currency } from './core';

export enum CustodialTransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    INVESTMENT = 'investment',
    EXPENSE = 'expense',
    INTEREST = 'interest',
    ADJUSTMENT = 'adjustment'
}

export interface CustodialTransaction {
    id: string;
    date: string;
    type: CustodialTransactionType;
    amount: number;
    note: string;
    sourceAccount?: string;
    wikilink?: string;
}

export enum CustodialAccountStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ARCHIVED = 'archived'
}

export interface CustodialAccount {
    id: string;
    name: string;
    entity: string;
    currency: Currency;
    purpose: string;
    deadline?: string;
    interestRate?: number;
    notes?: string;
    transactions: CustodialTransaction[];
    status: CustodialAccountStatus;
}
