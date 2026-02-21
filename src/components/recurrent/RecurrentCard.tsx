import React from 'react';
import { RecurrentTransaction } from '../../types';
import { Zap, Repeat, Play, Edit3, Pause, ShieldCheck, Trash2, Calendar, Sliders } from 'lucide-react';
import { RecurrentEngine } from '../../core/analytics/RecurrentEngine';

const BRAND_COLORS: Record<string, string> = {
  netflix: 'from-red-600 to-red-900',
  spotify: 'from-green-500 to-green-800',
  chatgpt: 'from-emerald-600 to-teal-800',
  // ... resto de marcas
};

interface Props {
  item: RecurrentTransaction;
  format: (amt: number, curr: any) => string;
  t: (k: string, p?: any) => string;
  onExecute: (r: RecurrentTransaction) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: RecurrentTransaction) => void; // ✅ Prop añadida
}

export const RecurrentCard: React.FC<Props> = ({ item, format, t, onExecute, onToggle, onDelete, onEdit }) => {
  // ✅ FIX: Use analyzeItem instead of analyzeTimelineItem
  const analysis = RecurrentEngine.analyzeItem(item);
  const annualImpact = RecurrentEngine.calculateAnnualImpact(item.amount, item.frequency);

  const lowerName = item.name.toLowerCase();
  const brandKey = Object.keys(BRAND_COLORS).find(k => lowerName.includes(k));
  const gradient = brandKey ? BRAND_COLORS[brandKey] : 'from-[var(--background-secondary)] to-[var(--background-secondary)]';

  return (
    <div className={`relative group rounded-3xl p-6 transition-all border overflow-hidden
      ${item.isActive ? 'border-[var(--background-modifier-border)] hover:border-[var(--text-normal)]' : 'border-dashed opacity-60'}
      ${brandKey && item.isActive ? `bg-gradient-to-br ${gradient} text-white border-transparent` : 'bg-[var(--background-secondary)]'}
    `}>
      {item.isTrial && item.isActive && (
        <div className={`absolute top-0 left-0 right-0 py-1 text-[9px] font-black uppercase text-center tracking-widest 
          ${analysis.isTrialEndingSoon ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400 text-black'}`}>
          {analysis.isTrialEndingSoon ? `⚠️ ${t('rec.cancel_urgent')}` : `${t('rec.trial_end')}: ${item.trialEndDate}`}
        </div>
      )}

      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md bg-white/10">
          {brandKey ? <Zap size={20} className="text-white" /> : <Repeat size={20} />}
        </div>
        <div className="flex gap-2">
          {item.isActive && (
            <button
              onClick={() => onExecute(item)}
              className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              title={t('rec.pay')}
            >
              <Sliders size={16} />
            </button>
          )}
          {/* ✅ Botón de Edición General */}
          <button onClick={() => onEdit(item)} className="p-2 bg-white/10 hover:bg-white/30 rounded-lg transition-all" aria-label={t('btn.edit')}>
            <Edit3 size={14} />
          </button>

          <button onClick={() => onToggle(item.id)} className="p-2 bg-white/10 rounded-lg">
            {item.isActive ? <Pause size={14} /> : <ShieldCheck size={14} />}
          </button>
          <button onClick={() => onDelete(item.id)} className="p-2 bg-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-black tracking-tight truncate">{item.name}</h3>
      <div className="text-2xl font-mono font-black mt-1">
        {item.isVariable ? '~ ' : ''}{format(item.amount, item.currency)}
        <span className="text-[10px] font-bold uppercase opacity-70 ml-1">/ {t(`rec.freq.${item.frequency}`)}</span>
      </div>

      <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center text-[10px] opacity-80">
        <div className="flex items-center gap-1.5"><Calendar size={12} /> {item.nextDate}</div>
        <div className="uppercase tracking-wider">{t('rec.impact', { val: format(annualImpact, item.currency) })}</div>
      </div>
    </div>
  );
};