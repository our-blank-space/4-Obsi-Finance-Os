// src/hooks/useBalances.ts
import { useMemo } from 'react';
import { useFinanceData } from '../context/FinanceContext';
import { useCurrency } from './useCurrency';
import { BalanceCalculator } from '../logic/balance.calculator';
import { CurrencyMath } from '../utils/math';
import { Currency } from '../types';

export const useBalances = () => {
  // 1. Acceso granular al estado (Solo lo que afecta balances)
  const { transactions, accountRegistry } = useFinanceData();
  const { convert, baseCurrency } = useCurrency();

  // 2. Cálculo de Balances (Memoizado y Desacoplado)
  // BalanceCalculator.compute retorna un Map<ID, Map<Currency, Amount>>
  const balancesMap = useMemo(() =>
    BalanceCalculator.compute(transactions, accountRegistry),
    [transactions, accountRegistry]);

  // 3. Derivación de Estadísticas y Totales
  const stats = useMemo(() => {
    let totalInBase = 0;
    let liquidTotal = 0;
    let lockedTotal = 0;
    const chartData: { name: string, value: number }[] = [];

    balancesMap.forEach((currencies, accId) => {
      let accTotalBase = 0;

      // Obtener nombre actual del Registry para visualización
      const registryAccount = accountRegistry.find(a => a.id === accId);
      const accDisplayName = registryAccount?.name || accId;

      // Helper para identificar cuentas bloqueadas (Inversiones, Activos Fijos)
      const isLockedAccount = (name: string) =>
        /invest|inversión|cdt|stock|crypto|real_estate|propiedad/i.test(name);

      // Sumar todas las monedas de la cuenta convertidas a base
      currencies.forEach((amount, curr) => {
        const valInBase = convert(amount, curr as Currency, baseCurrency);
        accTotalBase = CurrencyMath.add(accTotalBase, valInBase);
      });

      // Acumular totales globales usando aritmética segura
      totalInBase = CurrencyMath.add(totalInBase, accTotalBase);

      if (isLockedAccount(accDisplayName)) {
        lockedTotal = CurrencyMath.add(lockedTotal, accTotalBase);
      } else {
        liquidTotal = CurrencyMath.add(liquidTotal, accTotalBase);
      }

      // Preparar datos para gráficas (filtrar ruido < 1 unidad)
      if (Math.abs(accTotalBase) > 1) {
        chartData.push({ name: accDisplayName, value: accTotalBase });
      }
    });

    return {
      // Convertimos el Map interno a Objeto plano para compatibilidad con componentes UI existentes
      balances: BalanceCalculator.toPrimitive(balancesMap),
      totalNetWorth: totalInBase,
      liquidTotal,
      lockedTotal,
      chartData: chartData.sort((a, b) => b.value - a.value)
    };
  }, [balancesMap, convert, baseCurrency, accountRegistry]);

  return stats;
};