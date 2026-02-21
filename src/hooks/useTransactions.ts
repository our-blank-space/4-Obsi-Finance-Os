import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ShardManager } from '../services/ShardManager';
import { Transaction } from '../types';

export const useTransactions = (selectedMonth: string) => {
    const { state, dispatch, api } = useFinance();
    const shardManager = useMemo(() => new ShardManager(api), [api]);

    useEffect(() => {
        const hydrate = async () => {
            // Verificar si los datos de ese mes ya están en el estado global
            const hasData = state.transactions.some(t => t.date.startsWith(selectedMonth));

            if (!hasData) {
                // Determine year vs month loading? 
                // ShardManager loads by month: .finance-db/ledger/YYYY-MM.json
                const oldData = await shardManager.loadShard(selectedMonth);

                if (oldData && oldData.length > 0) {
                    dispatch({ type: 'HYDRATE_SHARD', payload: oldData });
                }
            }
        };
        hydrate();
        return () => {
            // Cleanup: Si cambiamos de mes, podríamos querer descargar el anterior para ahorrar memoria.
            // Ojo: Esto podría causar refetching si el user vuelve. 
            // Para "Production Readiness" priorizamos estabilidad de memoria en sesiones largas.
            if (!selectedMonth.startsWith(new Date().getFullYear().toString())) {
                dispatch({ type: 'UNLOAD_OLD_DATA', payload: selectedMonth });
            }
        };
    }, [selectedMonth, state.transactions, shardManager, dispatch]);

    // Devolvemos los datos directamente del estado global (Reactividad Total)
    const transactions = useMemo(() =>
        state.transactions.filter(t => t.date.startsWith(selectedMonth)),
        [state.transactions, selectedMonth]
    );

    return { transactions };
};
