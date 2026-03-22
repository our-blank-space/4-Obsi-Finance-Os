// src/types/assets.ts
import { Currency } from './core';

export type ProjectStatus = 'idea' | 'diligence' | 'active' | 'closed' | 'sold' | 'archived' | 'completed';

export interface AssetTransaction {
    id: string;
    assetId: string;
    date: string;
    description: string;
    amount: number;
    currency: Currency;
    type: 'cost' | 'revenue' | 'maintenance' | 'improvement' | 'tax' | 'loan_payment' | 'investment' | 'expense' | 'withdrawal';
    isRecurrent: boolean;
    category?: string;
    documents?: string[];
}

export interface AssetLiability {
    linkedDebtId: string; // ID from Debts module
    allocationPercentage: number; // How much of the debt was for this asset (usually 100%)
}

export interface Asset {
    id: string;
    name: string;
    category: string; // Real Estate, Vehicle, Technology, etc.
    type: string; // Subtype if needed (e.g. Motorcycle)
    currency: Currency;
    liquidity: 'liquid' | 'semi-liquid' | 'illiquid';

    // Status & Logic
    status: ProjectStatus;
    isIncomeGenerating: boolean;
    isDepreciating: boolean;

    // Valuation
    purchaseDate: string;
    purchasePrice: number;
    currentValue: number;
    residualValue?: number; // Estimated value at end of life

    // Depreciation Params
    usefulLifeYears?: number;
    depreciationRate?: number; // Annual %

    // Activity
    transactions: AssetTransaction[];
    entries?: AssetTransaction[]; // Legacy alias
    liability?: AssetLiability;

    // Valuation & History
    valuationHistory?: Array<{ date: string; value: number }>;
    yieldProfile?: {
        expectedAmount: number;
        nextPaymentDate?: string;
        frequency: 'monthly' | 'quarterly' | 'annually' | 'custom' | string;
        autoLog?: boolean;
    };

    // Legacy / Metadata
    notes?: string;
    location?: string;
    wikilink?: string;
    score?: number; // For ideas
    images?: string[];
    documents?: string[];

    updatedAt?: string;
}

// Re-export for compatibility during refactor, but deprecated
export type AssetProject = Asset;
export type AssetEntry = AssetTransaction;
export type AssetType = string;
