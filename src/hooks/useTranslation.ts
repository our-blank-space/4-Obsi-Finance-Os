import { useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TRANSLATIONS } from '../utils/translations';
import { Language } from '../types';

export const useTranslation = () => {
  const { state, dispatch } = useFinance();
  // Priorizar settings.language, fallback a legacy state.language o 'es'
  const currentLang = state.settings?.language || (state as any).language || 'es';

  /**
   * Traduce una clave. Si no existe la traducción, devuelve la clave misma.
   * Soporta interpolación simple: t('key', { name: 'John' }) -> "Hello {name}" -> "Hello John"
   */
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[currentLang];
    let text = dict[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return text;
  }, [currentLang]);

  /**
   * Cambia el idioma globalmente y guarda la configuración.
   */
  const setLanguage = useCallback((lang: Language) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { language: lang }
    });
  }, [dispatch]);

  return { t, language: currentLang, setLanguage };
}; 