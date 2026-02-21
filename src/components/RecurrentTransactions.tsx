import React from 'react';
import { RecurrentTransaction, Transaction, FinanceAccount, FinanceCategory } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { useRecurrentAnalytics } from '../hooks/ui/useRecurrentAnalytics';
import { useRecurrentOperations } from '../hooks/ui/useRecurrentOperations';

// Sub-componentes
import { RecurrentCard } from './recurrent/RecurrentCard';
import { RecurrentTimeline } from './recurrent/RecurrentTimeline';
import { RecurrentFormModal } from './recurrent/RecurrentFormModal';
import { VariableExecutionModal } from './recurrent/VariableExecutionModal';
import { Button } from './ui/Button';
import { Repeat, Flame, Plus } from 'lucide-react';

interface Props {
  recurrents: RecurrentTransaction[];
  onUpdate: (recurrents: RecurrentTransaction[]) => void;
  onExecute: (transaction: RecurrentTransaction, amountOverride?: number) => void;
  accounts: FinanceAccount[];
  areas: FinanceCategory[];
}

const RecurrentTransactions: React.FC<Props> = ({ recurrents, onUpdate, onExecute, accounts, areas }) => {
  const { format, baseCurrency, toBase } = useCurrency();
  const { t } = useTranslation();

  // 1. Analytics (Pure Data)
  const { burnRate, timeline, pendingVariableCount } = useRecurrentAnalytics(recurrents, toBase);

  // 2. Operations (Handlers & UI State)
  const ops = useRecurrentOperations({
    recurrents,
    onUpdate,
    onExecuteTransaction: onExecute
  });

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-6xl mx-auto font-sans">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-normal)] uppercase italic flex items-center gap-2">
            <Repeat className="text-[var(--interactive-accent)]" /> {t('rec.title')}
            {pendingVariableCount > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </h1>
          <p className="text-[var(--text-muted)] text-sm">{t('rec.subtitle')}</p>
        </div>

        <div className="bg-[var(--background-secondary)] p-4 rounded-2xl border flex items-center gap-4 shadow-sm">
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest flex items-center gap-1 justify-end">
              <Flame size={12} className="text-orange-500" /> {t('rec.burn_rate')}
            </div>
            <div className="text-2xl font-mono font-black">
              {format(burnRate, baseCurrency)}<span className="text-xs text-[var(--text-muted)]">{t('rec.per_month')}</span>
            </div>
          </div>
          <Button onClick={ops.openNew} icon={<Plus size={18} />}>{t('rec.new')}</Button>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: CARDS GRID */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurrents.length === 0 && (
            <div className="col-span-full p-10 text-center border-dashed border-2 rounded-3xl opacity-50">
              <p>{t('rec.empty')}</p>
            </div>
          )}

          {recurrents.map(r => (
            <RecurrentCard
              key={r.id}
              item={r}
              format={format}
              t={t}
              onExecute={ops.requestExecution}
              onToggle={ops.toggleStatus}
              onDelete={ops.handleDelete}
              onEdit={ops.openEdit}
            />
          ))}
        </div>

        {/* RIGHT: TIMELINE */}
        <RecurrentTimeline
          items={timeline}
          t={t}
          onExecute={ops.requestExecution}
        />
      </div>

      {/* MODALS LAYER */}

      {/* Modal de CRUD (Crear/Editar) */}
      <RecurrentFormModal
        isOpen={ops.isFormOpen}
        initialData={ops.editingItem}
        onClose={ops.closeForm}
        onSave={ops.handleSave}
        accounts={accounts}
        areas={areas}
      />

      {/* Modal de Ejecución Variable */}
      <VariableExecutionModal
        item={ops.variableExecItem}
        onClose={ops.closeVariableExec}
        onConfirm={ops.confirmExecution}
      />

    </div>
  );
};

export default RecurrentTransactions;