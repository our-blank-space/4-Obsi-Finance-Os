import { Currency } from '../types';

// Configuración regional por defecto.
// 'es-CO' usa puntos para miles (1.000) y coma para decimales, 
// similar a lo que usabas con 'de-DE' pero semánticamente correcto para COP.
// Configuración regional por defecto: undefined para usar la del sistema
// o se pasa explícitamente desde el hook useCurrency según el idioma.
const DEFAULT_LOCALE = undefined;

export const FormattingUtils = {

  /**
   * Oculta un valor si el modo de privacidad está activo.
   * @param value El valor a mostrar.
   * @param isPrivate Si es true, devuelve asteriscos.
   */
  mask: (value: string | number, isPrivate: boolean): string => {
    if (isPrivate) return "••••••";
    return String(value);
  },

  /**
   * Formatea un número como moneda.
   * Maneja automáticamente el modo privacidad.
   */
  formatCurrency: (
    amount: number,
    currency: Currency,
    isPrivate: boolean = false,
    locale?: string
  ): string => {
    if (isPrivate) return "••••••";

    // Detectar si necesitamos decimales (USD/EUR suelen usarlos, COP no tanto)
    const safeCurrency = currency || 'COP';
    const showDecimals = safeCurrency === 'USD' || safeCurrency === 'EUR' || safeCurrency === 'GBP';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  },

  /**
   * Formatea un número simple con separadores de miles.
   * Útil para cantidades de activos o métricas sin símbolo de moneda.
   */
  formatNumber: (
    amount: number,
    isPrivate: boolean = false,
    locale?: string
  ): string => {
    if (isPrivate) return "••••";
    return new Intl.NumberFormat(locale).format(amount);
  },

  /**
   * Convierte un string de input formateado a un número puro.
   */
  parseInputToNumber: (val: string): number => {
    if (!val) return 0;
    // Basic heuristics for parsing local formats
    // Remove thousands separators (dots or commas depending on context is hard without locale)
    // For now, we assume "dot" is thousands and "comma" is decimal if both exist, 
    // or standard US if only dot exist?
    // This is tricky without explicit locale in parsing. 
    // We'll stick to the previous robust replacing logic for now but maybe we should relax it?
    // The previous logic was: remove dots, replace comma with dot. This implies ES-CO/DE-DE format.
    // If we want neutrality, we should accept both.

    let clean = val.replace(/[^\d.,-]/g, ''); // Keep only nums, dots, commas, minus

    // Si tiene comas y puntos, asumimos que el último es el decimal
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');

    if (lastComma > -1 && lastDot > -1) {
      if (lastComma > lastDot) { // 1.000,50
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else { // 1,000.50
        clean = clean.replace(/,/g, '');
      }
    } else if (lastComma > -1) {
      // Solo comas. ¿Es 1,000 (mil) o 0,5 (medio)?
      // Asumimos decimal si es español, pero aquí no sabemos.
      // Estandarización: Reemplazar coma por punto para JS parseFloat es seguro si es decimal.
      // Si es mil (1,000), parseFloat('1,000') -> 1. 
      // Es complejo. Por ahora mantendremos compatibilidad con el sistema anterior que prefería coma decimal.
      clean = clean.replace(',', '.');
    }
    // Si solo tiene puntos 1.000 -> 1000 (parsea ok si quitamos punto)
    // Pero 1.5 (uno punto cinco) -> 1.5
    // DEPRECATED logic relied on fixed locale.
    // Let's rely on user input being simple for now or strictly standard.

    // Fallback previous logic for safety until full localized input is ready:
    const safeClean = val.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(safeClean);
    return isNaN(parsed) ? 0 : parsed;
  },

  /**
   * Formatea un valor mientras el usuario escribe en un input.
   */
  formatInputOnType: (val: string, locale?: string): string => {
    if (!val) return '';

    // Detectar si estamos escribiendo decimales (si hay una coma o punto)
    // Esto debería ser dirigido por el locale.
    // Simplificación: usaremos Intl para formatear la parte entera.

    // TODO: A better input mask library is recommended for "neutral" typing.
    // For now returning raw val to let browser handle it or use basic formatting
    return val;
  },

  /**
   * Formato compacto para números grandes.
   */
  formatCompact: (
    amount: number,
    currency: Currency,
    isPrivate: boolean = false,
    locale?: string
  ): string => {
    if (isPrivate) return "•••";

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
}; 