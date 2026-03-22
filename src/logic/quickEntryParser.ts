// src/logic/quickEntryParser.ts
import { FinanceCategory } from '../types/core';

export interface QuickEntryResult {
    amount: number;
    categoryId: string | null;
    categoryName: string | null;
    categoryType?: 'income' | 'expense' | 'invest' | 'mixed';
    description: string;
}

export const parseQuickEntry = (
    input: string, 
    categories: FinanceCategory[]
): QuickEntryResult | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Regex to match amount at the beginning. Optional rest.
    const amountMatch = trimmed.match(/^([\d.,]+)(?:\s+(.*))?$/);
    if (!amountMatch) return null;

    const amountStr = amountMatch[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return null;

    const rest = (amountMatch[2] || "").trim();
    
    // Find category
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    let categoryType: 'income' | 'expense' | 'invest' | 'mixed' | undefined = undefined;
    let description = rest;

    // Sort categories by length descending to match longest first
    const sortedCategories = [...categories].sort((a, b) => b.name.length - a.name.length);

    for (const cat of sortedCategories) {
        const regex = new RegExp(`^${cat.name}\\b`, 'i');
        const match = rest.match(regex);
        if (match) {
            categoryId = cat.id;
            categoryName = cat.name;
            categoryType = cat.type;
            description = rest.substring(match[0].length).trim();
            break;
        }
    }

    return {
        amount,
        categoryId,
        categoryName,
        categoryType,
        description: description || "Sin detalle"
    };
};

/**
 * Parses only the amount at the beginning of the string and takes the rest as description.
 */
export const parseAmountAndDescription = (input: string): { amount: number; description: string } | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^([\d.,]+)(?:\s+(.*))?$/);
    if (!match) return null;

    const amountStr = match[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return null;

    return {
        amount,
        description: (match[2] || "").trim() || "Sin detalle"
    };
};
