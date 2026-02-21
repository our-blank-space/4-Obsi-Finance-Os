// src/logic/trading.engine.ts
import { Trade, TradeSide, TradeOutcome, TradeStatus } from '../types';

export const TradingEngine = {
  calculatePnL: (side: TradeSide, entry: number, exit: number, amount: number, fee: number) => {
    const grossPnL = side === TradeSide.BUY
      ? (exit - entry) * amount
      : (entry - exit) * amount;
    return grossPnL - fee;
  },

  determineOutcome: (pnl: number): TradeOutcome => {
    if (pnl > 0) return TradeOutcome.WIN;
    if (pnl < 0) return TradeOutcome.LOSS;
    return TradeOutcome.BREAKEVEN;
  },

  calculatePositionSize: (balance: number, entry: number, stopLoss: number, riskPercent: number) => {
    if (balance <= 0 || isNaN(entry) || isNaN(stopLoss) || entry === stopLoss) return 0;
    const riskAmount = balance * (riskPercent / 100);
    const priceDiff = Math.abs(entry - stopLoss);
    return riskAmount / priceDiff;
  },

  closeTrade: (trade: Trade, exitPrice: number, exitDate: string, additionalFees: number = 0, note?: string): Trade => {
    const totalFee = trade.fee + additionalFees;
    const pnl = TradingEngine.calculatePnL(trade.side, trade.entryPrice, exitPrice, trade.amount, totalFee);
    const invested = trade.entryPrice * trade.amount;
    const initialRisk = trade.stopLoss ? Math.abs(trade.entryPrice - trade.stopLoss) * trade.amount : 0;

    return {
      ...trade,
      status: TradeStatus.CLOSED,
      exitPrice,
      exitDate,
      fee: totalFee,
      pnl,
      pnlPercentage: invested > 0 ? (pnl / invested) * 100 : 0,
      outcome: TradingEngine.determineOutcome(pnl),
      notes: note ? `${trade.notes || ''}\n[Cierre]: ${note}` : trade.notes,
      rMultiple: initialRisk > 0 ? pnl / initialRisk : 0
    };
  },

  /**
   * Divide un trade para cierre parcial manteniendo integridad histórica.
   * Retorna [ParteCerrada, ParteRestante]
   */
  splitTrade: (originalTrade: Trade, closeAmount: number, closePrice: number, closeFees: number, closeDate: string, note?: string): [Trade, Trade] => {
    // 1. Validar integridad
    if (closeAmount >= originalTrade.amount) throw new Error("Use closeTrade instead of splitTrade for full closure");

    // 2. Calcular proporción
    const ratio = closeAmount / originalTrade.amount;
    const partialEntryFee = originalTrade.fee * ratio;
    const remainingEntryFee = originalTrade.fee - partialEntryFee;

    const netPnL = TradingEngine.calculatePnL(originalTrade.side, originalTrade.entryPrice, closePrice, closeAmount, partialEntryFee + closeFees);
    const riskPortion = originalTrade.stopLoss ? Math.abs(originalTrade.entryPrice - originalTrade.stopLoss) * closeAmount : 0;

    // 3. Trade Cerrado (Hijo)
    const closedPart: Trade = {
      ...originalTrade,
      id: crypto.randomUUID(), // Nuevo ID vital
      parentTradeId: originalTrade.id, // ✅ Audit Trail: Heredar ID del padre
      amount: closeAmount,
      status: TradeStatus.CLOSED,
      exitPrice: closePrice,
      exitDate: closeDate,
      fee: partialEntryFee + closeFees,
      pnl: netPnL,
      pnlPercentage: (netPnL / (originalTrade.entryPrice * closeAmount)) * 100,
      outcome: TradingEngine.determineOutcome(netPnL),
      notes: `${originalTrade.notes || ''}\n[Sistema]: Parcial cerrado (${closeAmount}U). ${note || ''}`,
      rMultiple: riskPortion > 0 ? netPnL / riskPortion : 0
    };

    // 4. Trade Restante (Padre modificado)
    const remainingPart: Trade = {
      ...originalTrade,
      amount: originalTrade.amount - closeAmount,
      fee: remainingEntryFee,
      pnl: -remainingEntryFee,
    };

    return [closedPart, remainingPart];
  }
};