import React from 'react';
import { Transaction } from '../../types';

export const TransactionRow = ({ transaction, onEdit, onDelete, privacyMode, getCategoryName, getAccountName }: any) => {
    return <div className="p-2 border-b text-sm">{transaction.note || 'Transaction'} - {transaction.amount}</div>;
};
