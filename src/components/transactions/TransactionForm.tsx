import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { SelectStyled } from '../ui/SelectStyled';
import { NumericInput } from '../ui/NumericInput';
import { Button } from '../ui/Button';
import { ModalFooter } from '../ui/Modal';
import { TransactionType } from '../../types';
import { useObsidianLink } from '../../hooks/useObsidian';
import { useFinance } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useBalances } from '../../hooks/useBalances';
import { validateTransaction } from '../../logic/validators';
import { FileText, AlertTriangle } from 'lucide-react';
import { generateUUID } from '../../utils/uuid';
import { useCurrency } from '../../hooks/useCurrency';

export const TransactionForm = ({ initialData, initialType, onSave, onCancel }: any) => {
  const { createTransactionNote } = useObsidianLink();
  const { state } = useFinance();
  const { t } = useTranslation();
  const { balances } = useBalances();
  const { convert, baseCurrency: baseCurr } = useCurrency(); // alias para no colisionar con state.baseCurrency
  const { baseCurrency, accountRegistry, categoryRegistry } = state;

  // Options from Registries - Clean implementation (no fallbacks needed after MigrationManager)
  const accountOptions = accountRegistry.map(acc => ({ value: acc.id, label: acc.name }));
  const areaOptions = categoryRegistry.map(cat => ({ value: cat.id, label: cat.name }));

  const [formData, setFormData] = useState(initialData || {
    date: new Date().toISOString().slice(0, 10),
    type: initialType || TransactionType.EXPENSE,
    amount: '',
    fromId: accountRegistry[0]?.id || '',
    areaId: categoryRegistry[0]?.id || '',
    // Legacy mapping (maintained for notes/ledger)
    from: accountRegistry[0]?.name || '',
    area: categoryRegistry[0]?.name || '',
    note: '',
    currency: baseCurrency,
    toId: '',
    status: 'cleared'
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [overdraftWarning, setOverdraftWarning] = useState<string | null>(null);

  // Sync Legacy Fields on ID Change
  useEffect(() => {
    if (formData.fromId) {
      const acc = accountRegistry.find(a => a.id === formData.fromId);
      if (acc && acc.name !== formData.from) setFormData((prev: any) => ({ ...prev, from: acc.name }));
    }
    if (formData.areaId) {
      const cat = categoryRegistry.find(c => c.id === formData.areaId);
      if (cat && cat.name !== formData.area) setFormData((prev: any) => ({ ...prev, area: cat.name }));
    }
  }, [formData.fromId, formData.areaId, accountRegistry, categoryRegistry]);

  // Default to user setting
  const [createNote, setCreateNote] = useState(state.settings.createNoteOnLog ?? false);

  // Validate on change: overdraft check
  useEffect(() => {
    const numericAmount = parseFloat(formData.amount.toString().replace(/[^0-9.-]/g, '')) || 0;
    if (!numericAmount) { setOverdraftWarning(null); return; }
    
    if (formData.type === TransactionType.EXPENSE || formData.type === TransactionType.TRANSFER) {
      const accountBalanceObj = balances[formData.fromId] as any;
      
      // Convertir cada divisa a base y sumar para obtener saldo real disponible
      let currentBalanceBase = 0;
      if (accountBalanceObj) {
        Object.entries(accountBalanceObj).forEach(([curr, amt]: any) => {
          currentBalanceBase += convert(Number(amt) || 0, curr, baseCurr);
        });
      }
      
      // Bloquear si: ya tiene saldo negativo, O si el monto supera el disponible
      if (currentBalanceBase <= 0 || numericAmount > currentBalanceBase) {
        const acc = accountRegistry.find(a => a.id === formData.fromId);
        const accName = acc?.name || 'esta cuenta';
        const disponible = Math.max(0, currentBalanceBase);
        const faltante = (numericAmount - disponible).toLocaleString('es-CO', { maximumFractionDigits: 0 });
        setOverdraftWarning(`⚠️ Saldo insuficiente en "${accName}". Faltan $${faltante} ${baseCurrency} para completar esta transacción.`);
      } else {
        setOverdraftWarning(null);
      }
    } else {
      setOverdraftWarning(null);
    }
  }, [formData.amount, formData.fromId, formData.type, balances, accountRegistry, baseCurrency, baseCurr, convert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(formData.amount.toString().replace(/[^0-9.-]/g, ''));
    if (!formData.amount || isNaN(numericAmount) || numericAmount <= 0) {
      setValidationErrors(["Amount must be greater than 0"]);
      return;
    }

    const { isValid, errors } = validateTransaction(
      { ...formData, amount: numericAmount },
      baseCurrency
    );

    if (overdraftWarning) {
      setValidationErrors([overdraftWarning]);
      return;
    }

    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const transactionData = {
      ...formData,
      amount: numericAmount,
      // Ensure IDs are set
      id: initialData?.id || generateUUID(),
      fromId: formData.fromId,
      areaId: formData.areaId
    };

    await onSave(transactionData);

    if (createNote) {
      // Pass both legacy and ID data for note creation
      await createTransactionNote({ ...transactionData, id: initialData?.id || Date.now().toString() });
    }
  };

  const typeOptions = [
    { value: TransactionType.EXPENSE, label: t('logs.form.type.expense') },
    { value: TransactionType.INCOME, label: t('logs.form.type.income') },
    { value: TransactionType.TRANSFER, label: t('logs.form.type.transfer') }
  ];

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {validationErrors.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded-xl text-xs font-bold flex flex-col gap-1">
          {validationErrors.map((err, idx) => (
             <span key={idx} className="flex items-center gap-1"><AlertTriangle size={12}/> {err}</span>
          ))}
        </div>
      )}
      {overdraftWarning && (
        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" /> {overdraftWarning}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('logs.form.date')} type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
        <div className="space-y-1.5 focus-within:border-[var(--interactive-accent)]">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 block">
            {t('logs.form.type')}
          </label>
          <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: TransactionType.EXPENSE })}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--background-primary)]'}`}
            >
              {t('logs.form.type.expense')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: TransactionType.INCOME })}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--background-primary)]'}`}
            >
              {t('logs.form.type.income')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: TransactionType.TRANSFER })}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.type === TransactionType.TRANSFER ? 'bg-amber-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--background-primary)]'}`}
            >
              {t('logs.form.type.transfer')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 items-end">
        <div className="col-span-3">
          <NumericInput label={t('logs.form.amount')} value={formData.amount} onValueChange={v => setFormData({ ...formData, amount: v })} />
        </div>
        <div className="col-span-1">
          <SelectStyled
            label={t('logs.form.currency')}
            options={[{ value: 'COP', label: 'COP' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
            value={formData.currency || baseCurrency}
            onChange={value => setFormData({ ...formData, currency: value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectStyled
          label={formData.type === TransactionType.TRANSFER ? t('logs.form.from_transfer') : t('logs.form.from')}
          options={accountOptions}
          value={formData.fromId}
          onChange={value => setFormData({ ...formData, fromId: value })}
        />

        {formData.type === TransactionType.TRANSFER ? (
          <SelectStyled
            label={t('logs.form.to_transfer')}
            options={accountOptions.filter(opt => opt.value !== formData.fromId)}
            value={formData.toId || ''}
            onChange={value => setFormData({ ...formData, toId: value })}
          />
        ) : (
          <SelectStyled
            label={t('logs.form.area')}
            options={areaOptions}
            value={formData.areaId}
            onChange={value => setFormData({ ...formData, areaId: value })}
          />
        )}
      </div>

      <div className="space-y-2">
        <Input label={t('logs.form.desc')} value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder={t('logs.form.note_placeholder')} />

        <div
          onClick={() => setCreateNote(!createNote)}
          className={`
            flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
            ${createNote
              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 shadow-sm'
              : 'bg-[var(--background-secondary)] border-transparent text-[var(--text-muted)] hover:border-[var(--background-modifier-border)]'
            }
          `}
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${createNote ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-[var(--text-muted)]'}`}>
            {createNote && <FileText size={12} />}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold select-none">{t('logs.form.create_note')}</span>
            {createNote && <span className="text-[9px] opacity-80">{t('logs.form.create_note_desc')}</span>}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>{t('btn.cancel')}</Button>
        <Button type="submit" disabled={!!overdraftWarning}>{t('btn.save')}</Button>
      </ModalFooter>
    </form>
  );
};