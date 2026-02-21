// src/types/trading.ts
import { Currency } from './core';

export enum TradeSide {
    BUY = 'buy',
    SELL = 'sell'
}

export enum TradeStatus {
    OPEN = 'open',
    CLOSED = 'closed'
}

export enum TradeOutcome {
    WIN = 'win',
    LOSS = 'loss',
    BREAKEVEN = 'breakeven',
    OPEN = 'open'
}

export enum TradingAccountType {
    TRADING = 'trading',
    INVESTMENT = 'investment'
}

export interface TradingTransfer {
    id: string;
    date: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    accountType: TradingAccountType;
    note?: string;
}

export interface Trade {
    id: string;
    date: string;
    exitDate?: string;
    symbol: string;
    market: string;
    strategy: string;
    side: TradeSide;
    status: TradeStatus;
    entryPrice: number;
    exitPrice: number | null;
    currentPrice: number | null;
    amount: number;
    fee: number;
    currency: Currency;
    pnl: number;
    pnlPercentage: number;
    outcome: TradeOutcome;
    accountType: TradingAccountType;
    stopLoss?: number;
    takeProfit?: number;
    notes?: string;
    chartLink?: string;
    rMultiple?: number;
    parentTradeId?: string;
}
