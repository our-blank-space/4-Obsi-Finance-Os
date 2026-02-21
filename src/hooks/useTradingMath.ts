// src/hooks/useTradingMath.ts
import { useMemo } from 'react';
import { Trade, TradeStatus, TradeOutcome, TradingTransfer, TradingAccountType } from '../types';

export const useTradingMath = (trades: Trade[], transfers: TradingTransfer[], activeTab: TradingAccountType) => {
    const active = useMemo(() => trades.filter(t => t.accountType === activeTab && t.status === TradeStatus.OPEN), [trades, activeTab]);
    const closed = useMemo(() => trades.filter(t => t.accountType === activeTab && t.status === TradeStatus.CLOSED), [trades, activeTab]);
    const filteredTransfers = useMemo(() => transfers.filter(t => t.accountType === activeTab), [transfers, activeTab]);

    const stats = useMemo(() => {
        const deposits = filteredTransfers.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
        const withdrawals = filteredTransfers.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
        const realizedPnL = closed.reduce((s, t) => s + t.pnl, 0);
        const balance = deposits - withdrawals + realizedPnL;

        // --- Cálculo de Win Rate ---
        const wins = closed.filter(t => t.outcome === TradeOutcome.WIN).length;
        const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

        // --- Cálculo de Profit Factor ---
        let grossProfit = 0;
        let grossLoss = 0;

        closed.forEach(t => {
            if (t.pnl > 0) grossProfit += t.pnl;
            else grossLoss += Math.abs(t.pnl);
        });

        // Si no hay pérdidas, el profit factor es infinito (o el profit total si hay ganancias)
        const profitFactor = grossLoss === 0
            ? (grossProfit > 0 ? Infinity : 0)
            : (grossProfit / grossLoss);

        // --- Cálculo de RIESGO ABIERTO (Open Risk) ---
        // Suma del dinero arriesgado en posiciones activas (Distancia al SL * Cantidad)
        const activeRisk = trades
            .filter(t => t.accountType === activeTab && t.status === TradeStatus.OPEN && t.stopLoss)
            .reduce((sum, t) => {
                const riskPerUnit = Math.abs(t.entryPrice - (t.stopLoss || t.entryPrice));
                return sum + (riskPerUnit * t.amount);
            }, 0);

        return {
            balance,
            realizedPnL,
            winRate,
            profitFactor,
            openRisk: activeRisk // Nuevo campo
        };
    }, [filteredTransfers, closed, trades, activeTab]);

    const allocation = useMemo(() => {
        const map: Record<string, number> = {};
        active.forEach(t => {
            map[t.symbol] = (map[t.symbol] || 0) + (t.amount * (t.currentPrice || t.entryPrice));
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [active]);

    const strategies = useMemo(() => {
        const map: Record<string, number> = {};
        closed.forEach(t => {
            map[t.strategy] = (map[t.strategy] || 0) + t.pnl;
        });
        return Object.entries(map).map(([strategy, pnl]) => ({ strategy, pnl }));
    }, [closed]);

    const equity = useMemo(() => {
        let running = 0;
        return [...filteredTransfers.map(t => ({ d: t.date, v: t.type === 'deposit' ? t.amount : -t.amount })),
        ...closed.map(t => ({ d: t.exitDate || t.date, v: t.pnl }))]
            .sort((a, b) => a.d.localeCompare(b.d))
            .map(item => ({ date: item.d, balance: (running += item.v) }));
    }, [filteredTransfers, closed]);

    return { active, closed, stats, allocation, strategies, equity };
};