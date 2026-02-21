import React, { useState, useMemo, useCallback } from 'react';
import {
  Calculator, AlertTriangle, CheckCircle2, Copy,
  Briefcase, TrendingUp, ShieldAlert, Award
} from 'lucide-react';

import { Business, Core } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { NumericInput } from './ui/NumericInput';

// --- 1. CONSTANTES SEMÁNTICAS (Configuración fuera del render) ---

const COMPLEXITY_MULTIPLIER: Record<Business.QuoteComplexity, number> = {
  [Business.QuoteComplexity.LOW]: 0,
  [Business.QuoteComplexity.MEDIUM]: 0.15,
  [Business.QuoteComplexity.HIGH]: 0.35,
};

const VALUE_MULTIPLIER: Record<Business.QuoteValue, number> = {
  [Business.QuoteValue.NORMAL]: 0,
  [Business.QuoteValue.HIGH]: 0.25,
  [Business.QuoteValue.CRITICAL]: 0.5,
};

// --- 2. LÓGICA DE NEGOCIO PURA (Testeable y Aislada) ---

const calculateQuote = (
  hours: number,
  rate: number,
  complexity: Business.QuoteComplexity,
  value: Business.QuoteValue,
  riskBuffer: number
): Business.QuoteResult => {
  // Evitamos NaNs propagados protegiendo las entradas aquí también
  const safeHours = Math.max(0, hours);
  const safeRate = Math.max(0, rate);

  const base = safeHours * safeRate;
  const complexityAdj = base * COMPLEXITY_MULTIPLIER[complexity];
  const riskAdj = base * (riskBuffer / 100);
  const valueAdj = base * VALUE_MULTIPLIER[value];

  const total = base + complexityAdj + riskAdj + valueAdj;

  return {
    base,
    complexityAdj,
    riskAdj,
    valueAdj,
    total,
    hourlyEffective: safeHours > 0 ? total / safeHours : 0
  };
};

// --- 3. COMPONENTE PRINCIPAL ---

