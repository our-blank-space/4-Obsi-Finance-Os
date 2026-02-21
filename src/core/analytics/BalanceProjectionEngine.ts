import { Currency, RecurrentTransaction, AssetProject, TransactionType } from '../../types';
import { BalanceProjectionInput, ProjectionMonth } from '../../types/analytics';
import { RecurrentEngine } from './RecurrentEngine';

export const BalanceProjectionEngine = {

  project(input: BalanceProjectionInput): ProjectionMonth[] {
    const timeline: ProjectionMonth[] = [];

    let currentBalance = input.initialBalance;
    let currentMonth = input.startDate;

    for (let i = 0; i < input.months; i++) {

      const burnRate = RecurrentEngine.calculateMonthlyBurnRate(
        input.recurrents,
        input.toBase
      );

      const income = Math.max(0, -burnRate);
      const expense = Math.max(0, burnRate);
      const netFlow = income - expense;

      const balanceStart = currentBalance;
      const balanceEnd = balanceStart + netFlow;

      const alerts = [];

      if (balanceEnd < 0) {
        alerts.push({
          type: 'critical',
          code: 'negative_balance',
          message: 'El balance proyectado cae por debajo de cero.'
        });
      }

      timeline.push({
        month: currentMonth,
        income,
        expense,
        netFlow,
        burnRate,
        balanceStart,
        balanceEnd,
        alerts
      });

      currentBalance = balanceEnd;
      currentMonth = incrementMonth(currentMonth);
    }

    return timeline;
  }
};

// --- helpers ---

function incrementMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m, 1);
  return date.toISOString().slice(0, 7);
}