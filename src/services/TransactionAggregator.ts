// src/services/TransactionAggregator.ts
import { Transaction, TransactionType, GlobalSummary, Budget, FinanceObsidianAPI } from '../types';

export class TransactionAggregator {
    private api: FinanceObsidianAPI;
    private summaryPath = '.finance-db/core/summaries.json';

    constructor(api: FinanceObsidianAPI) {
        this.api = api;
    }

    /**
     * Procesa transacciones y actualiza métricas de salud financiera.
     * Retorna el sumario actualizado sin guardarlo (PersistenceService se encarga).
     */
    public async updateSummaries(activeTransactions: Transaction[], currentBudgets: Budget[]): Promise<GlobalSummary> {
        // Cargar sumario existente o crear uno nuevo
        let summaries = await this.api.readJson<GlobalSummary>(this.summaryPath);
        if (!summaries) summaries = this.createEmptySummary();

        const currentMonthKey = new Date().toISOString().slice(0, 7);

        // 1. Identificar Meses Afectados por las Transacciones Activas
        const monthsInBatch = new Set(activeTransactions.map(t => t.date.substring(0, 7)));

        // Asegurar que el mes actual sea procesado incluso si no hay transacciones, para guardar el snapshot de presupuesto
        monthsInBatch.add(currentMonthKey);

        // 2. Procesar Meses
        monthsInBatch.forEach(month => {
            const isPresent = month === currentMonthKey;

            // Si el mes no existe en el registro, inicializarlo
            if (!summaries.monthlyBreakdown[month]) {
                summaries.monthlyBreakdown[month] = {
                    income: 0, expense: 0, savings: 0, count: 0,
                    budgetSnapshots: isPresent ? this.mapToSnapshots(currentBudgets) : undefined
                };
            } else if (isPresent) {
                // Actualizar snapshot mes actual
                summaries.monthlyBreakdown[month].budgetSnapshots = this.mapToSnapshots(currentBudgets);
            }

            // Si el mes está en el batch de transacciones, reseteamos contadores para recalcular
            if (activeTransactions.some(t => t.date.startsWith(month))) {
                summaries.monthlyBreakdown[month].income = 0;
                summaries.monthlyBreakdown[month].expense = 0;
                summaries.monthlyBreakdown[month].count = 0;
            }
        });

        // 3. Sumatoria
        activeTransactions.forEach(tx => {
            const m = tx.date.substring(0, 7);
            const s = summaries.monthlyBreakdown[m];
            if (s) {
                // Usar amountBase si existe (V3), fallback a amount
                const val = tx.amountBase !== undefined ? tx.amountBase : tx.amount;

                if (tx.type === TransactionType.INCOME) s.income += val;
                if (tx.type === TransactionType.EXPENSE) s.expense += val;
                s.count++;
            }
        });

        // 4. Recalcular Ahorros
        monthsInBatch.forEach(month => {
            const s = summaries.monthlyBreakdown[month];
            if (s) s.savings = s.income - s.expense;
        });

        // 5. Cálculo de Métricas Globales
        const allMonths = Object.values(summaries.monthlyBreakdown);
        let totalExp = 0;
        let totalInc = 0;

        allMonths.forEach(m => {
            totalExp += m.expense;
            totalInc += m.income;
        });

        // Burn Rate (últimos 12 meses)
        const sortedMonths = Object.keys(summaries.monthlyBreakdown).sort();
        const last12 = sortedMonths.slice(-12);
        let burnTotal = 0;
        let burnCount = 0;
        last12.forEach(m => {
            burnTotal += summaries.monthlyBreakdown[m].expense;
            burnCount++;
        });

        summaries.avgMonthlyBurnRate = burnCount > 0 ? burnTotal / burnCount : 0;
        summaries.savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

        summaries.totalIncome = totalInc;
        summaries.totalExpense = totalExp;

        summaries.lastUpdated = new Date().toISOString();

        return summaries;
    }

    // Helper público para que Persistence pueda inyectar métricas de liquidez
    public calculateRunway(summary: GlobalSummary, liquidity: number): GlobalSummary {
        summary.netWorth = liquidity;
        summary.runwayMonths = summary.avgMonthlyBurnRate > 0
            ? liquidity / summary.avgMonthlyBurnRate
            : (summary.totalExpense === 0 ? 999 : 0);
        return summary;
    }

    private mapToSnapshots(budgets: Budget[]): any[] {
        return budgets.map(b => ({
            areaId: b.areaId || 'unknown',
            amount: b.amount,
            currency: b.currency,
            type: b.type
        }));
    }

    private createEmptySummary(): GlobalSummary {
        return {
            totalIncome: 0,
            totalExpense: 0,
            netWorth: 0,
            avgMonthlyBurnRate: 0,
            savingsRate: 0,
            runwayMonths: 0,
            monthlyBreakdown: {},
            lastUpdated: new Date().toISOString()
        };
    }
}
