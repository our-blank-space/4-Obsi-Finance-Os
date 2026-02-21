import React, { useState, useMemo, useCallback } from 'react';
import { Reminder, Priority, Currency } from '../types';
import { useAI } from '../hooks/useAI';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { FormattingUtils } from '../utils/formatting';
import { 
  Bell, Calendar, CheckCircle2, Circle, Trash2, Plus, 
  Sparkles, Clock, ChevronRight, ChevronDown, AlertCircle
} from 'lucide-react';

import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Modal, ModalFooter } from './ui/Modal';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface RemindersProps {
  reminders: Reminder[];
  onAdd: (r: Reminder) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// --- HELPERS PUROS (Fuera del componente) ---

const getInitialFormState = (currency: Currency) => ({
  title: '',
  dueDate: new Date().toISOString().split('T')[0],
  amount: '',
  currency,
  category: 'Pagos',
  priority: 'medium' as Priority,
  note: ''
});

const getPriorityStyles = (p: Priority) => {
  switch (p) {
    case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'low': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    default: return 'bg-[var(--background-secondary)] text-[var(--text-muted)]';
  }
};

const getTimeLabel = (dateStr: string, today: Date, t: (k: string) => string) => {
  const target = new Date(dateStr);
  // Ajuste a medianoche para comparación de días enteros
  const targetTime = new Date(target.valueOf() + target.getTimezoneOffset() * 60000); 
  targetTime.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((targetTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: t('rem.time.today'), color: 'text-amber-500' };
  if (diffDays === 1) return { label: t('rem.time.tomorrow'), color: 'text-emerald-500' };
  if (diffDays < 0) return { label: `Vencido hace ${Math.abs(diffDays)}d`, color: 'text-rose-500 font-bold' };
  return { label: `En ${diffDays} días`, color: 'text-[var(--text-muted)]' };
};

// --- COMPONENTE PRINCIPAL ---

const Reminders: React.FC<RemindersProps> = ({ 
  reminders, 
  onAdd, 
  onToggle, 
  onDelete
}) => {
  const { parseReminder, isProcessing } = useAI();
  const { format, baseCurrency } = useCurrency();
  const { t } = useTranslation();

  // Estados UI
  const [showForm, setShowForm] = useState(false);
  const [showMagic, setShowMagic] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [magicInput, setMagicInput] = useState('');
  
  // Estado del Formulario (Lazy Init para evitar recreación)
  const [formData, setFormData] = useState(() => getInitialFormState(baseCurrency));

  // --- MEMOIZATION & DATA PROCESSING ---

  // 1. Fecha base optimizada (solo se calcula al montar o si cambiara el día en una app de larga duración)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 2. Filtrado y ordenamiento eficiente
  const { activeReminders, completedReminders } = useMemo(() => {
    const active: Reminder[] = [];
    const completed: Reminder[] = [];

    reminders.forEach(r => {
      (r.isCompleted ? completed : active).push(r);
    });

    // Sort active: Más urgente primero
    active.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    // Sort completed: Más reciente primero
    completed.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    return { activeReminders: active, completedReminders: completed };
  }, [reminders]);

  // --- HANDLERS ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      title: formData.title,
      dueDate: formData.dueDate,
      amount: formData.amount ? FormattingUtils.parseInputToNumber(formData.amount) : undefined,
      currency: formData.currency,
      category: formData.category,
      priority: formData.priority,
      isCompleted: false,
      note: formData.note
    });

    setFormData(getInitialFormState(baseCurrency));
    setShowForm(false);
  };

  const handleMagicParse = async () => {
    if (!magicInput.trim()) return;
    try {
      const result = await parseReminder(magicInput);
      if (result) {
        onAdd({
          id: crypto.randomUUID(),
          title: result.title || 'Untitled',
          dueDate: result.dueDate || new Date().toISOString().split('T')[0],
          amount: result.amount,
          currency: result.currency || baseCurrency,
          category: result.category || 'Varios',
          priority: result.priority || 'medium',
          isCompleted: false,
          note: result.note || magicInput
        });
        setMagicInput('');
        setShowMagic(false);
      }
    } catch (e) {
      console.error("AI Error:", e);
      alert("No se pudo interpretar el recordatorio. Intenta ser más específico.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-normal)] uppercase italic">{t('rem.title')}</h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm font-medium">{t('rem.subtitle')}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={() => setShowMagic(true)} icon={<Sparkles size={16} className="text-sky-500" />}>{t('common.ai_magic')}</Button>
          <Button onClick={() => setShowForm(true)} icon={<Plus size={18} />}>{t('rem.new')}</Button>
        </div>
      </header>

      {/* ACTIVE REMINDERS LIST */}
      <div className="space-y-4">
        {activeReminders.length > 0 ? (
          activeReminders.map(r => {
            const time = getTimeLabel(r.dueDate, today, t);
            return (
              <div key={r.id} className="group bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--text-normal)] transition-all shadow-sm">
                <button 
                  onClick={() => onToggle(r.id)} 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border-2 border-[var(--background-modifier-border)] group-hover:border-[var(--text-normal)]"
                  aria-label="Marcar como completado"
                >
                  <Circle size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-[var(--text-normal)] truncate">{r.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getPriorityStyles(r.priority)}`}>
                      {r.priority}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium bg-[var(--background-primary)] px-2 py-1 rounded-lg border border-[var(--background-modifier-border)]">
                      <Calendar size={12} /> {r.dueDate}
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold ${time.color}`}>
                      <Clock size={12} /> {time.label}
                    </div>
                    {r.amount && r.amount > 0 && (
                      <div className="text-[var(--text-normal)] font-mono font-bold pl-2 border-l border-[var(--background-modifier-border)]">
                        {format(r.amount, r.currency || baseCurrency)}
                      </div>
                    )}
                  </div>
                  {r.note && <div className="text-[10px] text-[var(--text-muted)] mt-2 italic truncate max-w-md">{r.note}</div>}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteId(r.id)} 
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-500"
                  aria-label="Eliminar recordatorio"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-[var(--background-modifier-border)] rounded-3xl bg-[var(--background-secondary)]/20">
            <Bell size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
            <h3 className="text-xl font-black text-[var(--text-muted)] uppercase">0 {t('rem.title')}</h3>
          </div>
        )}
      </div>

      {/* COMPLETED HISTORY */}
      {completedReminders.length > 0 && (
        <div className="pt-6 border-t border-[var(--background-modifier-border)]">
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="flex items-center gap-2 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 hover:text-[var(--text-normal)] transition-colors w-full text-left"
          >
            {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
            {t('trade.history')} ({completedReminders.length})
          </button>
          
          {showHistory && (
            <div className="space-y-3 opacity-60">
              {completedReminders.map(r => (
                <div key={r.id} className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-xl p-3 flex items-center gap-4 group">
                  <button 
                    onClick={() => onToggle(r.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                    aria-label="Desmarcar completado"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-muted)] line-through truncate">{r.title}</h3>
                    <div className="text-[10px] text-[var(--text-faint)] font-medium">Done: {r.dueDate}</div>
                  </div>
                  <button 
                    onClick={() => setDeleteId(r.id)} 
                    className="p-2 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Eliminar del historial"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALES --- */}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('rem.new')} icon={<Bell size={24} />}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
               <Input label="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="..." autoFocus />
             </div>
             <Input label={t('rem.due')} type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
             <Select 
                label={t('rem.priority')} 
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} 
                value={formData.priority} 
                onChange={e => setFormData({...formData, priority: e.target.value as Priority})} 
             />
             <Input 
                label={t('common.amount')} 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: FormattingUtils.formatInputOnType(e.target.value)})} 
                inputMode="numeric" 
                placeholder="0" 
             />
             <Select 
                label={t('common.currency')} 
                options={['COP', 'USD']} 
                value={formData.currency} 
                onChange={e => setFormData({...formData, currency: e.target.value as Currency})} 
             />
             <div className="md:col-span-2">
                <Input label={t('common.notes')} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="..." />
             </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)} type="button">{t('btn.cancel')}</Button>
            <Button type="submit">{t('btn.save')}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={showMagic} onClose={() => setShowMagic(false)} title={t('common.ai_magic')} icon={<Sparkles size={24} className="text-sky-500"/>}>
        <div className="space-y-4">
          <textarea 
            value={magicInput} 
            onChange={e => setMagicInput(e.target.value)} 
            placeholder="Ej: Pagar tarjeta 200k el viernes prioridad alta" 
            className="w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)] rounded-xl p-4 text-[var(--text-normal)] outline-none focus:border-sky-500 min-h-[120px] resize-none text-sm font-medium leading-relaxed" 
            autoFocus 
          />
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowMagic(false)}>{t('btn.cancel')}</Button>
            <Button onClick={handleMagicParse} isLoading={isProcessing} disabled={!magicInput} className="bg-sky-600 hover:bg-sky-500">{t('common.ai_magic')}</Button>
          </ModalFooter>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          onDelete(deleteId);
          setDeleteId(null);
        }}
        title={`${t('btn.delete')}?`}
        description="Esta acción no se puede deshacer."
        confirmText={t('btn.delete')}
        variant="danger"
      />

    </div>
  );
};

export default Reminders;