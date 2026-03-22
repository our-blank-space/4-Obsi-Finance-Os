import { useState } from 'react';
import { LegacyFilterState } from '../../types/filters';
import { DEFAULT_FILTERS } from '../../storage/TransactionFilterStorage';

export const useTransactionFilters = () => {
    const [filters, setFilters] = useState<LegacyFilterState>(DEFAULT_FILTERS);
    return { filters, setFilters };
};
