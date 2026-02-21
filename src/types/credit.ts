// src/types/credit.ts
import { Currency } from './core';
import { ProjectStatus } from './assets';

export enum InterestType {
    SIMPLE = 'simple',
    FRENCH = 'french',
    COMPOUND = 'compound',
    NONE = 'none'
}

export type PaymentFrequency = 'monthly' | 'biweekly' | 'custom';

export interface LoanPayment {
    id: string;
    date: string;
    amount: number;
    note?: string;
}

export interface Loan {
    id: string;
    borrowerName: string;
    startDate: string;
    endDate: string | null;
    hasDeadline: boolean;
    principal: number;
    annualInterestRate: number;
    durationMonths: number;
    paymentFrequency: PaymentFrequency;
    currency: Currency;
    status: ProjectStatus;
    interestType: InterestType;
    collected: number;
    payments: LoanPayment[];
    description?: string;
}

export interface Debt {
    id: string;
    lenderName: string;
    startDate: string;
    endDate: string | null;
    hasDeadline: boolean;
    principal: number;
    annualInterestRate: number;
    durationMonths: number;
    paymentFrequency: PaymentFrequency;
    currency: Currency;
    status: ProjectStatus;
    interestType: InterestType;
    paid: number;
    payments: LoanPayment[];
    description?: string;
}
