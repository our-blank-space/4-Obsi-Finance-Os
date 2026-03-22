import { Currency, AssetProject, TransactionType } from '../../types';
import { RecurrentTransaction } from '../../types/ledger';
import { BalanceProjectionInput, ProjectionMonth } from '../../types/analytics';
import { RecurrentEngine } from './RecurrentEngine';

export const BalanceProjectionEngine = {

  project(input: BalanceProjectionInput): ProjectionMonth[] {
    const timeline: ProjectionMonth[] = [];

    let currentBalance = input.initialBalance;
    let currentMonth = input.startDate;

    for (let i = 0; i < input.horizonMonths; i++) {

      const burnRate = RecurrentEngine.calculateMonthlyBurnRate(
        input.recurrents,
        input.toBase
      );

      const income = Math.max(0, -burnRate);
      const expense = Math.max(0, burnRate);
      const netFlow = income - expense;

      const balanceStart = currentBalance;
      const balanceEnd = balanceStart + netFlow;

      const alerts: Array<{ type: string; code: string; message: string; }> = [];

      if (balanceEnd < 0) {
        alerts.push({
          type: 'critical',
          code: 'negative_balance',
          message: 'El balance proyectado cae por debajo de cero.'
        });
      }

      const monthData: ProjectionMonth = {
        month: currentMonth,
        income,
        expense,
        netFlow,
        burnRate,
        balanceStart,
        balanceEnd,
        alerts
      };

      timeline.push(monthData);

      currentBalance = balanceEnd;
      currentMonth = incrementMonth(currentMonth);
    }

    return timeline;
  }
};

// --- helpers ---

function incrementMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1, 1); // JS months are 0-indexed
  date.setMonth(date.getMonth() + 1);
  const nextY = date.getFullYear();
  const nextM = date.getMonth() + 1;
  return `${nextY}-${nextM.toString().padStart(2, '0')}`;
}