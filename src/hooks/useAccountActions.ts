import { useCallback } from 'react';
import { useFinanceData, useFinanceDispatch } from '../context/FinanceContext';
import { useTaxonomy } from './useTaxonomy';
import { FinanceAccount, Currency } from '../types/core';

export function useAccountActions() {
    const { accountRegistry, baseCurrency } = useFinanceData();
    const dispatch = useFinanceDispatch();
    const { renameEntity, checkDependencies } = useTaxonomy();

    /** CREATE — valida trim y unicidad */
    const createAccount = useCallback((name: string, currency?: string): string | null => {
        const trimmed = name.trim();
        if (!trimmed) return 'El nombre no puede estar vacío.';
        if (accountRegistry.some(a => a.name.toLowerCase() === trimmed.toLowerCase() && !a.isArchived)) {
            return 'Ya existe una cuenta con ese nombre.';
        }

        const newAccount: FinanceAccount = {
            id: crypto.randomUUID(),
            name: trimmed,
            currency: (currency || baseCurrency) as Currency,
            isArchived: false,
        };

        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: { accountRegistry: [...accountRegistry, newAccount] },
        });

        return null;
    }, [accountRegistry, baseCurrency, dispatch]);

    /** RENAME — usa renameEntity del useTaxonomy para migrar transacciones */
    const renameAccount = useCallback((oldName: string, newName: string): string | null => {
        const trimmed = newName.trim();
        if (!trimmed) return 'El nombre no puede estar vacío.';
        if (trimmed === oldName) return null; // Sin cambio, no error
        if (accountRegistry.some(a => a.name.toLowerCase() === trimmed.toLowerCase() && !a.isArchived)) {
            return 'Ya existe una cuenta con ese nombre.';
        }
        renameEntity('account', oldName, trimmed);
        return null;
    }, [accountRegistry, renameEntity]);

    /** EDIT FULL DETAILS — atómico */
    const updateAccountDetails = useCallback((id: string, name: string, currency: string, type: 'liquid' | 'invest'): string | null => {
        const trimmed = name.trim();
        if (!trimmed) return 'El nombre no puede estar vacío.';
        
        const existing = accountRegistry.find(a => a.name.toLowerCase() === trimmed.toLowerCase() && a.id !== id && !a.isArchived);
        if (existing) return 'Ya existe una cuenta con ese nombre.';

        dispatch({
            type: 'UPDATE_ACCOUNT_DETAILS',
            payload: { id, updates: { name: trimmed, currency: currency as Currency, type } }
        });

        return null;
    }, [accountRegistry, dispatch]);

    /** ARCHIVE — soft delete (preserva historial) */
    const archiveAccount = useCallback((id: string) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                accountRegistry: accountRegistry.map(a =>
                    a.id === id ? { ...a, isArchived: true } : a
                ),
            },
        });
    }, [accountRegistry, dispatch]);

    /** RESTORE — desarchiva una cuenta */
    const restoreAccount = useCallback((id: string) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                accountRegistry: accountRegistry.map(a =>
                    a.id === id ? { ...a, isArchived: false } : a
                ),
            },
        });
    }, [accountRegistry, dispatch]);

    /** DELETE — eliminación permanente del registro */
    const deleteAccount = useCallback((id: string) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                accountRegistry: accountRegistry.filter(a => a.id !== id),
            },
        });
    }, [accountRegistry, dispatch]);

    /** Cuenta dependencias de transacciones (para advertencia de borrado) */
    const getDependencies = useCallback((name: string) => {
        return checkDependencies('account', name);
    }, [checkDependencies]);

    return { createAccount, renameAccount, updateAccountDetails, archiveAccount, restoreAccount, deleteAccount, getDependencies };
}
