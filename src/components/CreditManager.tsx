import React, { useState, useMemo } from 'react';
import { Loan, Debt } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { CreditEngine } from '../core/analytics/CreditEngine';
import { CreditCard } from './credit/CreditCard';
import { Plus, HandCoins, Receipt, AlertCircle, Calendar, TrendingDown, Target, Save, X, Search } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Modal, ModalFooter } from './ui/Modal';
import { Input, Select } from './ui/Input';
import { NumericInput } from './ui/NumericInput';
import { InterestType } from '../types';

interface Props {
  items: (Loan | Debt)[];
  onUpdate: (items: any[]) => void;
  mode: 'lending' | 'debt';
}

export const CreditManager: React.FC<Props> = ({ items = [], onUpdate, mode }) => {
  const { format, baseCurrency, toBase } = useCurrency();
  const { t, language } = useTranslation();

  // State for Deletion (Full Item)
  const [deleteItem, setDeleteItem] = useState<Loan | Debt | null>(null);

  // State for Editing/Creating
  const [editingItem, setEditingItem] = useState<Loan | Debt | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State for View Mode & Search
  const [view, setView] = useState<'active' | 'history'>('active');
  const [search, setSearch] = useState('');

  // --- ANALYTICS & FILTERING ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Status Filter
      const isCompleted = item.status === 'completed';
      if (view === 'active' && isCompleted) return false;
      if (view === 'history' && !isCompleted) return false;

      // 2. Search Filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const name = 'borrowerName' in item ? item.borrowerName : item.lenderName;
        return name.toLowerCase().includes(query) ||
          item.principal.toString().includes(query) ||
          (item.startDate && item.startDate.includes(query));
      }

      return true;
    });
  }, [items, view, search]);

  const totalRemainingBase = useMemo(() => {
    // Only calculate remaining for ACTIVE items to show current debt load
    const activeOnly = items.filter(i => i.status !== 'completed');
    return activeOnly.reduce((acc, item) => acc + toBase(CreditEngine.calculateRemaining(item), item.currency), 0);
  }, [items, toBase]);

  const freedomDate = useMemo(() => {
    const MONTHLY_CAPACITY = 1500000;
    return CreditEngine.estimateDebtFreeDate(totalRemainingBase, MONTHLY_CAPACITY, language);
  }, [totalRemainingBase, language]);

  // --- HANDLERS ---
  // ... (Keep existing handlers: handleSave, handleAddPayment, openNew, openEdit) ...

  // NOTE: We need to copy the existing handlers here because replace_file_content works on ranges. 
  // However, since I am replacing a large chunk to insert the State and Filters at the top,
  // I should be careful not to delete the handlers if I request a replacement of the whole component body.
  // Instead, I will target the specific area where `activeItems` was defined and replace it with `filteredItems` logic + Search UI.

  const handleSave = (data: any) => {
    if (editingItem) {
      // EDIT MODE
      onUpdate(items.map(item => {
        if (item.id !== editingItem.id) return item;
        return {
          ...item,
          ...data,
          // Si editamos, recalculamos si está pagado o no
          status: CreditEngine.calculateRemaining({ ...item, ...data }) <= 0 ? 'completed' : 'active'
        };
      }));
    } else {
      // CREATE MODE
      const newItem: any = {
        id: crypto.randomUUID(),
        principal: data.principal,
        currency: data.currency,
        annualInterestRate: data.interest,
        interestType: data.type,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        durationMonths: data.durationMonths,
        paymentFrequency: data.paymentFrequency,
        payments: [],
        endDate: null,
        hasDeadline: false
      };

      if (mode === 'lending') {
        newItem.borrowerName = data.name;
        newItem.collected = 0;
      } else {
        newItem.lenderName = data.name;
        newItem.paid = 0;
      }

      onUpdate([...items, newItem]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleAddPayment = (itemId: string, amount: number) => {
    onUpdate(items.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item };
      const newPayment = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], amount };
      updated.payments = [...(item.payments || []), newPayment];

      if ('collected' in updated) {
        updated.collected = (updated.collected || 0) + amount;
      } else if ('paid' in updated) {
        updated.paid = (updated.paid || 0) + amount;
      }

      const remaining = CreditEngine.calculateRemaining(updated);
      if (remaining <= 0) updated.status = 'completed';

      return updated;
    }));
  };

  const handleItemUpdate = (updatedItem: Loan | Debt) => {
    onUpdate(items.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const openNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: Loan | Debt) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-5xl mx-auto font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--text-normal)] uppercase italic flex items-center gap-3">
            {mode === 'lending' ? <HandCoins className="text-purple-500" /> : <Receipt className="text-rose-500" />}
            {mode === 'lending' ? t('credit.lending.title') : t('credit.debt.title')}
          </h1>
          {/* TABS VIEW */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('active')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-[var(--interactive-accent)] text-[var(--text-on-accent)]' : 'bg-[var(--background-secondary)] text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
            >
              {t('asset.tab.active')}
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-[var(--interactive-accent)] text-[var(--text-on-accent)]' : 'bg-[var(--background-secondary)] text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
            >
              {t('common.history')}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* SEARCH BAR */}
            <div className="relative group w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--interactive-accent)] transition-colors" size={14} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-full py-2 pl-9 pr-4 text-xs font-bold text-[var(--text-normal)] focus:outline-none focus:border-[var(--interactive-accent)] transition-all"
              />
            </div>

            <Button onClick={openNew} icon={<Plus size={18} />} variant={mode === 'lending' ? 'primary' : 'danger'}>
              {t('btn.add')}
            </Button>
          </div>

          {mode === 'debt' && freedomDate && view === 'active' && (
            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <TrendingDown size={12} className="text-emerald-500" />
              {t('credit.liberty_date')}: <span className="font-bold text-[var(--text-normal)]">{freedomDate}</span>
            </div>
          )}
        </div>
      </header>

      {/* SNOWBALL CHART SECTION (Only for Debt & Active View) */}
      {mode === 'debt' && view === 'active' && totalRemainingBase > 0 && (
        <section className="bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-primary)] border border-[var(--background-modifier-border)] p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
          {/* ... Chart Content Same as Before ... */}
          <div className="flex justify-between items-start mb-6 z-10 relative">
            <div>
              <h3 className="text-lg font-black italic flex items-center gap-2">
                <Target className="text-[var(--interactive-accent)]" size={20} /> {t('credit.snowball_strategy')}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">
                {t('credit.payment_projection', { amt: format(1500000, baseCurrency) })}
              </p>
            </div>
            {freedomDate && (
              <div className="text-right bg-[var(--interactive-accent)]/10 px-4 py-2 rounded-xl border border-[var(--interactive-accent)]/20">
                <div className="text-[9px] font-black uppercase text-[var(--interactive-accent)] mb-0.5 opacity-80">{t('credit.debt_free_goal')}</div>
                <div className="text-xl font-mono font-black text-[var(--text-normal)]">{freedomDate}</div>
              </div>
            )}
          </div>

          <div className="h-[200px] w-full z-10 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <AreaChart data={CreditEngine.calculateSnowballProjection(items.filter(i => i.status !== 'completed'), 1500000, toBase, language).map(d => ({
                ...d,
                name: d.name === 'Actual' ? t('common.actual') : (d.name === 'Inviable' ? t('common.inviable') : d.name)
              }))}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--background-secondary)', borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
                  formatter={(val: number) => [format(val, baseCurrency), t('credit.remaining_balance')]}
                />
                <Area type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={3} fill="url(#colorBal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] bg-[var(--background-secondary)]/30 rounded-[2rem] border-2 border-dashed border-[var(--background-modifier-border)]">
            <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs opacity-50">{t('common.no_records')}</p>
            {search && <p className="text-xs mt-2 opacity-50">"{search}"</p>}
          </div>
        ) : (
          filteredItems.map(item => (
            <CreditCard
              key={item.id}
              item={item}
              mode={mode}
              format={format}
              onAddPayment={handleAddPayment}
              onItemUpdate={handleItemUpdate}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteItem(item)}
            />
          ))
        )}
      </div>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          if (deleteItem) {
            onUpdate(items.filter(i => i.id !== deleteItem.id));
            setDeleteItem(null);
          }
        }}
        title={t('common.delete_confirm')}
        description={deleteItem ?
          `${t('credit.delete_desc')} 
           \n\n📌 ${mode === 'lending' ? (deleteItem as any).borrowerName : (deleteItem as any).lenderName}
           \n💰 ${format((deleteItem as any).principal, (deleteItem as any).currency)}`
          : ''}
        intent="delete_record"
      />

      {/* FORM MODAL (CREATE / EDIT) */}
      <CreditFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        mode={mode}
        baseCurrency={baseCurrency}
      />
    </div>
  );
};

