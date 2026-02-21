// src/components/AnnualReport.tsx
import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Award } from 'lucide-react';
import { Transaction, Currency, WeeklySnapshot } from '../types';
import { AnnualEngine } from '../core/analytics/AnnualEngine'; // <--- EL CEREBRO
import { InsightLevel } from '../types/analytics';

interface AnnualReportProps {
  transactions: Transaction[];
  snapshots: WeeklySnapshot[]; // Reservado para gráfico de patrimonio futuro
  baseCurrency: Currency;
  exchangeRate: number;
}

const AnnualReport: React.FC<AnnualReportProps> = ({ transactions, baseCurrency, exchangeRate }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 1. Selector de Años (Lógica de UI)
  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    transactions.forEach(t => yearsSet.add(new Date(t.date).getFullYear()));
    yearsSet.add(currentYear);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // 2. OBTENCIÓN DE DATOS (Delegada al Core)
  const report = useMemo(() => {
    return AnnualEngine.generate(transactions, selectedYear, baseCurrency, exchangeRate);
  }, [transactions, selectedYear, baseCurrency, exchangeRate]);

  // 3. Helpers de Visualización (Solo UI)
  const format = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(val);

  const getInsightIcon = (level: InsightLevel) => {
      switch(level) {
          case 'critical': return <AlertTriangle size={40} className="text-white opacity-90"/>;
          case 'warning': return <TrendingDown size={40} className="text-white opacity-90"/>;
          case 'excellent': return <Award size={40} className="text-white opacity-90"/>;
          default: return <TrendingUp size={40} className="text-white opacity-90"/>;
      }
  };

  const getInsightColor = (level: InsightLevel) => {
      switch(level) {
          case 'critical': return 'bg-rose-500';
          case 'warning': return 'bg-amber-500';
          case 'excellent': return 'bg-emerald-600';
          default: return 'bg-blue-600'; // Healthy
      }
  };

  const getInsightMessage = (code: string) => {
      // En un sistema real, esto vendría de i18n (t(code))
      const messages: Record<string, string> = {
          'negative_flow': 'Flujo de caja negativo. Los gastos superaron a los ingresos este año.',
          'low_savings': 'Capacidad de ahorro reducida. Revisa gastos hormiga y recurrentes.',
          'healthy_savings': 'Finanzas saludables. Estás construyendo patrimonio consistentemente.',
          'high_performance': '¡Rendimiento excepcional! Tasa de ahorro superior al 30%.'
      };
      return messages[code] || 'Análisis completado.';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic text-[var(--text-normal)]">RESUMEN ANUAL {selectedYear}</h2>
          <p className="text-[var(--text-muted)] text-sm">Análisis de rendimiento fiscal</p>
        </div>
        
        <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)] overflow-x-auto max-w-full">
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedYear === year ? 'bg-[var(--interactive-accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            title="Ingresos" 
            value={format(report.stats.income)} 
            icon={<ArrowUpRight size={24} className="text-emerald-500"/>} 
            bg="bg-emerald-500/10"
        />
        <StatCard 
            title="Gastos" 
            value={format(report.stats.expense)} 
            icon={<ArrowDownRight size={24} className="text-rose-500"/>} 
            bg="bg-rose-500/10"
        />
        <StatCard 
            title={`Ahorro (${report.stats.savingsRate.toFixed(1)}%)`} 
            value={format(report.stats.savings)} 
            icon={<Wallet size={24} className="text-[var(--interactive-accent)]"/>} 
            bg="bg-[var(--interactive-accent)]/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP AREAS CHART */}
        <div className="bg-[var(--background-secondary)]/30 p-8 rounded-3xl border border-[var(--background-modifier-border)]">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2 italic text-[var(--text-normal)]">
            <TrendingDown size={20} className="text-rose-500"/> MAYORES GASTOS
          </h3>
          <div className="space-y-5">
            {report.topAreas.map((area) => (
              <div key={area.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-bold uppercase text-[var(--text-normal)]">{area.name}</span>
                  <span className="text-[var(--text-muted)] font-mono">{format(area.amount)}</span>
                </div>
                <div className="h-2.5 w-full bg-[var(--background-primary)] rounded-full overflow-hidden border border-[var(--background-modifier-border)]">
                  <div 
                    className="h-full bg-rose-500 opacity-80" 
                    style={{ width: `${area.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--text-muted)] text-right">{area.percentage.toFixed(1)}% del gasto</div>
              </div>
            ))}
            {report.topAreas.length === 0 && <div className="text-center text-[var(--text-muted)] py-10">Sin datos de gastos este año.</div>}
          </div>
        </div>

        {/* INSIGHT CARD (Ahora Data-Driven) */}
        <div className={`${getInsightColor(report.insight.level)} p-8 rounded-3xl text-white flex flex-col justify-center shadow-lg relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"/>
          
          <div className="relative z-10">
            <div className="mb-6">{getInsightIcon(report.insight.level)}</div>
            <h3 className="text-2xl font-black leading-tight mb-3 italic uppercase">
                {report.insight.level === 'critical' ? 'Atención Requerida' : 
                 report.insight.level === 'warning' ? 'Precaución' :
                 report.insight.level === 'excellent' ? 'Excelente Año' : 'Buen Balance'}
            </h3>
            <p className="text-white/90 text-sm leading-relaxed font-medium">
                {getInsightMessage(report.insight.code)}
            </p>
            
            <div className="mt-8 pt-6 border-t border-white/20 flex gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase opacity-70">Tasa Ahorro</div>
                    <div className="text-xl font-mono font-bold">{report.stats.savingsRate.toFixed(1)}%</div>
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase opacity-70">Resultado Neto</div>
                    <div className="text-xl font-mono font-bold">{format(report.stats.savings)}</div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Subcomponente simple para tarjetas
const StatCard = ({ title, value, icon, bg }: any) => (
    <div className="bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)] flex flex-col gap-4 relative overflow-hidden group">
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>{icon}</div>
        <div className="relative z-10">
            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-[var(--text-normal)] font-mono tracking-tight">{value}</p>
        </div>
    </div>
);

export default AnnualReport; 