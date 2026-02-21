import { RecurrentTransaction, Currency, TransactionType, Frequency } from '../../types';
import { DateUtils } from '../../utils/date';

// Tipos de retorno estrictos
export interface TimelineAnalysis {
    daysRemaining: number;
    displayDate: string; // Fecha formateada lista para UI
    isOverdue: boolean;
    isToday: boolean;
    isUrgent: boolean;
    isTrialEndingSoon: boolean;
    daysUntilTrialEnd: number;
}

export interface RecurrentItemWithAnalysis extends RecurrentTransaction {
    analysis: TimelineAnalysis;
}

export const RecurrentEngine = {

    /**
     * Calcula el "Burn Rate" mensual (Gasto fijo promedio).
     * Normaliza frecuencias anuales/semanales a mensual.
     */
    calculateMonthlyBurnRate: (
        recurrents: readonly RecurrentTransaction[],
        toBase: (amt: number, curr: Currency) => number
    ): number => {
        return recurrents
            .filter(r => r.isActive)
            .reduce((total, r) => {
                // Normalización de frecuencia
                const multiplier =
                    r.frequency === 'weekly' ? 4.33 : // 52 semanas / 12 meses
                        r.frequency === 'yearly' ? 1 / 12 :
                            1;

                const val = toBase(r.amount, r.currency) * multiplier;

                // Si es ingreso (ej. salario), resta al burn rate (porque burn rate es gasto neto)
                // Si es gasto, suma.
                return r.type === TransactionType.EXPENSE
                    ? total + val
                    : total - val;
            }, 0);
    },

    /**
     * Calcula el impacto anual de una transacción recurrente.
     * Utilizado para mostrar proyecciones en las tarjetas.
     */
    calculateAnnualImpact: (amount: number, frequency: Frequency): number => {
        switch (frequency) {
            case 'weekly': return amount * 52;
            case 'monthly': return amount * 12;
            case 'yearly': return amount;
            default: return 0;
        }
    },

    /**
     * Enriquece una transacción con análisis temporal.
     * Optimizado para recibir 'today' y no recalcularlo N veces.
     */
    analyzeItem: (r: RecurrentTransaction, today: Date = DateUtils.now()): TimelineAnalysis => {
        // Normalizar fechas a medianoche para evitar discrepancias de horas
        const currentMidnight = new Date(today);
        currentMidnight.setHours(0, 0, 0, 0);

        const nextDate = new Date(`${r.nextDate}T12:00:00`); // Mediodía para evitar problemas de timezone
        const diffTime = nextDate.getTime() - currentMidnight.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Lógica de Trials
        let isTrialEndingSoon = false;
        let daysUntilTrialEnd = 0;

        if (r.isTrial && r.trialEndDate) {
            const trialEnd = new Date(`${r.trialEndDate}T12:00:00`);
            const trialDiff = trialEnd.getTime() - currentMidnight.getTime();
            daysUntilTrialEnd = Math.ceil(trialDiff / (1000 * 60 * 60 * 24));
            isTrialEndingSoon = daysUntilTrialEnd <= 5 && daysUntilTrialEnd >= 0;
        }

        return {
            daysRemaining,
            displayDate: DateUtils.formatDisplay(r.nextDate),
            isOverdue: daysRemaining < 0,
            isToday: daysRemaining === 0,
            isUrgent: daysRemaining > 0 && daysRemaining <= 3,
            isTrialEndingSoon,
            daysUntilTrialEnd
        };
    },

    /**
     * Genera la lista ordenada para el Timeline.
     */
    getTimeline: (recurrents: RecurrentTransaction[]): RecurrentItemWithAnalysis[] => {
        const today = DateUtils.now();
        return recurrents
            .filter(r => r.isActive)
            .map(r => ({
                ...r,
                analysis: RecurrentEngine.analyzeItem(r, today)
            }))
            .sort((a, b) => a.analysis.daysRemaining - b.analysis.daysRemaining);
    }
};