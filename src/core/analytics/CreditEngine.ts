import { Loan, Debt, InterestType } from '../../types';

export const CreditEngine = {
    calculateInterest: (item: Loan | Debt): number => {
        if (item.interestType === InterestType.SIMPLE) {
            return item.principal * (item.annualInterestRate / 100 * (item.durationMonths / 12));
        }
        return 0;
    },

    calculateTotalDue: (item: Loan | Debt): number => {
        return item.principal + CreditEngine.calculateInterest(item);
    },

    calculateRemaining: (item: Loan | Debt): number => {
        const paid = 'collected' in item ? item.collected : item.paid;
        return Math.max(0, CreditEngine.calculateTotalDue(item) - (paid || 0));
    },

    estimateDebtFreeDate: (totalRemaining: number, monthlyCapacity: number, locale: string = 'es'): string | null => {
        if (totalRemaining <= 0 || monthlyCapacity <= 0) return null;
        const months = Math.ceil(totalRemaining / monthlyCapacity);
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        // Capitalize first letter of month
        const dateStr = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    },

    calculateSnowballProjection: (debts: (Loan | Debt)[], monthlyCapacity: number, currencyMultiplier: (amount: number, currency: string) => number, locale: string = 'es') => {
        const sortedDebts = [...debts].sort((a, b) =>
            CreditEngine.calculateRemaining(a) - CreditEngine.calculateRemaining(b)
        );

        let totalBalance = sortedDebts.reduce((acc, d) => acc + currencyMultiplier(CreditEngine.calculateRemaining(d), d.currency), 0);
        let currentMonth = new Date();
        const data = [{ name: 'Actual', balance: totalBalance }];

        // Simulation limit: 60 months (5 years) to avoid infinite loops
        let safety = 0;

        while (totalBalance > 0.1 && safety < 60) {
            const prevBalance = totalBalance;
            totalBalance = Math.max(0, totalBalance - monthlyCapacity);

            // Check if interest is outpacing capacity (Insolvency)
            if (totalBalance > prevBalance) {
                data.push({ name: 'Inviable', balance: totalBalance });
                break;
            }

            currentMonth.setMonth(currentMonth.getMonth() + 1);

            data.push({
                name: currentMonth.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
                balance: Math.round(totalBalance)
            });
            safety++;
        }
        return data;
    },

    // --- NEW: AMORTIZATION & ANALYSIS ---

    generateAmortizationSchedule: (item: Loan | Debt) => {
        const schedule = [];
        let principal = item.principal;
        const rate = item.annualInterestRate / 100;
        const monthlyRate = rate / 12;
        const months = item.durationMonths;

        // Cuota Fija (Método Francés Simplificado para estimación)
        // PMT = P * (r / (1 - (1 + r)^-n))
        // Si tasa es 0, cuota = P / n
        let expectedPayment = 0;
        if (rate === 0) {
            expectedPayment = item.principal / months;
        } else {
            // Si es Simple, el interés total es P*r*t. Total a pagar = P + I. Cuota = Total / n
            if (item.interestType === InterestType.SIMPLE) {
                const totalInterest = item.principal * rate * (months / 12);
                expectedPayment = (item.principal + totalInterest) / months;
            } else {
                // Compound / French (Standard Loan)
                expectedPayment = item.principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
            }
        }

        const startDate = new Date(item.startDate); // Asumimos formato YYYY-MM-DD local

        for (let i = 1; i <= months; i++) {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i);

            schedule.push({
                date: date.toISOString().split('T')[0],
                expectedPayment: expectedPayment,
                cumulativeExpected: expectedPayment * i
            });
        }

        return { schedule, expectedPayment };
    },

    analyzePaymentStatus: (item: Loan | Debt) => {
        const { schedule, expectedPayment } = CreditEngine.generateAmortizationSchedule(item);
        const today = new Date().toISOString().split('T')[0];

        // Encontrar lo que se debería haber pagado hasta hoy
        // Filtramos cuotas cuya fecha sea <= hoy
        const pastDues = schedule.filter(s => s.date <= today);
        const expectedToDate = pastDues.length > 0
            ? pastDues[pastDues.length - 1].cumulativeExpected
            : 0;

        const paidToDate = 'collected' in item ? (item.collected || 0) : (item.paid || 0);
        const diff = paidToDate - expectedToDate;

        // Threshold de tolerancia (ej: 1% de la cuota o valor fijo pequeño)
        const tolerance = expectedPayment * 0.05;

        let status: 'on_track' | 'late' | 'ahead' = 'on_track';
        if (diff < -tolerance) status = 'late';
        else if (diff > tolerance) status = 'ahead';

        return {
            status,
            expectedToDate,
            paidToDate,
            diff,
            expectedPayment
        };
    }
};