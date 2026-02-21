import React, { useMemo } from 'react';
import { Activity, ShieldCheck, AlertTriangle, Droplets, Lock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';

export const NetWorthHero = ({ total, liquid, health, snapshots }: any) => {
  const { format, toBase, baseCurrency } = useCurrency();
  const { t } = useTranslation();

  const historyData = useMemo(() =>
    snapshots.slice(-12).map((s: any) => ({
      val: toBase(s.patrimonio, s.currency)
    })), [snapshots, toBase]);

  return (
    <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
            <Activity size={14} /> {t('dash.net_worth')}
          </div>
          <div className="text-5xl font-mono font-black text-[var(--text-normal)] mt-2 tracking-tighter">
            {format(total, baseCurrency)}
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${health.status === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
          {health.status === 'OPTIMAL' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
          {t('bal.hero.health', { score: health.score })}
        </div>
      </div>

      <div className="h-32 w-full mt-6 -mb-8 opacity-30">
        <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
          <AreaChart data={historyData}>
            <Area type="monotone" dataKey="val" stroke="var(--interactive-accent)" strokeWidth={3} fill="var(--interactive-accent)" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 pt-4 border-t border-[var(--background-modifier-border)] flex justify-between text-[9px] font-black uppercase text-[var(--text-muted)]">
        <span className="flex items-center gap-1"><Droplets size={12} className="text-sky-500" /> {t('bal.hero.liquidity', { val: ((liquid / total) * 100).toFixed(0) })}</span>
        <span className="flex items-center gap-1"><Lock size={12} className="text-purple-500" /> {t('bal.hero.investment', { val: (((total - liquid) / total) * 100).toFixed(0) })}</span>
      </div>
    </div>
  );
};