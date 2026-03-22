import React from 'react';

export const TransactionEmptyState = ({ onClear }: any) => {
    return <div className="p-4 text-center text-gray-500">No transactions found <button onClick={onClear}>Clear filters</button></div>;
};
