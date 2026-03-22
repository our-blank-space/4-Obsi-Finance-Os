import { Data, Ledger } from '../types';

/**
 * Validador estricto para nuevas transacciones ("Triple Validación")
 */
export const validateTransaction = (
    transaction: Partial<Ledger.Transaction>,
    baseCurrency: string
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. Monto > 0
    if (!transaction.amount || isNaN(transaction.amount) || transaction.amount <= 0) {
        errors.push("El monto debe ser mayor a 0.");
    }

    // 2. Categoría Obligatoria (Excepto para transferencias)
    if (transaction.type !== Ledger.TransactionType.TRANSFER) {
        if (!transaction.areaId && !transaction.area) {
            errors.push("La categoría es obligatoria.");
        }
    }

    // 3. Prevenir inyecciones en la descripción (Limpieza básica)
    if (transaction.note) {
        const hasTags = /<[^>]*>?/gm.test(transaction.note);
        if (hasTags) {
            errors.push("La descripción contiene caracteres no permitidos.");
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Verifica si un gasto dejará la cuenta en negativo (Overdraft)
 */
export const checkOverdraft = (
    amount: number,
    currentBalance: number
): { isOverdraft: boolean; remaining: number } => {
    if (!amount) return { isOverdraft: false, remaining: 0 };
    
    if (amount > currentBalance) {
        return { isOverdraft: true, remaining: currentBalance - amount };
    }
    
    return { isOverdraft: false, remaining: currentBalance - amount };
};
