import { useState, useEffect } from 'react';
import { LegacyFilterState } from '../../types/filters'; // Ruta corregida
import { LocalStorageFilterStorage, FilterStorage, DEFAULT_FILTERS } from '../../storage/TransactionFilterStorage';

export const useTransactionFilters = (storage: FilterStorage = new LocalStorageFilterStorage()) => {
    const [filters, setFilters] = useState<LegacyFilterState>(() => {
        const saved = storage.load();
        return saved || DEFAULT_FILTERS;
    });

    useEffect(() => {
        storage.save(filters);
    }, [filters, storage]);

    return { filters, setFilters };
};