// --- SUBCOMPONENTES ---

const CreditFormModal = ({ isOpen, onClose, onSave, initialData, mode, baseCurrency }: any) => {
  const { t } = useTranslation();

  // Initialize form with data or defaults
  const [form, setForm] = useState({
    name: '',
    principal: '',
    currency: baseCurrency,
    interest: '0',
    duration: '12',
    type: InterestType.SIMPLE
  });

  // Reset/Populate form when opening
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: mode === 'lending' ? initialData.borrowerName : initialData.lenderName,
          principal: initialData.principal.toString(),
          currency: initialData.currency,
          interest: initialData.annualInterestRate.toString(),
          duration: (initialData.durationMonths || 12).toString(),
          type: initialData.interestType
        });
      } else {
        setForm({ name: '', principal: '', currency: baseCurrency, interest: '0', duration: '12', type: InterestType.SIMPLE });
      }
    }
  }, [isOpen, initialData, mode, baseCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.principal) return;
    onSave({
      name: form.name,
      principal: parseFloat(form.principal.replace(/\./g, '').replace(',', '.')),
      currency: form.currency,
      interest: parseFloat(form.interest),
      durationMonths: parseInt(form.duration) || 12,
      paymentFrequency: 'monthly', // Default for MVP
      type: form.type
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={initialData
        ? (mode === 'lending' ? t('credit.edit_loan') : t('credit.edit_debt'))
        : (mode === 'lending' ? t('credit.new_loan') : t('credit.new_debt'))}
      icon={initialData ? <Save size={24} /> : <Plus size={24} />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={mode === 'lending' ? t('credit.borrower') : t('credit.lender')}
          placeholder={mode === 'lending' ? t('credit.placeholder_borrower') : t('credit.placeholder_lender')}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumericInput
            label={t('credit.form.principal')}
            value={form.principal}
            onValueChange={v => setForm({ ...form, principal: v })}
            currency={form.currency}
          />
          <Select
            label={t('common.currency')}
            options={['COP', 'USD']}
            value={form.currency}
            onChange={e => setForm({ ...form, currency: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('credit.form.interest_rate')}
            type="number" step="0.1"
            value={form.interest}
            onChange={e => setForm({ ...form, interest: e.target.value })}
          />
          <Input
            label={t('common.months')} // "Meses" typically
            type="number"
            value={form.duration}
            onChange={e => setForm({ ...form, duration: e.target.value })}
          />
          <Select
            label={t('credit.form.interest_type')}
            options={[
              { label: t('credit.interest.simple'), value: InterestType.SIMPLE },
              { label: t('credit.interest.compound'), value: InterestType.COMPOUND },
              { label: t('credit.interest.none'), value: InterestType.NONE }
            ]}
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as InterestType })}
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">{t('btn.cancel')}</Button>
          <Button type="submit">{initialData ? t('btn.save') : t('btn.create')}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};