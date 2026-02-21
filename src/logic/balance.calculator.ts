import { Transaction, TransactionType, Currency } from '../types';
import { CurrencyMath } from '../utils/math';

// Estructura optimizada: Mapa de Cuentas -> Mapa de Monedas -> Valor
export type BalanceMap = Map<string, Map<Currency, number>>;

export class BalanceCalculator {

  /**
   * Calcula los balances actuales iterando las transacciones una sola vez (O(N)).
   */
  static compute(transactions: Transaction[], accountRegistry: any[]): BalanceMap {
    const balances: BalanceMap = new Map();

    // 1. Mapeo de Nombres a IDs para consolidación
    const nameToIdMap = new Map<string, string>();
    accountRegistry.forEach(acc => {
      // Normalizar claves y preparar balances
      if (acc.id) {
        balances.set(acc.id, new Map());
        if (acc.name) nameToIdMap.set(acc.name.toLowerCase(), acc.id);
      }
    });

    // 2. Single Pass Loop con Normalización
    for (const t of transactions) {
      // Normalizar: Si la transacción usa un nombre, buscar su ID en el registro
      // Usamos el ID si existe, o el ID encontrado por mapa, o fallback al valor original
      const fromKey = t.fromId || nameToIdMap.get(t.from?.toLowerCase()) || t.from;
      const toKey = t.toId || nameToIdMap.get(t.to?.toLowerCase()) || t.to;

      // Modificamos una copia “virtual” de los keys para pasar al helper
      // (Ojo: applyTransaction espera los campos de la transacción. Mejor refactorizar applyTransaction
      // para que acepte los keys resueltos, o pasar la lógica aquí.)

      // Refactor in-line para usar keys resueltos:
      this.applyTransactionWithKeys(balances, t, fromKey, toKey);
    }

    return balances;
  }

  private static applyTransactionWithKeys(map: BalanceMap, t: Transaction, fromKey?: string, toKey?: string) {
    const update = (key?: string, amount?: number, currency?: Currency) => {
      if (!amount || !currency || !key || key === 'none') return;

      if (!map.has(key)) map.set(key, new Map());

      const accBalances = map.get(key)!;
      const currentVal = accBalances.get(currency) || 0;
      const newVal = CurrencyMath.add(currentVal, amount);
      accBalances.set(currency, newVal);
    };

    switch (t.type) {
      case TransactionType.INCOME:
      case TransactionType.REVALUATION:
        update(fromKey, t.amount, t.currency);
        break;

      case TransactionType.EXPENSE:
        update(fromKey, -t.amount, t.currency);
        break;

      case TransactionType.TRANSFER:
        update(fromKey, -t.amount, t.currency);
        update(toKey, t.amount, t.currency);
        break;
    }
  }

  // Deprecated wrapper for backward compatibility if needed, but we replaced the main call
  private static applyTransaction(map: BalanceMap, t: Transaction, accounts: any[]) {
    // No-op or legacy fallback
  }

  /**
   * Convierte el Mapa complejo a un objeto simple para consumo de UI/Gráficas.
   * ✅ CORREGIDO: Retorna Partial<Record...> porque no todas las cuentas tienen todas las monedas.
   */
  static toPrimitive(map: BalanceMap): Record<string, Partial<Record<Currency, number>>> {
    const obj: Record<string, Partial<Record<Currency, number>>> = {};

    map.forEach((currencies, acc) => {
      const accObj: Partial<Record<Currency, number>> = {};

      currencies.forEach((val, curr) => {
        accObj[curr] = val;
      });

      obj[acc] = accObj;
    });

    return obj;
  }
}