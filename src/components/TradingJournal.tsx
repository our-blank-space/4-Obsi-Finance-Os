import React, { useState, useMemo } from 'react';
import { Trade, TradingAccountType, TradingTransfer, TradeStatus, TradeOutcome } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useTradingMath } from '../hooks/useTradingMath';
import { useTradingOperations } from '../hooks/ui/useTradingOperations';
import { TradingEngine } from '../logic/trading.engine';
import { JournalLogic } from '../logic/journal.logic';

// Componentes
import { TradingDashboard } from './trading/TradingDashboard';
import { ActiveTradesList } from './trading/ActiveTradesList';
import { TradeHistoryTable } from './trading/TradeHistoryTable';
import { TradeGallery } from './trading/TradeGallery';
import { TradeFilters, FilterState } from './trading/TradeFilters';
import { TradeFormModal } from './trading/modals/TradeFormModal';
import { SmartCloseModal } from './trading/modals/SmartCloseModal';

// UI
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { NumericInput } from './ui/NumericInput';
import { Input } from './ui/Input';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Banknote, LayoutGrid, List as ListIcon, SearchX } from 'lucide-react';

interface Props {
  trades: Trade[];
  transfers: TradingTransfer[];
  onUpdateTrades: (trades: Trade[]) => void;
  onUpdateTransfers: (transfers: TradingTransfer[]) => void;
}

