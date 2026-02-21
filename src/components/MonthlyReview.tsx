// src/components/MonthlyReview.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Transaction, Asset, Currency } from '../types';
import { MonthlyEngine } from '../core/analytics/MonthlyEngine';
import { ClipboardCheck, Copy, Check, TrendingUp, Package, FileText, Bot, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTranslation } from '../hooks/useTranslation';

interface MonthlyReviewProps {
  transactions: Transaction[];
  assets: Asset[];
  exchangeRate: number;
  baseCurrency: Currency;
  privacyMode?: boolean;
}

// --- CONSTANTES DE DOMINIO ---
const HEALTHY_SAVINGS_RATE_THRESHOLD = 20; // % considerado saludable

export const MonthlyReview: React.FC<MonthlyReviewProps> = ({
  transactions,
  assets,
  exchangeRate,
  baseCurrency,
  privacyMode = false
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // 1. Congelamos el mes del reporte para evitar saltos si el usuario 
  // abre la app a las 11:59 PM del último día del mes.
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // 2. Consumo del motor analítico (Cálculos Puros)
  const reportData = useMemo(() =>
    MonthlyEngine.generate(transactions, assets, currentMonth, baseCurrency, exchangeRate)
    , [transactions, assets, currentMonth, baseCurrency, exchangeRate]);

  // 3. Generación del Markdown (Contenido del Fósil)
  const markdown = useMemo(() =>
    MonthlyEngine.convertToMarkdown(reportData, privacyMode, t)
    , [reportData, privacyMode, t]);

  // 4. Handler estable para el portapapeles
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  // 5. Formateo visual respetando privacidad
  const mask = useCallback((val: number, currency: Currency) => {
    if (privacyMode) return `•••• ${currency}`;
    return `${val.toLocaleString()} ${currency}`;
  }, [privacyMode]);

  // --- AI LOGIC ---
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const { state } = useFinance(); // Acceso al contexto para API Key

  const generateMonthInsight = async () => {
    if (!state.settings.geminiApiKey) {
      alert("Por favor configura tu API Key de Google Gemini en Configuración.");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey: state.settings.geminiApiKey });

      // Calcular Top Area localmente
      const areaMap: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense' && t.date.startsWith(reportData.month))
        .forEach(t => areaMap[t.area] = (areaMap[t.area] || 0) + t.amount);
      const topArea = Object.entries(areaMap).sort((a, b) => b[1] - a[1])[0];

      const prompt = `
            Act as a strict financial auditor. Review this monthly report:
            - Income: ${reportData.stats.income} ${baseCurrency}
            - Expense: ${reportData.stats.expense} ${baseCurrency}
            - Savings Rate: ${reportData.stats.savingsRate.toFixed(1)}%
            - Top Expense Area: ${topArea ? topArea[0] : 'None'} (${topArea ? topArea[1] : 0})
            
            Return JSON:
            {
                "rating": number (0-10),
                "headline": string (short punchy title),
                "summary": string (2 sentences analysis),
                "tips": string[] (3 specific actions)
            }
        `;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rating: { type: Type.NUMBER },
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const text = response.text;
      if (text) setAiResult(JSON.parse(text));

    } catch (e) {
      console.error(e);
      alert("Error generando insight IA");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto font-sans">

      {/* HEADER DE CIERRE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-normal)] italic uppercase">
            Cierre Mensual
          </h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm font-medium">
            Consolida tu fósil financiero para el Vault.
          </p>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copiar reporte en formato Markdown"
          className="bg-[var(--interactive-accent)] hover:opacity-90 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copiado' : 'Copiar Markdown'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* RESUMEN DE FLUJO (Visualización Rápida) */}
        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2rem] p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-[var(--interactive-accent)] font-black uppercase text-[10px] tracking-[0.2em]">
            <TrendingUp size={16} /> Flujo de Caja Neto
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">
                INGRESOS
              </div>
              <div className="text-2xl font-mono text-emerald-500 font-black">
                {mask(reportData.stats.income, baseCurrency)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">
                EGRESOS
              </div>
              <div className="text-2xl font-mono text-rose-500 font-black">
                {mask(reportData.stats.expense, baseCurrency)}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--background-modifier-border)]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Tasa de Ahorro:
              </span>
              <span className={`text-2xl font-black font-mono ${reportData.stats.savingsRate >= HEALTHY_SAVINGS_RATE_THRESHOLD
                ? 'text-emerald-500'
                : 'text-amber-500'
                }`}>
                {reportData.stats.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVOS PRODUCTIVOS */}
        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2rem] p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em]">
            <Package size={16} /> Rendimiento de Proyectos
          </div>
          <div className="space-y-3">
            {reportData.assets.length > 0 ? (
              reportData.assets.slice(0, 4).map((a, idx) => (
                <div
                  key={`${a.name}-${idx}`}
                  className="flex justify-between items-center bg-[var(--background-primary)] p-3 rounded-xl border border-[var(--background-modifier-border)]"
                >
                  <span className="text-xs text-[var(--text-normal)] font-bold">{a.name}</span>
                  <span className="text-xs font-mono font-black text-emerald-500">
                    {a.roi.toFixed(1)}% ROI
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic text-center py-4">
                No hay proyectos activos en este periodo.
              </div>
            )}
          </div>
        </div>

        {/* AI INSIGHTS */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2rem] p-8 md:col-span-2 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">
              <Bot size={16} /> {t('ai.monthly_analysis')}
            </div>
            {!aiResult && (
              <button
                onClick={generateMonthInsight}
                disabled={isGeneratingAi}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingAi ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />}
                {isGeneratingAi ? t('ai.generating') : t('ai.generate_btn')}
              </button>
            )}
          </div>

          {aiResult && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-4">
              <div className="flex items-start gap-4">
                <div className="text-4xl font-black font-mono text-indigo-300 opacity-90">
                  {aiResult.rating}/10
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-indigo-200 mb-1">{aiResult.headline}</h3>
                  <p className="text-sm text-indigo-200/80 leading-relaxed">{aiResult.summary}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-indigo-500/20">
                {aiResult.tips.map((tip: string, i: number) => (
                  <div key={i} className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-500/10">
                    <span className="text-[9px] font-black text-indigo-400 uppercase block mb-1">Tip #{i + 1}</span>
                    <span className="text-xs text-indigo-100 font-medium">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PREVIEW DEL MARKDOWN (El artefacto final) */}
        <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-[2rem] p-6 md:col-span-2 overflow-hidden shadow-inner">
          <div className="flex items-center gap-2 mb-4 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
            <FileText size={14} /> Vista Previa del Artefacto (.md)
          </div>
          <pre
            tabIndex={0}
            className="text-[11px] font-mono text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed select-all cursor-text bg-[var(--background-secondary)] p-6 rounded-2xl border border-[var(--background-modifier-border)] max-h-[300px] overflow-y-auto custom-scrollbar focus:ring-1 focus:ring-[var(--interactive-accent)] outline-none"
          >
            {markdown}
          </pre>
        </div>
      </div>

      <div className="flex justify-center pt-4 opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Finance OS • Immutable Record Engine
        </p>
      </div>

    </div>
  );
};

export default MonthlyReview;