// src/types/obsidian.ts
import { WeeklySnapshot, Reminder, GlobalSummary } from './infra';
import { CustodialAccount } from './custodial';
import { BusinessData } from './business';
import { Scenario } from './simulations';
import { AssetProject } from './assets';
import { Loan, Debt } from './credit';
import { Trade } from './trading';
import { Transaction } from './ledger';
import { PluginData } from './data';

// --- INFRAESTRUCTURA OBSIDIAN API ---

export interface SearchResult {
    path: string;
    basename: string;
}

export interface BackupInfo {
    id: string;
    timestamp: Date;
    version: number;
    context: string;
    checksum?: string;
}

export interface FinanceObsidianAPI {
    saveData: (data: Partial<PluginData>) => Promise<void>;
    forceSave: (data: PluginData) => Promise<void>; // Manual trigger that respects sharding
    scheduleSave: (data: PluginData) => void;
    openLink: (path: string) => void;
    createNote: (path: string, content?: string) => Promise<void>;
    appendToNote: (path: string, content: string) => Promise<boolean>;
    createFolder: (path: string) => Promise<void>;
    getBasePath: () => string;
    fileExists: (path: string) => boolean;
    searchNotes: (query: string) => SearchResult[];
    syncLedger: (transactions: Transaction[]) => Promise<void>;
    syncReports: (data: {
        snapshots?: WeeklySnapshot[],
        assets?: AssetProject[],
        loans?: Loan[],
        debts?: Debt[],
        trades?: Trade[]
    }) => Promise<void>;

    // Backup methods
    createBackup: (context: string) => Promise<string>;
    listBackups: () => Promise<BackupInfo[]>;
    restoreBackup: (backupId: string) => Promise<PluginData>;
    updateMonthlyLedger: (transactions: Transaction[], date: string) => Promise<void>;

    // Generic Storage for Partitioning
    writeJson: (path: string, data: any) => Promise<void>;
    readJson: <T>(path: string) => Promise<T | null>;
    listJsonFiles: (path: string) => Promise<string[]>;
    getSummaries: () => Promise<GlobalSummary | null>;
    delete: (path: string) => Promise<void>;
    exists(path: string): Promise<boolean>;
}