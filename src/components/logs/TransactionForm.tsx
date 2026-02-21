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
import { FileText } from 'lucide-react';
import { generateUUID } from '../../utils/uuid';

export const TransactionForm = ({ initialData, onSave, onCancel }: any) => {
  const { createTransactionNote } = useObsidianLink();
  const { state } = useFinance();
  const { t } = useTranslation();
  const { baseCurrency, accountRegistry, categoryRegistry } = state;

  // Options from Registries - Clean implementation (no fallbacks needed after MigrationManager)
  const accountOptions = accountRegistry.map(acc => ({ value: acc.id, label: acc.name }));
  const areaOptions = categoryRegistry.map(cat => ({ value: cat.id, label: cat.name }));

  const [formData, setFormData] = useState(initialData || {
    date: new Date().toISOString().slice(0, 10),
    type: TransactionType.EXPENSE,
    amount: '',
    fromId: accountRegistry[0]?.id || '',
    areaId: categoryRegistry[0]?.id || '',
    // Legacy mapping (maintained for notes/ledger)
    from: accountRegistry[0]?.name || '',
    area: categoryRegistry[0]?.name || '',
    note: '',
    currency: baseCurrency,
    toId: initialData?.toId || ''
  });

  // Sync Legacy Fields on ID Change
  useEffect(() => {
    if (formData.fromId) {
      const acc = accountRegistry.find(a => a.id === formData.fromId);
      if (acc && acc.name !== formData.from) setFormData(prev => ({ ...prev, from: acc.name }));
    }
    if (formData.areaId) {
      const cat = categoryRegistry.find(c => c.id === formData.areaId);
      if (cat && cat.name !== formData.area) setFormData(prev => ({ ...prev, area: cat.name }));
    }
  }, [formData.fromId, formData.areaId, accountRegistry, categoryRegistry]);

  // Default to user setting
  const [createNote, setCreateNote] = useState(state.settings.createNoteOnLog ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(formData.amount.toString().replace(/[^0-9.-]/g, ''));
    if (!formData.amount || isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

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
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('logs.form.date')} type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
        <SelectStyled
          label={t('logs.form.type')}
          options={typeOptions}
          value={formData.type}
          onChange={value => setFormData({ ...formData, type: value })}
        />
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
        <Button type="submit">{t('btn.save')}</Button>
      </ModalFooter>
    </form>
  );
};