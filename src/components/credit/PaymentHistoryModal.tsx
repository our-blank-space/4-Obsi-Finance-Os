import React, { useState } from 'react';
import { Loan, Debt, LoanPayment } from '../../types';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NumericInput } from '../ui/NumericInput';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { Trash2, Plus, Calendar, FileText, Edit2, Save, X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: Loan | Debt;
    onUpdate: (updatedItem: Loan | Debt) => void;
}

export const PaymentHistoryModal: React.FC<Props> = ({ isOpen, onClose, item, onUpdate }) => {
    const { t } = useTranslation();
    const { format } = useCurrency();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formAmount, setFormAmount] = useState('');
    const [formNote, setFormNote] = useState('');

    const payments = [...(item.payments || [])].sort((a, b) => b.date.localeCompare(a.date));

    const resetForm = () => {
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormAmount('');
        setFormNote('');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = () => {
        if (!formAmount) return;
        const amount = parseFloat(formAmount);
        if (isNaN(amount) || amount <= 0) return;

        let updatedPayments = [...(item.payments || [])];

        if (editingId) {
            // Edit existing
            updatedPayments = updatedPayments.map(p => p.id === editingId ? { ...p, date: formDate, amount, note: formNote } : p);
        } else {
            // Add new
            updatedPayments.push({
                id: crypto.randomUUID(),
                date: formDate,
                amount,
                note: formNote
            });
        }

        // Recalculate totals
        const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
        const updatedItem = { ...item, payments: updatedPayments };

        if ('collected' in updatedItem) updatedItem.collected = totalPaid;
        else updatedItem.paid = totalPaid;

        onUpdate(updatedItem);
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (!confirm(t('common.delete_confirm'))) return;

        const updatedPayments = item.payments.filter(p => p.id !== id);
        const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
        const updatedItem = { ...item, payments: updatedPayments };

        if ('collected' in updatedItem) updatedItem.collected = totalPaid;
        else updatedItem.paid = totalPaid;

        onUpdate(updatedItem);
    };

    const startEdit = (payment: LoanPayment) => {
        setFormDate(payment.date);
        setFormAmount(payment.amount.toString());
        setFormNote(payment.note || '');
        setEditingId(payment.id);
        setIsAdding(true);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('credit.history.title')} icon={<Calendar size={20} />}>

            {/* ADD / EDIT FORM */}
            {isAdding ? (
                <div className="bg-[var(--background-primary)] p-4 rounded-xl border border-[var(--interactive-accent)] mb-4 space-y-3 animate-in fade-in shadow-sm relative">
                    <button onClick={resetForm} className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-normal)]"><X size={14} /></button>
                    <h4 className="text-xs font-bold uppercase text-[var(--interactive-accent)] flex items-center gap-2">
                        {editingId ? <Edit2 size={12} /> : <Plus size={12} />}
                        {editingId ? t('credit.history.edit') : t('credit.history.add')}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                        <NumericInput value={formAmount} onValueChange={setFormAmount} currency={item.currency} placeholder="0.00" />
                    </div>
                    <Input
                        placeholder={t('credit.history.note_ph')}
                        value={formNote}
                        onChange={e => setFormNote(e.target.value)}
                        icon={<FileText size={14} />}
                    />
                    <div className="flex gap-2 justify-end mt-2">
                        <Button size="sm" onClick={handleSave} icon={<Save size={14} />}>{t('btn.save')}</Button>
                    </div>
                </div>
            ) : (
                <div className="mb-4 flex justify-end">
                    <Button size="sm" onClick={() => setIsAdding(true)} icon={<Plus size={14} />}>{t('credit.history.add_btn')}</Button>
                </div>
            )}

            {/* LIST */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {payments.length === 0 ? (
                    <p className="text-center text-[var(--text-muted)] text-sm py-8 italic">{t('credit.history.empty')}</p>
                ) : (
                    payments.map(p => (
                        <div key={p.id} className="group flex items-center justify-between p-3 bg-[var(--background-primary)] rounded-lg border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)] transition-colors">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-[var(--text-normal)]">{format(p.amount, item.currency)}</span>
                                    <span className="text-xs text-[var(--text-muted)]">{p.date}</span>
                                </div>
                                {p.note && <p className="text-xs text-[var(--text-muted)] italic mt-1">{p.note}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-[var(--background-modifier-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-normal)]">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-rose-500/10 rounded text-[var(--text-muted)] hover:text-rose-500">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ModalFooter>
                <div className="w-full flex justify-between items-center">
                    <div className="text-xs text-[var(--text-muted)] uppercase font-bold">{t('credit.total_paid')}</div>
                    <div className="text-lg font-mono font-black text-[var(--text-normal)]">
                        {format('collected' in item ? item.collected || 0 : item.paid || 0, item.currency)}
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};
