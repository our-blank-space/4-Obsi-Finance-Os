// src/selectors/custodialSelectors.ts
import { CustodialAccount, Currency, CustodialTransactionType } from '../types';

// Calculate the balance for a single custodial account.
export const calculateCustodialAccountBalance = (
    account: CustodialAccount,
    toBaseCurrency: (amount: number, currency: Currency) => number 
): number => {
    if (!account) return 0;

    return account.transactions.reduce((balance, transaction) => {
        // Use account.currency as transactions inherit it
        const amountInBase = toBaseCurrency(transaction.amount, account.currency); 
        
        switch (transaction.type) {
            case CustodialTransactionType.DEPOSIT:
            case CustodialTransactionType.INTEREST:
            case CustodialTransactionType.ADJUSTMENT:
                return balance + amountInBase;
            case CustodialTransactionType.WITHDRAWAL:
            case CustodialTransactionType.EXPENSE:
                return balance - amountInBase;
            default:
                return balance;
        }
    }, 0);
};

// Calculate the total balance across all custodial accounts.
export const calculateTotalCustodialBalance = (
    accounts: CustodialAccount[],
    toBaseCurrency: (amount: number, currency: Currency) => number
): number => {
    return accounts.reduce((total, account) => {
        return total + calculateCustodialAccountBalance(account, toBaseCurrency);
    }, 0);
};