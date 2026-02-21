// src/core/factory.ts
import { Transaction, RecurrentTransaction, TransactionType, Currency, TransactionSentiment } from '../types';
import { DateUtils } from '../utils/date';

/**
 * TransactionFactory
 * Encapsula la lógica de creación de transacciones y cálculo de fechas.
 * Esto desacopla la UI de las reglas de negocio financiero.
 */
export const TransactionFactory = {

    /**
     * Crea una transacción con garantías de inmutabilidad financiera (V3).
     * Calcula amountBase y fija el exchangeRateSnapshot en T0.
     */
    create: (data: Partial<Transaction>, exchangeRates: Record<string, number>, baseCurrency: string): Transaction => {
        const currency = data.currency || (baseCurrency as Currency);

        // Determinar tasa de cambio para snapshot
        // Si currency == base, tasa es 1.
        let rate = 1;
        if (currency !== baseCurrency) {
            rate = exchangeRates[currency] || 1;
        }

        const amount = data.amount || 0;

        return {
            id: data.id || crypto.randomUUID(),
            date: data.date || new Date().toISOString().slice(0, 10),
            type: data.type || TransactionType.EXPENSE,
            amount: amount,
            currency: currency,

            // Campos Legacy/UI
            from: data.from || 'default',
            to: data.to || 'none',
            area: data.area || 'uncategorized',

            // Normalización V3
            areaId: data.areaId || 'uncategorized',
            fromId: data.fromId || 'default-account',
            toId: data.toId,

            note: data.note || '',
            sentiment: data.sentiment,
            aiInsight: data.aiInsight,
            wikilink: data.wikilink,
            tags: data.tags || [],
            recurrentId: data.recurrentId,

            // ✅ CÁLCULO DE SEGURIDAD PARA LOS PRÓXIMOS 5 AÑOS
            amountBase: amount * rate,
            exchangeRateSnapshot: rate,

            // Reconciliación opcional
            reconciliation: data.reconciliation
        };
    },

    /**
     * Genera una transacción real a partir de una plantilla recurrente
     * y calcula la próxima fecha de cobro.
     */
    fromRecurrent: (rec: RecurrentTransaction): { transaction: Transaction, nextDate: string } => {

        // 1. Generación de ID (Centralizada)
        const newId = crypto.randomUUID();

        // 2. Creación del Objeto Transacción
        const transaction: Transaction = {
            id: newId,
            date: DateUtils.getToday(), // Usa la fecha actual del sistema
            type: rec.type,
            amount: rec.amount,
            currency: rec.currency,
            from: rec.account,
            to: 'none',
            area: rec.area,

            areaId: rec.areaId || 'uncategorized',
            fromId: rec.accountId || 'default-account',

            // Nota enriquecida
            note: `Suscripción: ${rec.name}${rec.isTrial ? ' (Fin de Prueba)' : ''}${rec.isVariable ? ' (Variable)' : ''}`,
            wikilink: '',
            // Auto-tagging estructural
            tags: ['recurrent', rec.isTrial ? 'trial' : ''].filter(Boolean),
            recurrentId: rec.id,

            // Valores por defecto seguros
            amountBase: rec.amount,
            exchangeRateSnapshot: 1
        };

        // 3. Cálculo de la próxima fecha (Lógica de negocio pura)
        const nextDateObj = new Date(`${rec.nextDate}T12:00:00`); // T12 para evitar problemas de timezone

        if (rec.frequency === 'custom' && rec.intervalDays) {
            nextDateObj.setDate(nextDateObj.getDate() + rec.intervalDays);
        } else {
            switch (rec.frequency) {
                case 'weekly':
                    nextDateObj.setDate(nextDateObj.getDate() + 7);
                    break;

                case 'monthly':
                    // --- CORRECCIÓN DE FECHAS (Lógica de Anclaje) ---

                    // 1. Determinar el día objetivo (Ancla vs Día actual)
                    // Si existe anchorDay, lo usamos para preservar la fecha original (ej: 31).
                    // Si no, usamos el día de la fecha actual como fallback.
                    const targetDay = rec.anchorDay || nextDateObj.getDate();

                    // 2. Reseteamos al día 1 para avanzar de mes sin errores de desbordamiento
                    nextDateObj.setDate(1);
                    nextDateObj.setMonth(nextDateObj.getMonth() + 1);

                    // 3. Calculamos cuántos días tiene el nuevo mes (Día 0 del siguiente mes)
                    const daysInNextMonth = new Date(nextDateObj.getFullYear(), nextDateObj.getMonth() + 1, 0).getDate();

                    // 4. Restauramos el día: El menor entre el original y el máximo posible del mes
                    // (Ej: Si el target es 31 y el nuevo mes tiene 28, nos quedamos en 28)
                    nextDateObj.setDate(Math.min(targetDay, daysInNextMonth));
                    break;

                case 'yearly':
                    nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
                    break;
            }
        }

        // Formato ISO YYYY-MM-DD
        const nextDate = nextDateObj.toISOString().split('T')[0];

        return { transaction, nextDate };
    }
};