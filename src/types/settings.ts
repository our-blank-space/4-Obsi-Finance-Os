// src/types/settings.ts
import { Language } from './core';

export type LoggingStrategy = 'singleFile' | 'dailyNote';

export interface PluginSettings {
    transactionsFolder: string;
    createNoteOnLog: boolean;
    smartLedger: boolean;
    loggingStrategy: LoggingStrategy;
    language: Language;
    geminiApiKey: string;
    autoSave: boolean;
    fiscalYearStart: number;

    // Resiliencia: Tasas de Cambio Manuales
    useManualRates: boolean;
    manualExchangeRates: Record<string, number>;

    // ✅ RESTAURADO: Timestamp de última actualización (sistema)
    lastRateUpdate?: number;

    // Testing Mode
    testingMode?: boolean;
    simulatedDate?: string;
}
