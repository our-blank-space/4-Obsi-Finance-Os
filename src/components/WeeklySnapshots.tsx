import React, { useState, useMemo, useCallback } from 'react';
import { Infra, Currency } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../hooks/useCurrency'; // Usamos el hook global para consistencia
import {
  Plus, Trash2, Save, Target, Wallet,
  Calendar, DollarSign, History, Pencil, ArrowUpDown
} from 'lucide-react';

import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { NumericInput } from './ui/NumericInput'; // <--- LA CLAVE
import { Modal, ModalFooter } from './ui/Modal'; // Reutilizamos tu modal estándar
import { ConfirmDialog } from './ui/ConfirmDialog';

interface WeeklySnapshotsProps {
  snapshots: Infra.WeeklySnapshot[];
  accounts: string[];
  onAdd: (s: Infra.WeeklySnapshot) => void;
  onUpdate: (s: Infra.WeeklySnapshot) => void;
  onDelete: (id: string) => void;
  privacyMode?: boolean;
}

// --- UTILIDADES PURAS (Fuera del render) ---

const generateId = () => crypto.randomUUID();

export const WeeklySnapshots: React.FC<WeeklySnapshotsProps> = ({
  snapshots,
  accounts,
  onAdd,
  onUpdate,
  onDelete,
  privacyMode = false,
}) => {
  const { t } = useTranslation();
  const { format, baseCurrency } = useCurrency(); // Usamos el formateador global del sistema

  // --- ESTADO ---
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = más reciente primero

  // Estado del Formulario (Tipado Estricto)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('COP');
  const [note, setNote] = useState('');

  // AHORA: values guarda number, no string. Mucho más limpio.
  const [values, setValues] = useState<Record<string, number>>({});

  // --- MEMOS & LÓGICA ---

  const validAccounts = useMemo(() =>
    accounts.filter(a => a !== 'none'),
    [accounts]);

  const sortedSnapshots = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [snapshots, sortOrder]);

  const currentTotal = useMemo(() =>
    Object.values(values).reduce((sum, v) => sum + (v || 0), 0),
    [values]);

  const mask = useCallback((val: string | number) =>
    privacyMode ? "****" : val,
    [privacyMode]);

  // --- HANDLERS ---

  const handleValueChange = (acc: string, valString: string) => {
    // NumericInput ya nos devuelve el string numérico limpio ("1000"), 
    // pero lo guardamos como number para facilitar cálculos.
    const num = parseFloat(valString);
    setValues(prev => ({
      ...prev,
      [acc]: isNaN(num) ? 0 : num
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Lógica limpia: ya tenemos los números, solo sumamos.
    const totalPatrimonio = Object.values(values).reduce((a, b) => a + b, 0);

    // Persist Agri Value in the snapshot values if > 0
    const finalValues = { ...values };

    const snapshotData: Infra.WeeklySnapshot = {
      id: editingId || generateId(),
      date,
      values: finalValues,
      patrimonio: totalPatrimonio,
      currency,
      note
    };

    if (editingId) {
      onUpdate(snapshotData);
    } else {
      onAdd(snapshotData);
    }

    // Reset
    handleCloseForm();
  };

  const handleEdit = (s: Infra.WeeklySnapshot) => {
    setEditingId(s.id);
    setDate(s.date);
    setCurrency(s.currency);
    setNote(s.note || '');
    setValues(s.values);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setValues({});
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto font-sans">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-normal)]">{t('snap.title')}</h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm font-medium">{t('snap.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            icon={<ArrowUpDown size={18} />}
            title={sortOrder === 'desc' ? 'Más reciente primero' : 'Más antiguo primero'}
          >
            {sortOrder === 'desc' ? '↓ Reciente' : '↑ Antiguo'}
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            icon={<Plus size={18} />}
          >
            {t('snap.new')}
          </Button>
        </div>
      </header>

      {/* SNAPSHOT LIST */}
      <div className="grid grid-cols-1 gap-6">
        {sortedSnapshots.map(s => (
          <div key={s.id} className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] p-6 rounded-3xl group hover:border-[var(--text-normal)] transition-all relative shadow-sm">

            {/* Actions Button (Overlay) */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button onClick={() => handleEdit(s)} className="p-2 bg-[var(--background-primary)] hover:bg-[var(--interactive-accent)]/20 text-[var(--text-muted)] hover:text-[var(--interactive-accent)] rounded-xl transition-colors">
                <Pencil size={18} />
              </button>
              <button onClick={() => setDeleteId(s.id)} className="p-2 bg-[var(--background-primary)] hover:bg-rose-900/50 text-[var(--text-muted)] hover:text-rose-500 rounded-xl transition-colors">
                <Trash2 size={18} />
              </button>
            </div>

            {/* Card Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Target size={28} />
                </div>
                <div>
                  <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> {s.date}
                  </div>
                  <div className="text-3xl font-black text-[var(--text-normal)] font-mono mt-1 tracking-tight">
                    {mask(format(s.patrimonio, s.currency))}
                  </div>
                  {s.note && <div className="text-xs text-[var(--text-muted)] mt-1 italic">"{s.note}"</div>}
                </div>
              </div>
            </div>

            {/* Card Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-6 border-t border-[var(--background-modifier-border)]">
              {Object.entries(s.values).map(([accName, val]) => {
                const numericVal = val as number; // Type assertion safe by domain
                if (numericVal === 0) return null; // Opcional: Ocultar ceros para limpieza visual

                return (
                  <div key={accName} className="bg-[var(--background-primary)]/50 p-3 rounded-xl border border-[var(--background-modifier-border)]/50">
                    <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest truncate mb-1" title={accName}>
                      {accName}
                    </div>
                    <div className={`text-sm font-mono font-bold ${numericVal < 0 ? 'text-rose-400' : 'text-[var(--text-normal)]'}`}>
                      {mask(format(numericVal, s.currency))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {snapshots.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-[var(--background-modifier-border)] rounded-[2rem] bg-[var(--background-secondary)]/20">
            <History size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-[var(--text-muted)]">{t('snap.empty')}</h3>
          </div>
        )}
      </div>

      {/* --- MODALES --- */}

      {/* Modal de Creación */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingId ? t('btn.edit') : t('snap.new')}
        icon={<Target size={24} />}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('common.date')}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <Select
              label={t('common.currency')}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              options={['COP', 'USD', 'EUR']} // Podríamos traer esto de constants
            />
          </div>

          {/* Accounts Grid Section */}
          <div className="bg-[var(--background-secondary)]/50 border border-[var(--background-modifier-border)] rounded-2xl p-6">
            <div className="flex justify-between items-end mb-6 pb-4 border-b border-[var(--background-modifier-border)]">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Wallet size={16} /> {t('balances.account')}
              </h3>
              <div className="text-right">
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('bal.total')}</div>
                <div className="text-2xl font-mono font-black text-[var(--interactive-accent)]">
                  {format(currentTotal, currency)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {validAccounts.map(acc => (
                <div key={acc} className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">{acc}</label>
                  {/* REUTILIZACIÓN DEL COMPONENTE NUMERIC INPUT */}
                  <NumericInput
                    value={values[acc] || ''}
                    onValueChange={(val) => handleValueChange(acc, val)}
                    placeholder="0"
                    currency={currency}
                    className="bg-[var(--background-primary)]"
                  />
                </div>
              ))}


            </div>
          </div>

          <Input
            label={t('common.notes')}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Cierre mensual, ajuste por inflación..."
          />

          <ModalFooter>
            <Button variant="ghost" onClick={handleCloseForm} type="button">{t('btn.cancel')}</Button>
            <Button type="submit" icon={<Save size={18} />}>{t('btn.save')}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Dialogo de Confirmación */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
        }}
        title={`${t('btn.delete')}?`}
        description="Esta acción eliminará el registro histórico de patrimonio. No afecta las transacciones individuales."
        confirmText={t('btn.delete')}
        intent="delete_record"
      />

    </div>
  );
};

export default WeeklySnapshots;