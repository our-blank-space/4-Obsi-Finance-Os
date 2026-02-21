import { PluginData } from '../types/data';
import { App, normalizePath, TFile } from 'obsidian';

/**
 * Define la estructura de cada archivo persistente.
 */
export interface FileMap {
    'settings.json': Partial<PluginData>; // settings, features
    'infra.json': Partial<PluginData>; // categoryRegistry, accountRegistry, tags, meta, baseCurrency, exchangeRates
    'assets.json': Partial<PluginData>; // assets, assetTypes
    'credit.json': Partial<PluginData>; // loans, debts
    'trading.json': Partial<PluginData>; // trades, tradingTransfers
    'business.json': Partial<PluginData>; // business
    'ledger.json': Partial<PluginData>; // transactions (hot), budgets, recurrents, snapshots
    'simulations.json': Partial<PluginData>; // scenarios, projectionParams, reminders
    'custodial.json': Partial<PluginData>; // custodialAccounts
}

export class Repository {
    private readonly BASE_PATH: string;

    constructor(private app: App, basePath: string) {
        this.BASE_PATH = `${basePath}/.finance-db`;
    }

    /**
     * Serializa el estado completo en fragmentos para cada archivo.
     */
    public splitData(data: PluginData): Record<keyof FileMap, any> {
        return {
            'settings.json': {
                settings: data.settings,
                features: data.features
            },
            'infra.json': {
                meta: data.meta,
                baseCurrency: data.baseCurrency,
                exchangeRates: data.exchangeRates,
                categoryRegistry: data.categoryRegistry,
                accountRegistry: data.accountRegistry,
                tags: data.tags
            },
            'assets.json': {
                assets: data.assets,
                assetTypes: data.assetTypes
            },
            'credit.json': {
                loans: data.loans,
                debts: data.debts
            },
            'trading.json': {
                trades: data.trades,
                tradingTransfers: data.tradingTransfers
            },
            'business.json': {
                business: data.business
            },
            'ledger.json': {
                // Warning: Transactions handled separately for sharding in PersistenceService, 
                // but strictly 'hot' ones + metadata go here if not sharded? 
                // Plan said: Hot Transactions, Budgets, Recurrents, Snapshots
                transactions: data.transactions,
                budgets: data.budgets,
                recurrents: data.recurrents,
                snapshots: data.snapshots
            },
            'simulations.json': {
                scenarios: data.scenarios,
                projectionParams: data.projectionParams,
                reminders: data.reminders
            },
            'custodial.json': {
                custodialAccounts: data.custodialAccounts
            }
        };
    }

    /**
     * Lee un archivo JSON específico.
     */
    public async read<T>(filename: keyof FileMap): Promise<T | null> {
        const path = normalizePath(`${this.BASE_PATH}/${filename}`);
        try {
            if (await this.app.vault.adapter.exists(path)) {
                const content = await this.app.vault.adapter.read(path);
                return JSON.parse(content);
            }
        } catch (e) {
            console.error(`[Repository] Failed to read ${filename}`, e);
        }
        return null;
    }

    /**
     * Escribe un archivo JSON específico de forma atómica.
     */
    public async write(filename: keyof FileMap, data: any): Promise<void> {
        const path = normalizePath(`${this.BASE_PATH}/${filename}`);
        const tempPath = `${path}.tmp`;

        try {
            await this.app.vault.adapter.write(tempPath, JSON.stringify(data, null, 2));

            if (await this.app.vault.adapter.exists(path)) {
                await this.app.vault.adapter.remove(path);
            }

            await this.app.vault.adapter.rename(tempPath, path);
        } catch (e) {
            console.error(`[Repository] Failed to write ${filename}`, e);
            throw e;
        }
    }
}