export const WorkQuotation: React.FC = () => {
  const { format, baseCurrency } = useCurrency();
  const { t } = useTranslation();

  // Estado estrictamente numérico (Adiós parseFloat en render)
  const [hours, setHours] = useState<number>(10);
  const [rate, setRate] = useState<number>(25);
  const [riskBuffer, setRiskBuffer] = useState<number>(10);

  // Enums para estados categóricos
  const [complexity, setComplexity] = useState<Business.QuoteComplexity>(Business.QuoteComplexity.MEDIUM);
  const [value, setValue] = useState<Business.QuoteValue>(Business.QuoteValue.NORMAL);

  // Memoización de la lógica pesada
  const quote = useMemo(
    () => calculateQuote(hours, rate, complexity, value, riskBuffer),
    [hours, rate, complexity, value, riskBuffer]
  );

  // Callback estable para eventos
  const copyToClipboard = useCallback(() => {
    const text = `
📜 Cotización Estimada
----------------------
Base: ${format(quote.base, baseCurrency)} (${hours}h @ ${rate}/h)
+ Complejidad: ${format(quote.complexityAdj, baseCurrency)}
+ Riesgo: ${format(quote.riskAdj, baseCurrency)}
+ Valor Cliente: ${format(quote.valueAdj, baseCurrency)}
----------------------
TOTAL: ${format(quote.total, baseCurrency)}
    `.trim();
    navigator.clipboard.writeText(text);
  }, [quote, hours, rate, baseCurrency, format]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight italic text-[var(--text-normal)] flex items-center gap-3">
            <Briefcase className="text-[var(--interactive-accent)]" />
            Cotizador Inteligente
          </h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm font-medium">Calcula precios justos basados en valor, no solo tiempo.</p>
        </div>
        <Button onClick={copyToClipboard} icon={<Copy size={16} />} variant="secondary">
          Copiar Resumen
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* INPUTS PANEL */}
        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
          <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest mb-4 flex items-center gap-2">
            <Calculator size={14} /> Parámetros
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Horas Estimadas"
              type="number"
              value={hours || ''}
              onChange={e => setHours(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
            <NumericInput
              label="Tarifa Hora Base"
              value={rate}
              onValueChange={val => setRate(parseFloat(val) || 0)}
              currency={baseCurrency}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Nivel Complejidad"
              value={complexity}
              onChange={e => setComplexity(e.target.value as Business.QuoteComplexity)}
              options={[
                { value: Business.QuoteComplexity.LOW, label: 'Baja (Estándar)' },
                { value: Business.QuoteComplexity.MEDIUM, label: 'Media (+15%)' },
                { value: Business.QuoteComplexity.HIGH, label: 'Alta (+35%)' }
              ]}
            />
            <Select
              label="Valor para Cliente"
              value={value}
              onChange={e => setValue(e.target.value as Business.QuoteValue)}
              options={[
                { value: Business.QuoteValue.NORMAL, label: 'Normal' },
                { value: Business.QuoteValue.HIGH, label: 'Alto (+25%)' },
                { value: Business.QuoteValue.CRITICAL, label: 'Crítico (+50%)' }
              ]}
            />
          </div>

          <div className="pt-4 border-t border-[var(--background-modifier-border)]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Colchón de Riesgo</label>
              <span className="text-xs font-bold text-[var(--text-normal)]">{riskBuffer}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={riskBuffer}
              onChange={e => setRiskBuffer(parseFloat(e.target.value) || 0)}
              className="w-full accent-[var(--interactive-accent)] h-2 bg-[var(--background-primary)] rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-2">Margen para imprevistos, correcciones o retrasos.</p>
          </div>
        </div>

        {/* RESULTS PANEL */}
        <div className="space-y-6">

          {/* MAIN TOTAL */}
          <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[var(--interactive-accent)]/5 group-hover:bg-[var(--interactive-accent)]/10 transition-colors"></div>
            <h3 className="relative z-10 text-xs font-black uppercase text-[var(--text-muted)] tracking-widest mb-2">Precio Recomendado</h3>
            <div className="relative z-10 text-5xl font-black font-mono tracking-tighter text-[var(--interactive-accent)]">
              {format(quote.total, baseCurrency)}
            </div>
            <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] text-[10px] font-bold text-[var(--text-muted)]">
              <TrendingUp size={12} /> Tarifa Efectiva: {format(quote.hourlyEffective, baseCurrency)}/h
            </div>
          </div>

          {/* BREAKDOWN (Usando Subcomponente Tipado) */}
          <div className="bg-[var(--background-secondary)]/50 border border-[var(--background-modifier-border)] rounded-3xl p-6 space-y-3">
            <Row label="Costo Base (Tiempo)" value={quote.base} currency={baseCurrency} format={format} />
            <Row label="Ajuste Complejidad" value={quote.complexityAdj} currency={baseCurrency} format={format} icon={<TrendingUp size={12} className="text-amber-500" />} />
            <Row label="Buffer de Riesgo" value={quote.riskAdj} currency={baseCurrency} format={format} icon={<ShieldAlert size={12} className="text-rose-500" />} />
            <Row label="Valor Agregado" value={quote.valueAdj} currency={baseCurrency} format={format} icon={<Award size={12} className="text-emerald-500" />} />
          </div>

          {/* FEEDBACK */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${quote.total < quote.base ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
            {quote.total < quote.base ? <AlertTriangle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
            <div className="text-xs font-medium leading-relaxed">
              {quote.total < quote.base
                ? "¡Cuidado! Estás cobrando por debajo de tu costo base. Estás asumiendo el riesgo gratis."
                : "Precio saludable. Cubres tu tiempo, proteges contra riesgos y cobras por el valor aportado."}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- 4. SUBCOMPONENTES TIPADOS ---

interface RowProps {
  label: string;
  value: number;
  currency: Core.Currency;
  format: (value: number, currency: Core.Currency) => string;
  icon?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, value, currency, format, icon }) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2 text-[var(--text-muted)] font-medium">
      {icon || <div className="w-3" />} {label}
    </div>
    <div className={`font-mono font-bold ${value > 0 ? 'text-[var(--text-normal)]' : 'text-[var(--text-faint)]'}`}>
      {value > 0 ? '+' : ''}{format(value, currency)}
    </div>
  </div>
);

export default WorkQuotation;