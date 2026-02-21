// src/hooks/ui/useTradingOperations.ts
import { useState, useCallback } from 'react';
import { Trade, TradeStatus, TradingAccountType, TradingTransfer, TradeOutcome, TradeSide } from '../../types';
import { TradingEngine } from '../../logic/trading.engine';
import { useAI } from '../useAI';

interface UseTradingOperationsProps {
  trades: Trade[];
  transfers: TradingTransfer[];
  onUpdateTrades: (t: Trade[]) => void;
  onUpdateTransfers: (t: TradingTransfer[]) => void;
  activeTab: TradingAccountType;
}

import { MarketDataService } from '../../services/MarketDataService';

// ... interface ...

export const useTradingOperations = ({
  trades, transfers, onUpdateTrades, onUpdateTransfers, activeTab
}: UseTradingOperationsProps) => {
  const { isProcessing: isAiProcessing } = useAI();
  const [isMarketSyncing, setIsMarketSyncing] = useState(false);

  const isSyncing = isAiProcessing || isMarketSyncing;

  const [modals, setModals] = useState({ trade: false, transfer: false, close: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const toggleModal = (key: keyof typeof modals, value: boolean) => {
    setModals(prev => ({ ...prev, [key]: value }));
    if (!value) { setEditingId(null); setClosingId(null); }
  };

  const handleSyncPrices = async () => {
    setIsMarketSyncing(true);
    const activeTrades = trades.filter(t => t.status === TradeStatus.OPEN && t.accountType === activeTab);
    const symbols = Array.from(new Set(activeTrades.map(t => t.symbol)));

    if (symbols.length === 0) {
      setIsMarketSyncing(false);
      return;
    }

    const priceMap: Record<string, number> = {};

    // Ejecutamos en paralelo para mayor velocidad
    await Promise.all(symbols.map(async (sym) => {
      const price = await MarketDataService.getPrice(sym);
      if (price) priceMap[sym] = price;
    }));

    onUpdateTrades(trades.map(t => {
      if (t.status === TradeStatus.OPEN && priceMap[t.symbol]) {
        const currentPrice = priceMap[t.symbol];
        const pnl = TradingEngine.calculatePnL(t.side, t.entryPrice, currentPrice, t.amount, t.fee);

        // Calcular PnL % basado en el margen inicial
        const initialMargin = t.entryPrice * t.amount;
        const pnlPercentage = initialMargin > 0 ? (pnl / initialMargin) * 100 : 0;

        return {
          ...t,
          currentPrice,
          pnl,
          pnlPercentage
        };
      }
      return t;
    }));

    setIsMarketSyncing(false);
  };

  const saveTrade = (formData: any) => {
    const payload: Trade = {
      id: editingId || crypto.randomUUID(),
      ...formData,
      symbol: formData.symbol.toUpperCase(),
      status: TradeStatus.OPEN,
      outcome: TradeOutcome.OPEN,
      accountType: activeTab,
      pnl: -formData.fee, // Al abrir, el PnL inicial es la comisión negativa
      pnlPercentage: 0
    };

    if (editingId) {
      onUpdateTrades(trades.map(t => t.id === editingId ? { ...t, ...payload } : t));
    } else {
      onUpdateTrades([payload, ...trades]);
    }
    toggleModal('trade', false);
  };

  return {
    modals, toggleModal, editingId, setEditingId, closingId, setClosingId, isSyncing,
    actions: {
      saveTrade,
      syncPrices: handleSyncPrices,
      closeTrade: (price: number) => {
        const trade = trades.find(t => t.id === closingId);
        if (trade) {
          const closed = TradingEngine.closeTrade(trade, price, new Date().toISOString().split('T')[0]);
          onUpdateTrades(trades.map(t => t.id === closingId ? closed : t));
        }
        toggleModal('close', false);
      },
      deleteTrade: (id: string) => onUpdateTrades(trades.filter(t => t.id !== id)),
      transfer: (amount: number, type: 'deposit' | 'withdrawal', note: string) => {
        onUpdateTransfers([...transfers, {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          type, amount, accountType: activeTab, note
        }]);
        toggleModal('transfer', false);
      }
    }
  };
};