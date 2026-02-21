import React, { useState } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, CheckCircle2, AlertOctagon, Edit2, Trash2 } from 'lucide-react';
import { Budget, Currency, BudgetType, FinanceCategory } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { useFinance } from '../context/FinanceContext';
import { useBudgetMonitor, BudgetAnalysis } from '../hooks/useBudgetMonitor';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { Select } from './ui/Input';
import { NumericInput } from './ui/NumericInput';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { FormattingUtils } from '../utils/formatting';
import { BudgetInspectorModal } from './modals/BudgetInspectorModal';

// --- MAIN COMPONENT ---

export const Budgets = () => {
  const { state, dispatch } = useFinance();
  const { t } = useTranslation();
  const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));
  const { income, expenses, summary, status } = useBudgetMonitor(viewMonth);

  const handleSave = (budget: Budget) => {
    // Validación de Integridad Referencial
    if (!budget.areaId) {
      // Fallback o error visual
      return;
    }

    // Check existence
    const exists = state.budgets.some(b => b.id === budget.id);
    if (exists) {
      dispatch({ type: 'UPDATE_BUDGET', payload: budget });
    } else {
      dispatch({ type: 'ADD_BUDGET', payload: budget });
    }
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-6xl mx-auto font-sans">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--background-modifier-border)] pb-6">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-2">
                <Target className="text-[var(--interactive-accent)]" /> {t('bud.title')}
              </h1>
              <input
                type="month"
                value={viewMonth}
                onChange={e => setViewMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-[var(--text-muted)] border-none outline-none cursor-pointer hover:text-[var(--text-normal)]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* KPI: Cobertura de Vida (Ingresos / Gastos) */}
      <HealthWidget summary={summary} runway={state.summaries?.runwayMonths || 0} />

      {status === 'no-budget-history' ? (
        <div className="p-12 text-center opacity-50 border-2 border-dashed border-[var(--background-modifier-border)] rounded-3xl">
          <h3 className="text-xl font-black uppercase text-[var(--text-muted)]">{t('bud.no_history_title')}</h3>
          <p className="text-sm mt-2">{t('bud.no_history_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BudgetSection
            title={t('bud.income_goals')}
            type={BudgetType.INCOME}
            items={income}
            categories={state.categoryRegistry}
            onSave={handleSave}
            onDelete={handleDelete}
            monthProgress={summary.monthProgress}
          />
          <BudgetSection
            title={t('bud.expense_limits')}
            type={BudgetType.EXPENSE}
            items={expenses}
            categories={state.categoryRegistry}
            onSave={handleSave}
            onDelete={handleDelete}
            monthProgress={summary.monthProgress}
            isExpense={true}
          />
        </div>
      )}
    </div>
  );
};

// --- SUBCOMPONENTS (Clean Architecture Implementation) ---

const HealthWidget = ({ summary, runway }: { summary: any, runway: number }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <MetricCard
        title={t('bud.health.coverage')}
        value={summary.coverage > 100 ? '> 100x' : `${summary.coverage.toFixed(2)}x`}
        subtext={summary.isSustainable ? t('bud.health.sustainable') : t('bud.health.deficit')}
        status={summary.isSustainable ? 'success' : 'danger'}
      />
      <MetricCard
        title={t('bud.health.runway')}
        value={runway > 99 ? `> 99 ${t('bud.health.months')}` : `${runway.toFixed(1)} ${t('bud.health.months')}`}
        icon={<TrendingUp size={16} />}
      />
      <MetricCard
        title={t('bud.health.progress')}
        value={`${(summary.monthProgress).toFixed(0)}%`}
        subtext={t('bud.health.elapsed')}
        status="neutral"
      />
    </div>
  );
};

