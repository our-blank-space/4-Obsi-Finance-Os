import React, { useState, useEffect } from 'react';
import { RecurrentTransaction, TransactionType, Frequency, FinanceAccount, FinanceCategory } from '../../types';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { NumericInput } from '../ui/NumericInput';
import { DateUtils } from '../../utils/date';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    isOpen: boolean;
    initialData: RecurrentTransaction | null;
    onClose: () => void;
    onSave: (data: RecurrentTransaction) => void;
    accounts: FinanceAccount[];
    areas: FinanceCategory[];
}

const EMPTY_FORM = {
    name: '',
    amount: '',
    currency: 'COP',
    type: TransactionType.EXPENSE,
    areaId: '',
    accountId: '',
    frequency: 'monthly' as Frequency,
    nextDate: '',
    isVariable: false
};

export const RecurrentFormModal: React.FC<Props> = ({ isOpen, initialData, onClose, onSave, accounts, areas }) => {
    const { t } = useTranslation();
    // Options for Selects
    const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
    const areaOptions = areas.map(c => ({ value: c.id, label: c.name }));

    // Estado local del formulario
    const [form, setForm] = useState<any>(EMPTY_FORM);

    // Resetear formulario al abrir
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({
                    ...initialData,
                    amount: initialData.amount.toString(),
                    // Fallback para datos sin ID (legacy migration)
                    accountId: initialData.accountId || accounts.find(a => a.name === (initialData as any).account)?.id || accounts[0]?.id,
                    areaId: initialData.areaId || areas.find(c => c.name === (initialData as any).area)?.id || areas[0]?.id
                });
            } else {
                setForm({
                    ...EMPTY_FORM,
                    nextDate: DateUtils.getToday(),
                    accountId: accounts[0]?.id || '',
                    areaId: areas[0]?.id || ''
                });
            }
        }
    }, [isOpen, initialData, accounts, areas]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedAcc = accounts.find(a => a.id === form.accountId);
        const selectedArea = areas.find(c => c.id === form.areaId);

        // ✅ LÓGICA NUEVA: Calcular el anchorDay
        // nextDate viene como string "YYYY-MM-DD".
        // Cortamos por el guion y tomamos la última parte (el día).
        let calculatedAnchor = 1;
        if (form.nextDate) {
            const parts = form.nextDate.split('-');
            // ParsenInt convierte "01" a 1, "31" a 31, etc.
            calculatedAnchor = parseInt(parts[2]);
        }

        onSave({
            ...form,
            id: initialData?.id || crypto.randomUUID(),
            amount: parseFloat(form.amount) || 0,
            account: selectedAcc?.name || '', // Maintain name for legacy
            area: selectedArea?.name || '',    // Maintain name for legacy
            isActive: initialData ? initialData.isActive : true,

            // ⚓ GUARDAMOS EL ANCLA AQUÍ
            // Si ya existía (initialData.anchorDay), preferimos mantener ese 
            // para no perder un "31" si estamos editando en febrero.
            // Si es nuevo, usamos el día calculado.
            anchorDay: initialData?.anchorDay || calculatedAnchor
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('rec.form.title_edit') : t('rec.form.title_new')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de Tipo */}
                <div className="space-y-1.5 mb-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">
                        {t('rec.form.type')}
                    </label>
                    <div className="flex bg-[var(--background-modifier-form-field)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: TransactionType.INCOME })}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${form.type === TransactionType.INCOME
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:bg-[var(--background-secondary)]'
                                }`}
                        >
                            {t('label.income')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: TransactionType.EXPENSE })}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${form.type === TransactionType.EXPENSE
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:bg-[var(--background-secondary)]'
                                }`}
                        >
                            {t('label.expense')}
                        </button>
                    </div>
                </div>

                <Input
                    label={t('rec.form.name')}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={t('rec.form.placeholder_name')}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <NumericInput
                        label={t('rec.form.amount')}
                        value={form.amount}
                        onValueChange={v => setForm({ ...form, amount: v })}
                        currency={form.currency}
                    />
                    <Select
                        label={t('rec.form.freq')}
                        value={form.frequency}
                        onChange={e => setForm({ ...form, frequency: e.target.value })}
                        options={[
                            { value: 'monthly', label: t('rec.freq.monthly') },
                            { value: 'yearly', label: t('rec.freq.yearly') },
                            { value: 'weekly', label: t('rec.freq.weekly') },
                            { value: 'custom', label: t('rec.freq.custom') }
                        ]}
                    />
                </div>

                {/* Input condicional para días personalizados */}
                {form.frequency === 'custom' && (
                    <div className="bg-[var(--background-secondary)]/50 p-3 rounded-xl border border-[var(--background-modifier-border)]">
                        <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
                            {t('rec.form.freq.custom_label')}
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={form.intervalDays || ''}
                            onChange={e => setForm({ ...form, intervalDays: parseInt(e.target.value) })}
                            className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--interactive-accent)]"
                            placeholder={t('rec.form.freq.custom_placeholder')}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label={t('rec.form.account')}
                        value={form.accountId}
                        onChange={e => setForm({ ...form, accountId: e.target.value })}
                        options={accountOptions}
                    />
                    <Select
                        label={t('rec.form.category')}
                        value={form.areaId}
                        onChange={e => setForm({ ...form, areaId: e.target.value })}
                        options={areaOptions}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t('rec.form.date')}
                        type="date"
                        value={form.nextDate}
                        onChange={e => setForm({ ...form, nextDate: e.target.value })}
                        required
                    />
                    <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={form.isVariable}
                                onChange={e => setForm({ ...form, isVariable: e.target.checked })}
                                className="accent-[var(--interactive-accent)] w-4 h-4 rounded"
                            />
                            <span className="font-medium text-[var(--text-normal)]">{t('rec.form.variable')}</span>
                        </label>
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button type="submit" intent="save">{initialData ? t('btn.save') : t('btn.create')}</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};