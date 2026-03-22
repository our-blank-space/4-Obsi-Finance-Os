// src/components/farm/FarmProjectCard.tsx
import React from 'react';
import { FarmProject, FarmSale } from '../../types/business';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, Trash2, PiggyBank, Bird, Sprout, Heart, Scale, Skull, ArrowRightCircle } from 'lucide-react';

interface FarmProjectCardProps {
    project: FarmProject;
    sales: FarmSale[];
    currency: string;
    onDelete: (id: string) => void;
    onClose: (id: string) => void;
    onAddWeight?: (projectId: string) => void;
    onAddMortality?: (projectId: string) => void;
}

const TYPE_CONFIG = {
    pig_fattening: { label: 'Cerdo Engorde', Icon: PiggyBank, bgColor: 'bg-rose-500/10', iconColor: 'text-rose-500' },
    sow: { label: 'Cerda de Cría', Icon: Heart, bgColor: 'bg-pink-500/10', iconColor: 'text-pink-500' },
    poultry: { label: 'Aves / Pollos', Icon: Bird, bgColor: 'bg-amber-500/10', iconColor: 'text-amber-500' },
    crop: { label: 'Cultivo / Planta', Icon: Sprout, bgColor: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
};

export const FarmProjectCard: React.FC<FarmProjectCardProps> = ({ project, sales, currency, onDelete, onClose, onAddWeight, onAddMortality }) => {
    const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(v);
    const cfg = TYPE_CONFIG[project.type];

    const totalCosts = project.costs.reduce((s, c) => s + c.amount, 0);
    const projectSales = sales.filter(s => s.projectId === project.id);
    const totalRevenue = projectSales.reduce((s, v) => s + v.totalAmount, 0);
    const totalCollected = projectSales.reduce((s, v) => s + v.amountPaid, 0);
    const pendingDebt = projectSales.reduce((s, v) => s + v.balance, 0);
    const roi = totalRevenue - totalCosts;
    const isProfit = roi >= 0;

    const daysSinceStart = Math.floor(
        (Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // --- KPIs Biometría y Producción ---
    const isPigOrSow = project.type === 'pig_fattening' || project.type === 'sow';
    const currentAnimals = (project.initialCount || 0) - (project.mortalityCount || 0);
    const feedKg = project.costs.filter(c => c.category.startsWith('feed_')).reduce((s, c) => s + (c.quantity || 0), 0);
    
    // Peso actual promedio
    const lastWeightLog = project.weightLogs?.[project.weightLogs.length - 1];
    const currentAvgWeight = lastWeightLog ? lastWeightLog.weightKg : (project.entryWeightKg || 0);
    
    // ICA (Conversión Alimenticia)
    const kilosGainedPerAnimal = currentAvgWeight - (project.entryWeightKg || 0);
    const totalMeatGained = kilosGainedPerAnimal * currentAnimals;
    const ica = totalMeatGained > 0 && feedKg > 0 ? (feedKg / totalMeatGained).toFixed(2) : '-';

    // Costo Producción por Kilo (Aproximación usando biometría real vs kilos ya vendidos)
    let approxTotalKilos = 0;
    if (projectSales.length > 0) {
        // Sumar de las ventas
        projectSales.forEach(s => {
            if (s.pigDetail?.canalWeightKg) approxTotalKilos += s.pigDetail.canalWeightKg;
            if (s.pigDetail?.liveWeightKg) approxTotalKilos += s.pigDetail.liveWeightKg;
            if (s.pigDetail?.cuts) approxTotalKilos += s.pigDetail.cuts.reduce((s, c) => s + c.weightKg, 0);
            if (s.poultryDetail?.weightPerBirdLb) approxTotalKilos += (s.poultryDetail.quantity * s.poultryDetail.weightPerBirdLb) * 0.453592; // Lb to kg
        });
    } else {
        approxTotalKilos = currentAvgWeight * currentAnimals;
    }
    const costPerKg = approxTotalKilos > 0 ? totalCosts / approxTotalKilos : 0;
    const retentionFund = isProfit ? roi * 0.30 : 0; // 30% fondo de soberanía

    return (
        <div className={`bg-[var(--background-primary)] border rounded-2xl p-5 shadow-sm transition-all ${
            project.status === 'active'
                ? 'border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)]/50'
                : 'border-[var(--background-modifier-border)] opacity-70'
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cfg.bgColor} border border-white/5 shadow-inner shadow-white/5`}>
                        <cfg.Icon size={24} className={`${cfg.iconColor}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-normal)]">{project.name}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{cfg.label}</span>
                            {project.breed && (
                                <span className="text-[9px] uppercase font-bold text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">{project.breed}</span>
                            )}
                            {project.initialCount && (
                                <span className="text-[10px] bg-[var(--background-secondary)] px-1.5 py-0.5 rounded font-bold border border-[var(--background-modifier-border)]">
                                    {currentAnimals} {project.mortalityCount ? <span className="text-rose-500 text-[9px] ml-0.5">(-{project.mortalityCount})</span> : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {project.status === 'active' && (
                        <>
                            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--background-secondary)] px-2 py-1 rounded-lg border border-[var(--background-modifier-border)]">
                                <Clock size={10} />
                                {daysSinceStart}d
                            </span>
                            <button
                                onClick={() => onClose(project.id)}
                                title="Cerrar lote"
                                className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        </>
                    )}
                    {project.status === 'closed' && (
                        <span className="text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Cerrado
                        </span>
                    )}
                    <button
                        onClick={() => onDelete(project.id)}
                        title="Eliminar lote"
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Métricas e Indicadores de Producción */}
            {isPigOrSow && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[var(--background-secondary)] rounded-2xl p-3 border border-[var(--background-modifier-border)] flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] uppercase font-black text-[var(--text-muted)] mb-1 leading-none">ICA</div>
                        <div className="font-mono font-black text-base text-[var(--interactive-accent)]">{ica}</div>
                    </div>
                    <div className="bg-[var(--background-secondary)] rounded-2xl p-3 border border-[var(--background-modifier-border)] flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] uppercase font-black text-[var(--text-muted)] mb-1 leading-none">Peso Prom.</div>
                        <div className="font-mono font-black text-base text-[var(--text-normal)]">{currentAvgWeight} <span className="text-[10px]">kg</span></div>
                    </div>
                    <div className="col-span-2 bg-[var(--background-secondary)] rounded-2xl p-3 border border-[var(--background-modifier-border)] flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] uppercase font-black text-[var(--text-muted)] mb-1 leading-none">Costo x Kg Producción</div>
                        <div className="font-mono font-black text-lg text-rose-400">
                            {fmt(costPerKg)} <span className="text-[10px] font-bold text-rose-400/60 ml-1">/ KG</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[var(--background-secondary)] rounded-2xl p-4 border border-[var(--background-modifier-border)] shadow-sm">
                    <div className="text-[9px] uppercase font-black text-rose-500 mb-1">Inversión</div>
                    <div className="font-mono font-black text-lg text-rose-400">{fmt(totalCosts)}</div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-1 font-bold">{project.costs.length} rubros</div>
                </div>
                <div className="bg-[var(--background-secondary)] rounded-2xl p-4 border border-[var(--background-modifier-border)] shadow-sm">
                    <div className="text-[9px] uppercase font-black text-emerald-500 mb-1">Ventas</div>
                    <div className="font-mono font-black text-lg text-emerald-400">{fmt(totalRevenue)}</div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-1 font-bold">{projectSales.length} operaciones</div>
                </div>
            </div>

            {/* ROI */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                isProfit
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-rose-500/5 border-rose-500/20'
            }`}>
                <div className="flex items-center gap-2">
                    {isProfit
                        ? <TrendingUp size={16} className="text-emerald-500" />
                        : <TrendingDown size={16} className="text-rose-500" />}
                    <span className="text-xs font-bold text-[var(--text-muted)]">Rentabilidad</span>
                </div>
                <span className={`font-mono font-black text-lg ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fmt(roi)}
                </span>
            </div>

            {/* Fondo de Retención */}
            {isProfit && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-sky-500 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-1.5 font-bold uppercase tracking-wider">
                    <span className="flex items-baseline gap-1.5"><ArrowRightCircle size={10} /> Fondo Reinversión 30%</span>
                    <span className="font-mono">{fmt(retentionFund)}</span>
                </div>
            )}

            {/* Botones Biometría Rápidos */}
            {project.status === 'active' && isPigOrSow && (
                <div className="mt-3 flex gap-2 pt-3 border-t border-[var(--background-modifier-border)]/50">
                    <button 
                        onClick={() => onAddWeight?.(project.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--background-secondary)] hover:bg-[var(--interactive-hover)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg text-xs font-bold transition-colors"
                    >
                        <Scale size={14} className="text-sky-400" /> Registrar Peso
                    </button>
                    <button 
                        onClick={() => onAddMortality?.(project.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Skull size={14} /> Registrar Baja
                    </button>
                </div>
            )}

            {/* Deuda pendiente */}
            {pendingDebt > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    <span className="font-bold">Por cobrar:</span>
                    <span className="font-mono font-black">{fmt(pendingDebt)}</span>
                </div>
            )}
        </div>
    );
};
