import React, { useState, useMemo } from 'react';
import { Currency, Transaction, Asset, Trade, Loan, Debt } from '../types';
import { RefreshCw, ArrowRight, Plane, Globe, Wallet, AlertTriangle, TrendingUp, Clock, DollarSign, Package, Percent } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { useTranslation } from '../hooks/useTranslation';
import { useDealScoring } from '../hooks/useDealScoring';
import { SelectStyled } from './ui/SelectStyled';

interface DealCalculatorProps {
  transactions: Transaction[];
  assets: Asset[];
  trades: Trade[];
  loans: Loan[];
  debts: Debt[];
  baseCurrency: Currency;
  systemExchangeRate: number;
  aiEnabled?: boolean;
  apiKey?: string;
}

const SUPPORTED_CURRENCIES: Currency[] = ['COP', 'USD', 'EUR', 'GBP', 'MXN', 'BRL'];

const DealCalculator: React.FC<DealCalculatorProps> = ({
  assets,
  trades,
  loans,
  debts,
  baseCurrency,
  systemExchangeRate,
  aiEnabled = true,
  apiKey
}) => {
  const { t } = useTranslation();

  // --- FX CONVERTER STATE ---
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState<Currency>(baseCurrency);
  const [toCurrency, setToCurrency] = useState<Currency>('USD');
  const [customRate, setCustomRate] = useState<string>('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // --- DEAL CALCULATOR STATE ---
  const [dealQty, setDealQty] = useState<string>('1');
  const [dealCost, setDealCost] = useState<string>('0');
  const [dealExtras, setDealExtras] = useState<string>('0');
  const [dealPrice, setDealPrice] = useState<string>('0');
  const [dealMonths, setDealMonths] = useState<string>('1');

  // --- FX LOGIC ---
  const fetchRate = async () => {
    if (!aiEnabled || !apiKey) {
      alert(t('common.no_api_key'));
      return;
    }
    setIsFetchingRate(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `Exchange rate from 1 ${fromCurrency} to ${toCurrency}. Return JSON: {"rate": 0.00025}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { rate: { type: Type.NUMBER } }
          }
        }
      });

      const text = response.text;
      const jsonStr = typeof text === 'string' ? text : JSON.stringify(text);
      const data = JSON.parse(jsonStr || "{}");

      if (data.rate) setCustomRate(data.rate.toString());
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingRate(false);
    }
  };

  const calculatedAmount = useMemo(() => {
    const val = parseFloat(amount);
    const rate = parseFloat(customRate);
    if (isNaN(val) || isNaN(rate)) return 0;
    return val * rate;
  }, [amount, customRate]);

  // --- DEAL LOGIC ---
  const dealMetrics = useMemo(() => {
    const qty = parseFloat(dealQty) || 0;
    const cost = parseFloat(dealCost) || 0;
    const extras = parseFloat(dealExtras) || 0;
    const price = parseFloat(dealPrice) || 0;
    const months = parseFloat(dealMonths) || 1;

    const totalInvestment = (qty * cost) + extras;
    const totalRevenue = qty * price;
    const netProfit = totalRevenue - totalInvestment;

    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    const breakevenPrice = qty > 0 ? totalInvestment / qty : 0;
    const breakEvenUnits = price > 0 ? totalInvestment / price : 0;

    // Safety Margin: (Price - Breakeven) / Price
    const safetyMargin = price > 0 ? ((price - breakevenPrice) / price) * 100 : 0;

    // Payback Period: If constant sales over time
    // Revenue per month = Total Revenue / Months
    // Payback = Total Investment / (Net Profit / Months) -> simplified: Months / ROI factor? 
    // Actually: If I make NetProfit in X months, how many months to cover investment?
    // Payback = (Investment / NetProfit) * Months
    const paybackMonths = netProfit > 0 ? (totalInvestment / netProfit) * months : 0;

    // CAGR 
    let cagr = 0;
    if (months > 0 && totalInvestment > 0 && totalRevenue > 0) {
      const years = months / 12;
      cagr = (Math.pow(totalRevenue / totalInvestment, 1 / years) - 1) * 100;
    }

    return { totalInvestment, totalRevenue, netProfit, margin, roi, breakevenPrice, breakEvenUnits, cagr, safetyMargin, paybackMonths };
  }, [dealQty, dealCost, dealExtras, dealPrice, dealMonths]);

  // --- SCORING HOOK ---
  const score = useDealScoring({
    roi: dealMetrics.roi,
    margin: dealMetrics.margin,
    totalInvestment: dealMetrics.totalInvestment,
    netProfit: dealMetrics.netProfit,
    paybackMonths: dealMetrics.paybackMonths,
    safetyMargin: dealMetrics.safetyMargin
  });

  const format = (v: number, curr: string) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: curr }).format(v);
  };

  // Helper for Score Ring
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score.totalScore / 100) * circumference;
  const scoreColor = score.totalScore >= 80 ? '#10B981' : score.totalScore >= 50 ? '#F59E0B' : '#F43F5E';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-black tracking-tight italic flex items-center gap-3 text-[var(--text-normal)]">
          <Plane className="text-sky-500" /> {t('fx.title')}
        </h1>
        <p className="text-[var(--text-muted)] mt-1">{t('fx.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: FX CALCULATOR (Unchanged) */}
        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2.5rem] p-8 shadow-xl h-fit">
          {/* ... existing FX UI ... */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={14} /> {t('fx.converter')}
            </h3>
            {aiEnabled && (
              <button
                onClick={fetchRate}
                disabled={isFetchingRate}
                className="bg-[var(--interactive-accent)]/10 hover:bg-[var(--interactive-accent)]/20 text-[var(--interactive-accent)] px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Globe size={12} className={isFetchingRate ? 'animate-spin' : ''} /> {isFetchingRate ? '...' : t('fx.sync_rate')}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase pl-1">{t('common.amount')}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl p-3 text-[var(--text-normal)] font-mono text-lg outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase pl-1">{t('fx.source')}</label>
                <SelectStyled
                  value={fromCurrency}
                  onChange={v => setFromCurrency(v as Currency)}
                  options={SUPPORTED_CURRENCIES.map(c => ({ value: c, label: c }))}
                />
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-[var(--background-secondary)] p-1.5 rounded-full border border-[var(--background-modifier-border)]">
                <ArrowRight size={16} className="text-[var(--text-muted)] rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase pl-1">{t('fx.rate')}</label>
                <input
                  type="number"
                  value={customRate}
                  onChange={e => setCustomRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl p-3 text-sky-400 font-mono text-sm outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase pl-1">{t('fx.target')}</label>
                <SelectStyled
                  value={toCurrency}
                  onChange={v => setToCurrency(v as Currency)}
                  options={SUPPORTED_CURRENCIES.map(c => ({ value: c, label: c }))}
                />
              </div>
            </div>

            <div className="bg-[var(--interactive-accent)]/10 border border-[var(--interactive-accent)]/20 rounded-2xl p-4 mt-4 text-center">
              <div className="text-[10px] font-black text-[var(--interactive-accent)] uppercase tracking-widest mb-1">{t('fx.result')}</div>
              <div className="text-3xl font-black font-mono text-[var(--text-normal)]">
                {format(calculatedAmount, toCurrency)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DEAL CALCULATOR */}
        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col">

          <div className="absolute top-0 right-0 p-12 opacity-[0.03] bg-[var(--interactive-accent)] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 flex-1">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black italic text-[var(--text-normal)] flex items-center gap-2">
                  <TrendingUp size={20} className="text-[var(--interactive-accent)]" />
                  {t('deal.title')}
                </h3>
                <p className="text-xs text-[var(--text-muted)] opacity-80">{t('deal.subtitle')}</p>
              </div>

              {/* DEAL SCORE WIDGET */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle cx="32" cy="32" r={radius} fill="transparent" stroke={scoreColor} strokeWidth="4"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-[var(--text-normal)]">{score.totalScore}</span>
                  <span className="text-[8px] font-bold text-[var(--text-muted)]">{score.rating}</span>
                </div>
              </div>
            </header>

            {/* --- INPUTS --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1"><Package size={10} /> {t('deal.quantity')}</label>
                <input type="number" value={dealQty} onChange={e => setDealQty(e.target.value)} className="w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)] rounded-xl p-2.5 text-[var(--text-normal)] font-mono outline-none focus:border-[var(--interactive-accent)] transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1"><Clock size={10} /> {t('deal.time')}</label>
                <input type="number" value={dealMonths} onChange={e => setDealMonths(e.target.value)} className="w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)] rounded-xl p-2.5 text-[var(--text-normal)] font-mono outline-none focus:border-[var(--interactive-accent)] transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1"><DollarSign size={10} /> {t('deal.unit_cost')}</label>
                <input type="number" value={dealCost} onChange={e => setDealCost(e.target.value)} className="w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)] rounded-xl p-2.5 text-[var(--text-normal)] font-mono outline-none focus:border-[var(--interactive-accent)] transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1"><AlertTriangle size={10} /> {t('deal.extras')}</label>
                <input type="number" value={dealExtras} onChange={e => setDealExtras(e.target.value)} className="w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)] rounded-xl p-2.5 text-[var(--text-normal)] font-mono outline-none focus:border-[var(--interactive-accent)] transition-colors" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-[var(--interactive-accent)] uppercase flex items-center gap-1"><DollarSign size={10} /> {t('deal.sell_price')}</label>
                <input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl p-3 text-[var(--text-normal)] font-mono text-lg font-bold outline-none focus:border-[var(--interactive-accent)] transition-colors" />
              </div>
            </div>

            <div className="h-px bg-[var(--background-modifier-border)] w-full" />

            {/* --- RESULTS --- */}
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--background-modifier-form-field)] rounded-xl p-3 border border-[var(--background-modifier-border)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{t('deal.investment')}</div>
                  <div className="text-sm font-mono font-bold text-[var(--text-normal)]">{format(dealMetrics.totalInvestment, baseCurrency)}</div>
                </div>
                <div className="bg-[var(--background-modifier-form-field)] rounded-xl p-3 border border-[var(--background-modifier-border)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{t('deal.revenue')}</div>
                  <div className="text-sm font-mono font-bold text-[var(--interactive-accent)]">{format(dealMetrics.totalRevenue, baseCurrency)}</div>
                </div>
              </div>

              {/* Profit & ROI Card */}
              <div className={`p-5 rounded-2xl border flex flex-col items-center text-center transition-colors bg-[var(--background-modifier-form-field)] border-[var(--background-modifier-border)]`}>
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80" style={{ color: dealMetrics.netProfit >= 0 ? '#34d399' : '#fb7185' }}>{t('deal.profit')}</div>
                <div className="text-3xl font-black font-mono text-[var(--text-normal)] tracking-tight mb-2">
                  {dealMetrics.netProfit >= 0 ? '+' : ''}{format(dealMetrics.netProfit, baseCurrency)}
                </div>

                <div className="flex gap-3 text-xs font-bold">
                  <span className={`px-2 py-0.5 rounded-md ${dealMetrics.roi >= 0 ? 'bg-[var(--interactive-accent)]/20 text-[var(--interactive-accent)]' : 'bg-[var(--text-error)]/20 text-[var(--text-error)]'}`}>
                    ROI: {dealMetrics.roi.toFixed(1)}%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[var(--background-secondary)] text-[var(--text-muted)]">
                    {t('deal.margin')}: {dealMetrics.margin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Advanced Metrics */}
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="flex justify-between p-2 bg-[var(--background-modifier-form-field)] rounded-lg">
                  <span className="text-[var(--text-muted)] uppercase font-bold">{t('deal.breakeven') || "Min Price"}:</span>
                  <span className="font-mono text-[var(--text-normal)]">{format(dealMetrics.breakevenPrice, baseCurrency)}/u</span>
                </div>
                <div className="flex justify-between p-2 bg-[var(--background-modifier-form-field)] rounded-lg">
                  <span className="text-[var(--text-muted)] uppercase font-bold">{t('deal.min_qty') || "Min Qty"}:</span>
                  <span className="font-mono text-[var(--interactive-accent)] font-bold">{Math.ceil(dealMetrics.breakEvenUnits).toLocaleString()} u</span>
                </div>
                <div className="col-span-2 flex justify-between p-2 bg-[var(--background-modifier-form-field)] rounded-lg">
                  <span className="text-[var(--text-muted)] uppercase font-bold flex items-center gap-1"><Percent size={8} /> {t('deal.annualized')}:</span>
                  <span className={`font-mono font-bold ${dealMetrics.cagr > 0 ? 'text-[var(--interactive-accent)]' : 'text-[var(--text-muted)]'}`}>
                    {dealMetrics.cagr.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCalculator;