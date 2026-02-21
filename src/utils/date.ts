// src/utils/date.ts

/**
 * Utilidad para manejar fechas respetando la zona horaria local.
 * Elimina la dependencia de constantes hardcodeadas para nombres de meses/días.
 * 
 * 🧪 TESTING MODE: Permite simular fechas sin cambiar la fecha del sistema.
 */

// Estado interno para la fecha simulada
let _simulatedDate: Date | null = null;

export const DateUtils = {
  /**
   * 🧪 Activa el modo de testing con una fecha simulada
   * @param dateStr Fecha en formato YYYY-MM-DD o null para desactivar
   */
  setSimulatedDate: (dateStr: string | null): void => {
    if (dateStr) {
      _simulatedDate = new Date(`${dateStr}T12:00:00`);
    } else {
      _simulatedDate = null;
    }
  },

  /**
   * 🧪 Devuelve true si el modo de testing está activo
   */
  isTestingMode: (): boolean => {
    return _simulatedDate !== null;
  },

  /**
   * 🧪 Obtiene la fecha simulada actual (si existe)
   */
  getSimulatedDate: (): string | null => {
    return _simulatedDate ? _simulatedDate.toISOString().split('T')[0] : null;
  },

  /**
   * Devuelve la fecha actual (real o simulada) como objeto Date
   */
  now: (): Date => {
    return _simulatedDate ? new Date(_simulatedDate) : new Date();
  },

  /**
   * Devuelve la fecha actual en formato YYYY-MM-DD local.
   */
  getToday: (): string => {
    const now = DateUtils.now();
    return now.toLocaleDateString('sv-SE'); // Hack estándar para ISO local
  },

  /**
   * Devuelve ISO string preservando hora local.
   */
  nowISO: (): string => {
    const now = DateUtils.now();
    return now.toISOString();
  },

  /**
   * Formatea YYYY-MM-DD a formato legible (ej: 23 Ene).
   */
  formatDisplay: (dateStr: string, locale: string = 'es-CO'): string => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T12:00:00`);
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  },

  /**
   * Obtiene el nombre de un mes dinámicamente según el idioma del sistema o configuración.
   * Reemplaza a la constante estática MONTHS.
   * @param monthIndex 0-11
   * @param locale 'es', 'en', etc.
   */
  getMonthName: (monthIndex: number, locale: string = 'es-CO'): string => {
    const date = new Date(2024, monthIndex, 1); // 2024 fue bisiesto, irrelevante aquí
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
  },

  /**
   * Genera la lista completa de meses para UI (Selects, Gráficas).
   */
  getAllMonths: (locale: string = 'es-CO'): string[] => {
    return Array.from({ length: 12 }, (_, i) => DateUtils.getMonthName(i, locale));
  }
}; 