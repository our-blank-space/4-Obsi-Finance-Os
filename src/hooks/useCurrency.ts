
import { useCallback, useMemo } from 'react';
import { useFinanceData, useFinanceUI } from '../context/FinanceContext';
import { FormattingUtils } from '../utils/formatting';
// ✅ IMPORTACIÓN CORRECTA DESDE EL BARREL FILE NAMESPACED
import { Core, Ledger } from '../types';
import { CurrencyMath } from '../utils/math';

export const useCurrency = () => {
  const { exchangeRates, baseCurrency, exchangeRate, settings } = useFinanceData();
  const { isPrivacyMode } = useFinanceUI();

  const locale = settings?.language === 'es' ? 'es-CO' : undefined;

  // Backwards compatibility inteligente
  const rates: Record<string, number> = useMemo(() =>
    exchangeRates || { 'USD': exchangeRate || 4000 },
    [exchangeRates, exchangeRate]
  );

  const getRate = useCallback((currency: Core.Currency): number => {
    if (currency === baseCurrency) return 1;
    // Si no existe la tasa, retornamos 1 para no romper la matemática (safe fallback)
    return rates[currency] || 1;
  }, [rates, baseCurrency]);

  const toBase = useCallback((amount: number, from: Core.Currency): number => {
    if (!amount) return 0;
    const fromCurrency = from || baseCurrency;
    if (fromCurrency === baseCurrency) return amount;

    const rate = getRate(fromCurrency);
    return CurrencyMath.mul(amount, rate);
  }, [baseCurrency, getRate]);

  // Re-exportamos las funciones necesarias
  const fromBase = useCallback((amountInBase: number, to: Core.Currency): number => {
    if (!amountInBase || to === baseCurrency) return amountInBase;
    const rate = getRate(to);
    if (rate === 0) return amountInBase;
    const inverseRate = 1 / rate;
    return CurrencyMath.mul(amountInBase, inverseRate);
  }, [baseCurrency, getRate]);

  const convert = useCallback((amount: number, from: Core.Currency, to: Core.Currency): number => {
    if (from === to || !amount) return amount;
    const amountInBase = toBase(amount, from);
    return fromBase(amountInBase, to);
  }, [toBase, fromBase]);

  const getHistoricalValue = useCallback((t: Ledger.Transaction): number => {
    if (!t) return 0;
    if ((t as any).amountBase !== undefined) return (t as any).amountBase;
    if (t.currency === baseCurrency) return t.amount;
    if (t.exchangeRateSnapshot) return CurrencyMath.mul(t.amount, t.exchangeRateSnapshot);
    return toBase(t.amount, t.currency);
  }, [baseCurrency, toBase]);

  const format = useCallback((amount: number, currency: Core.Currency, privacyPlaceholder = false) => {
    const effectivePrivacy = privacyPlaceholder || isPrivacyMode;
    return FormattingUtils.formatCurrency(amount, currency, effectivePrivacy, locale);
  }, [locale, isPrivacyMode]);

  const formatCompact = useCallback((amount: number, currency: Core.Currency, privacyPlaceholder = false) => {
    const effectivePrivacy = privacyPlaceholder || isPrivacyMode;
    return FormattingUtils.formatCompact(amount, currency, effectivePrivacy, locale);
  }, [locale, isPrivacyMode]);

  return {
    exchangeRates: rates,
    baseCurrency,
    convert,
    toBase,
    fromBase,
    getRate,
    getHistoricalValue,
    format,
    formatCompact,
    isPrivacyMode,
  };
};