const BudgetSection = ({ title, type, items, categories, onSave, onDelete, monthProgress, isExpense }: any) => {
  const { format, baseCurrency } = useCurrency();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Budget | null>(null);
  const [inspectedItem, setInspectedItem] = useState<BudgetAnalysis | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    areaId: '',
    amount: '',
    currency: baseCurrency as Currency
  });

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ areaId: '', amount: '', currency: baseCurrency });
    setIsModalOpen(true);
  };

  const openEdit = (item: Budget) => {
    setEditingItem(item);
    setFormData({
      areaId: item.areaId,
      amount: item.amount.toString(),
      currency: item.currency
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = FormattingUtils.parseInputToNumber(formData.amount);
    if (!formData.areaId || amount <= 0) return;

    const cat = categories.find((c: FinanceCategory) => c.id === formData.areaId);

    const payload: Budget = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      areaId: formData.areaId,
      area: cat?.name || 'Unknown',
      amount: amount,
      currency: formData.currency,
      type: type
    };

    onSave(payload);
    setIsModalOpen(false);
  };

  // Filter categories: Only show those matching the section type (Income/Expense) 
  // AND not already used (unless editing current)
  const availableCategories = categories.filter((c: FinanceCategory) => {
    const typeMatch = !c.type || c.type === 'mixed' || c.type === (isExpense ? 'expense' : 'income');
    if (!typeMatch) return false;

    // Filter duplicates
    if (editingItem && editingItem.areaId === c.id) return true;
    const exists = items.some((i: Budget) => i.areaId === c.id);
    return !exists;
  });

  const isIncome = type === BudgetType.INCOME;
  const HeaderIcon = isIncome ? TrendingUp : AlertTriangle;
  const headerColor = isIncome ? "text-emerald-500" : "text-rose-500";

  return (
    <section className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
          <HeaderIcon size={14} className={headerColor} /> {title}
        </h2>
        <Button onClick={openCreate} size="sm" variant="ghost" icon={<Plus size={14} />}>{t('btn.add')}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] italic text-center py-8 border border-dashed border-[var(--background-modifier-border)] rounded-xl">
            {t('bud.empty')}
          </div>
        )}
        {items.map((item: BudgetAnalysis) => (
          <BudgetCard
            key={item.id}
            data={item}
            format={format}
            monthProgress={monthProgress}
            onClick={() => setInspectedItem(item)}
            onEdit={(e: any) => { e.stopPropagation(); openEdit(item); }}
            onDelete={(e: any) => { e.stopPropagation(); setDeleteId(item.id); }}
          />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? t('bud.form.edit') : t('bud.form.new')} icon={<Target size={20} />}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('bud.form.category')}
            value={formData.areaId}
            onChange={e => setFormData({ ...formData, areaId: e.target.value })}
            options={availableCategories.map((c: FinanceCategory) => ({ value: c.id, label: c.name }))}
            placeholder={t('bud.form.select')}
          />
          <div className="grid grid-cols-2 gap-4">
            <NumericInput
              label={t('bud.form.amount')}
              value={formData.amount}
              onValueChange={v => setFormData({ ...formData, amount: v })}
              currency={formData.currency}
            />
            <Select label={t('bud.form.currency')} options={['COP', 'USD', 'EUR']} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })} />
          </div>
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('btn.cancel')}</Button>
            <Button type="submit">{t('btn.save')}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <BudgetInspectorModal isOpen={!!inspectedItem} onClose={() => setInspectedItem(null)} budgetData={inspectedItem} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }} title={t('bud.delete_confirm_title')} description={t('bud.delete_confirm_desc')} intent="delete_record" />
    </section>
  );
};

// --- LEAF COMPONENTS (Reused for consistent aesthetics) ---

const MetricCard = ({ title, value, subtext, status, icon }: any) => {
  let color = 'text-[var(--text-normal)]';
  if (status === 'success') color = 'text-emerald-500';
  if (status === 'danger') color = 'text-rose-500';

  return (
    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] flex flex-col justify-between">
      <div className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 flex justify-between">
        {title}
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {subtext && <div className="text-[10px] text-[var(--text-muted)] mt-1">{subtext}</div>}
    </div>
  );
};

const BudgetCard = ({ data, format, monthProgress, onClick, onEdit, onDelete }: any) => {
  const { t } = useTranslation();
  const { status, barColor } = data;
  const isIncome = data.type === BudgetType.INCOME;

  // Icon Mapping
  // Ensure icons are imported or available. AlertOctagon, AlertTriangle, CheckCircle2 are imported.
  const StatusIcon = status === 'critical' ? AlertOctagon : status === 'warning' ? AlertTriangle : CheckCircle2;

  let statusTextColor = 'text-emerald-500';
  if (status === 'critical') statusTextColor = 'text-rose-500';
  if (status === 'warning') statusTextColor = 'text-amber-500';
  if (status === 'success') statusTextColor = 'text-emerald-500';

  return (
    <div onClick={onClick} className="bg-[var(--background-secondary)] border p-4 rounded-2xl relative group hover:border-[var(--text-normal)] cursor-pointer shadow-sm transition-all border-[var(--background-modifier-border)]">

      {/* Action Buttons (Hover) */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-[var(--background-primary)] rounded-lg shadow-sm border border-[var(--background-modifier-border)]">
        <button onClick={onEdit} className="p-1.5 hover:bg-[var(--background-modifier-hover)] rounded-l-lg"><Edit2 size={12} /></button>
        <div className="w-[1px] bg-[var(--background-modifier-border)] h-full"></div>
        <button onClick={onDelete} className="p-1.5 hover:text-rose-500 rounded-r-lg"><Trash2 size={12} /></button>
      </div>

      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold uppercase text-[var(--text-normal)] truncate w-32 md:w-48">{data.area}</h3>
        </div>
        <div className={statusTextColor}>
          <StatusIcon size={16} />
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-xl font-mono font-black ${statusTextColor}`}>{format(data.spent, data.currency)}</span>
        <span className="text-[10px] text-[var(--text-muted)]">/ {format(data.amount, data.currency)}</span>
      </div>

      <div className="relative h-2 w-full bg-[var(--background-primary)] rounded-full overflow-hidden border border-[var(--background-modifier-border)]">
        <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--text-normal)] opacity-30 z-20" style={{ left: `${monthProgress}%` }} />
        <div className={`absolute top-0 bottom-0 left-0 h-full ${barColor}`} style={{ width: `${Math.min(100, data.percentage)}%` }} />
      </div>

      <div className="mt-2 text-[10px] font-mono text-[var(--text-muted)] flex justify-between">
        <span>{data.percentage.toFixed(0)}%</span>
        <span>{t('bud.card.rest', { val: format(data.remaining, data.currency) })}</span>
      </div>
    </div>
  );
};

export default Budgets;