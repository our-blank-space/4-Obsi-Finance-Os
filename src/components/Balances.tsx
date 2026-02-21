// src/components/Balances.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../hooks/useCurrency';
import { useBalances } from '../hooks/useBalances';
import { BalancesAnalytics } from '../logic/balances.analytics';
// ✅ CORREGIDO: lucide-react
import { Zap, Download, ShieldAlert } from 'lucide-react';

// UI Components
import { Button } from './ui/Button';

// Sub-componentes
import { NetWorthHero } from './balances/NetWorthHero';
import { AccountGrid } from './balances/AccountGrid';
import { QuickTransferModal } from './balances/QuickTransferModal';
import { AdjustBalanceModal } from './balances/AdjustBalanceModal';
import { Transaction, TransactionType } from '../types';

const Balances: React.FC = () => {
  const { state, dispatch } = useFinance();
  const { snapshots, transactions } = state;
  const { toBase, baseCurrency } = useCurrency();
  const { balances, totalNetWorth, liquidTotal } = useBalances();
  const { t } = useTranslation();

  // --- UI STATE ---
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [transferSource, setTransferSource] = useState<string | null>(null);
  const [transferDest, setTransferDest] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [adjustData, setAdjustData] = useState<{ id: string, name: string, balance: number } | null>(null);

  // --- ANALYTICS ---
  const health = useMemo(() =>
    BalancesAnalytics.computeHealth(totalNetWorth, liquidTotal, balances, t),
    [totalNetWorth, liquidTotal, balances, t]);

  // --- HELPER: Get balance for a specific account ---
  const getAccountBalance = (balancesObj: any, accountName: string): number => {
    if (!balancesObj || !balancesObj[accountName]) return 0;

    // balancesObj[accountName] es un map de {currency: amount}
    const currencies = balancesObj[accountName];
    let total = 0;

    for (const currency in currencies) {
      // Convertir a moneda base si es necesario
      const amount = currencies[currency];
      total += toBase(amount, currency as any);
    }

    return total;
  };

  // --- HANDLERS ---
  const handleAccountClick = (acc: string) => {
    if (!isTransferMode) return;
    if (!transferSource) {
      setTransferSource(acc);
    } else if (transferSource !== acc) {
      setTransferDest(acc);
      setShowTransferModal(true);
    }
  };

  const handleTransferComplete = (t: any) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: t });
    setShowTransferModal(false);
    setIsTransferMode(false);
    setTransferSource(null);
    setTransferDest(null);
  };

  const handleAdjustComplete = (difference: number, newBalance: number) => {
    if (!adjustData) return;

    // Crear transacción de ajuste
    const type = difference > 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
    const amount = Math.abs(difference);

    const adjustmentTx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type,
      amount,
      currency: baseCurrency, // El input usa moneda base por simplicidad (o podría usar la de la cuenta)
      areaId: 'Adjustment',
      fromId: type === TransactionType.EXPENSE ? adjustData.id : 'System',
      toId: type === TransactionType.INCOME ? adjustData.id : 'System',
      from: type === TransactionType.EXPENSE ? adjustData.id : 'System',
      to: type === TransactionType.INCOME ? adjustData.id : 'System',
      area: 'Adjustment',
      note: t('bal.adjust.note') || 'Ajuste de Saldo (Reevaluado)',
      amountBase: amount,
      exchangeRateSnapshot: 1
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: adjustmentTx });
    setAdjustData(null);
  };

  return (
    <div className={`space-y-8 pb-32 animate-in fade-in max-w-6xl mx-auto font-sans ${isTransferMode ? 'cursor-crosshair' : ''}`}>

      <NetWorthHero
        total={totalNetWorth}
        liquid={liquidTotal}
        health={health}
        snapshots={snapshots}
      />

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {health.alerts.slice(0, 2).map((alert, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${alert.type === 'danger' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
              <ShieldAlert size={12} /> {alert.message}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" icon={<Download size={14} />}>{t('bal.report')}</Button>
          <button
            onClick={() => { setIsTransferMode(!isTransferMode); setTransferSource(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${isTransferMode ? 'bg-amber-500 text-white animate-pulse border-transparent shadow-lg shadow-amber-500/20' : 'bg-[var(--background-secondary)] text-[var(--text-muted)] border-[var(--background-modifier-border)]'}`}
          >
            <Zap size={16} /> {isTransferMode ? (transferSource ? t('bal.transfer_to') : t('bal.transfer_from')) : t('bal.quick_transfer')}
          </button>
        </div>
      </div>

      <AccountGrid
        balances={balances}
        onAccountClick={handleAccountClick}
        onAdjustBalance={(id: string, name: string, balance: number) => setAdjustData({ id, name, balance })}
        isTransferMode={isTransferMode}
        transferSource={transferSource}
        smartROI={(acc: string, bal: number) => BalancesAnalytics.calculateSmartROI(acc, acc, bal, transactions, toBase)}
      />

      {showTransferModal && (
        <QuickTransferModal
          isOpen={showTransferModal}
          source={transferSource!}
          target={transferDest!}
          sourceBalance={getAccountBalance(balances, transferSource!)}
          onClose={() => { setShowTransferModal(false); setIsTransferMode(false); setTransferSource(null); }}
          onConfirm={handleTransferComplete}
        />
      )}

      {adjustData && (
        <AdjustBalanceModal
          isOpen={!!adjustData}
          onClose={() => setAdjustData(null)}
          accountId={adjustData.id}
          accountName={adjustData.name}
          currentBalance={adjustData.balance}
          baseCurrency={baseCurrency as string}
          onConfirm={handleAdjustComplete}
        />
      )}
    </div>
  );
};

export default Balances;