const TradingJournal: React.FC<Props> = ({
  trades, transfers, onUpdateTrades, onUpdateTransfers
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TradingAccountType>(TradingAccountType.TRADING);

  // Lógica encapsulada
  const math = useTradingMath(trades, transfers, activeTab);
  const ops = useTradingOperations({ trades, transfers, onUpdateTrades, onUpdateTransfers, activeTab });

  // Estado local para elementos UI simples
  const [transferForm, setTransferForm] = useState({ amount: '', type: 'deposit' as 'deposit' | 'withdrawal', note: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');

  // FILTERS STATE
  const [filters, setFilters] = useState<FilterState>({
    search: '', strategy: 'ALL', outcome: 'ALL', dateRange: 'ALL'
  });

  // FILTER LOGIC
  const filteredTrades = useMemo(() => {
    return JournalLogic.filterTrades(math.closed, filters);
  }, [math.closed, filters]);

  const strategies = useMemo(() => JournalLogic.getStrategies(math.closed), [math.closed]);

  // Save Wrapper: Puente entre el Modal Inteligente y el Almacenamiento
  const handleSaveTrade = (trade: Trade) => {
    if (ops.editingId) {
      onUpdateTrades(trades.map(t => t.id === trade.id ? trade : t));
    } else {
      onUpdateTrades([trade, ...trades]);
    }
    ops.toggleModal('trade', false);
  };

  // Handler INTELIGENTE con Mitosis
  const handleConfirmClose = (price: number, fees: number, note: string, closeAmount: number) => {
    const trade = trades.find(t => t.id === ops.closingId);
    if (!trade) return;

    // Validamos si es cierre total (con un pequeño margen de error para floats)
    const isFullClose = Math.abs(trade.amount - closeAmount) < 0.0000001;

    if (isFullClose) {
      // --- CIERRE TOTAL ---
      const closedTrade = TradingEngine.closeTrade(trade, price, new Date().toISOString().split('T')[0], fees, note);
      onUpdateTrades(trades.map(t => t.id === trade.id ? closedTrade : t));
    } else {
      // --- MITOSIS (Cierre Parcial) ---
      const [closedPart, remainingPart] = TradingEngine.splitTrade(
        trade, closeAmount, price, fees, new Date().toISOString().split('T')[0], note
      );

      const filteredTrades = trades.filter(t => t.id !== trade.id);
      onUpdateTrades([...filteredTrades, remainingPart, closedPart]);
    }

    ops.toggleModal('close', false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans max-w-7xl mx-auto">

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight italic text-[var(--text-normal)] uppercase">
            {t('trade.title')}
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium">{t('trade.subtitle')}</p>
        </div>

        <div className="flex bg-[var(--background-secondary)] p-1.5 rounded-2xl border border-[var(--background-modifier-border)]">
          {[TradingAccountType.TRADING, TradingAccountType.INVESTMENT].map(type => (
            <button key={type} onClick={() => setActiveTab(type)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === type
                ? 'bg-[var(--interactive-accent)] text-white shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-normal)] hover:bg-[var(--background-modifier-hover)]'
                }`}>
              {type === TradingAccountType.TRADING ? t('trade.tab.trading') : t('trade.tab.invest')}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Visual */}
      <TradingDashboard
        equity={math.equity}
        allocation={math.allocation}
        strategies={math.strategies}
        stats={math.stats}
        isSyncing={ops.isSyncing}
        onSync={ops.actions.syncPrices}
        onTransfer={() => ops.toggleModal('transfer', true)}
        onNewTrade={() => { ops.setEditingId(null); ops.toggleModal('trade', true); }}
      />

      {/* Listados */}
      <div className="space-y-8">
        <ActiveTradesList
          trades={math.active}
          onClosePosition={(id) => { ops.setClosingId(id); ops.toggleModal('close', true); }}
          onEdit={(id) => { ops.setEditingId(id); ops.toggleModal('trade', true); }}
          onDelete={(id) => setDeleteId(id)}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-end pl-2">
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              {t('trade.history')}
            </h3>

            {/* View Toggles */}
            <div className="flex bg-[var(--background-secondary)] p-1 rounded-lg border border-[var(--background-modifier-border)]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-[var(--background-modifier-hover)] text-[var(--text-normal)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
                title={t('trade.view.list')}
              >
                <ListIcon size={14} />
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`p-1.5 rounded transition-all ${viewMode === 'gallery' ? 'bg-[var(--background-modifier-hover)] text-[var(--text-normal)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
                title={t('trade.view.gallery')}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          <TradeFilters
            filters={filters}
            onFilterChange={setFilters}
            strategies={strategies}
          />

          {filteredTrades.length > 0 ? (
            <>
              {viewMode === 'list' && (
                <TradeHistoryTable trades={filteredTrades} onDelete={setDeleteId} onEdit={(id) => { ops.setEditingId(id); ops.toggleModal('trade', true); }} />
              )}
              {viewMode === 'gallery' && (
                <TradeGallery trades={filteredTrades} onEdit={(id) => { ops.setEditingId(id); ops.toggleModal('trade', true); }} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[var(--background-modifier-border)] rounded-3xl bg-[var(--background-secondary)]/30">
              <div className="p-4 bg-[var(--background-modifier-form-field)] rounded-full mb-3 text-[var(--text-muted)]">
                <SearchX size={24} />
              </div>
              <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">
                {t('trade.empty.history')}
              </p>
              <p className="text-[var(--text-faint)] text-[10px] mt-1 font-medium">
                {t('trade.empty.history_desc')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TradeFormModal
        isOpen={ops.modals.trade}
        onClose={() => ops.toggleModal('trade', false)}
        onSave={handleSaveTrade}
        initialData={trades.find(t => t.id === ops.editingId)}
        accountBalance={math.stats.balance}
        activeTab={activeTab}
      />

      <SmartCloseModal
        isOpen={ops.modals.close}
        onClose={() => ops.toggleModal('close', false)}
        onConfirm={handleConfirmClose}
        trade={trades.find(t => t.id === ops.closingId) || null}
      />

      <Modal isOpen={ops.modals.transfer} onClose={() => ops.toggleModal('transfer', false)} title={t('trade.modal.transfer.title')} size="sm" icon={<Banknote size={24} />}>
        <form onSubmit={(e) => { e.preventDefault(); ops.actions.transfer(parseFloat(transferForm.amount), transferForm.type, transferForm.note); }} className="space-y-6">
          <div className="flex bg-[var(--background-modifier-form-field)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
            <button type="button" onClick={() => setTransferForm({ ...transferForm, type: 'deposit' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${transferForm.type === 'deposit' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)]'}`}>{t('trade.modal.transfer.deposit')}</button>
            <button type="button" onClick={() => setTransferForm({ ...transferForm, type: 'withdrawal' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${transferForm.type === 'withdrawal' ? 'bg-rose-600 text-white' : 'text-[var(--text-muted)]'}`}>{t('trade.modal.transfer.withdrawal')}</button>
          </div>
          <NumericInput label={t('trade.form.size')} value={transferForm.amount} onValueChange={v => setTransferForm({ ...transferForm, amount: v })} autoFocus />
          <Input label={t('trade.modal.close.note_label')} value={transferForm.note} onChange={e => setTransferForm({ ...transferForm, note: e.target.value })} placeholder={t('label.note')} />
          <ModalFooter><Button type="submit" fullWidth>{t('trade.modal.transfer.exec')}</Button></ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) ops.actions.deleteTrade(deleteId); setDeleteId(null); }}
        title={t('trade.delete.title')}
        description={t('trade.delete.desc')}
      />
    </div>
  );
};

export default TradingJournal;