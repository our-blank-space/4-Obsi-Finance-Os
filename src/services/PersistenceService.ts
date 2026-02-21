import { App, Notice, normalizePath, TFile } from 'obsidian';
import { Transaction, Data } from '../types';
import { AsyncQueue } from '../utils/AsyncQueue';
import { FileSystemGuard } from './FileSystemGuard';
import { BalanceCalculator } from '../logic/balance.calculator';
import { TransactionAggregator } from './TransactionAggregator';
import { Repository, FileMap } from '../persistence/Repositories';

export class PersistenceService {
    private ioQueue = new AsyncQueue();
    private fsGuard: FileSystemGuard;
    private repository: Repository;
    private transactionAggregator: TransactionAggregator;

    private readonly WAL_PATH: string;
    private readonly SHARD_PATH: string;
    private readonly LEGACY_DATA_PATH: string;
    private readonly BASE_PATH: string;

    // Hash cache for optimization (optional, skipping for simplicity/robustness first)
    // private lastSnapshotHash: string = "";

    constructor(private app: App, basePath: string) {
        this.BASE_PATH = `${basePath}/.finance-db`;
        this.WAL_PATH = `${this.BASE_PATH}/wal/recovery.log`;
        this.SHARD_PATH = `${this.BASE_PATH}/ledger`;
        this.LEGACY_DATA_PATH = `${basePath}/data.json`;

        this.fsGuard = new FileSystemGuard(app, basePath);
        this.repository = new Repository(app, basePath);

        // Minimal adapter for TransactionAggregator
        const internalApi = {
            readJson: async (path: string) => {
                const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
                if (f && f instanceof TFile) return JSON.parse(await this.app.vault.read(f));
                return null;
            }
        } as any;
        this.transactionAggregator = new TransactionAggregator(internalApi);
    }

    /**
     * Inicialización del Subsistema
     */
    public async initialize(): Promise<void> {
        await this.fsGuard.ensureStructure();
    }

    /**
     * WAL: Write-Ahead Log (Auto-Healing)
     * Intenta reparar estructura si falla la primera escritura.
     */
    public async logMutation(mutation: Partial<Transaction>): Promise<void> {
        return this.ioQueue.enqueue(async () => {
            const entry = JSON.stringify({ t: Date.now(), ...mutation }) + '\n';
            try {
                await this.app.vault.adapter.append(this.WAL_PATH, entry);
            } catch (e) {
                // Auto-heal: Puede que la carpeta fuera borrada manualmente
                await this.fsGuard.ensureStructure();
                // Reintento único
                await this.app.vault.adapter.append(this.WAL_PATH, entry).catch(err => {
                    console.error("[FATAL] WAL Lost:", err);
                    new Notice("⛔ Error crítico de disco. Respalda tus datos.");
                });
            }
        });
    }

    /**
     * CONSOLIDACIÓN NO DESTRUCTIVA (V2 - Segregated)
     * Escribe en múltiples archivos JSON segregados por dominio.
     */
    public async consolidate(state: Data.PluginData): Promise<void> {
        return this.ioQueue.enqueue(async () => {
            // 0. Ensure Structure
            // await this.fsGuard.ensureStructure(); // Costly to check every time? Maybe. guarding inside write is better.

            // 1. Sharding (Cold Data - Historic Transactions)
            const shards = this.partitionByMonth(state.transactions);
            for (const [month, txs] of shards.entries()) {
                const path = `${this.SHARD_PATH}/${month}.json`;
                const existing = await this.loadShardSafe(path);
                const merged = this.mergeTransactions(existing, txs);

                // Only write if changed or new (simple optimization: check length or crude hash?)
                // For now, consistent write is safer.
                await this.safeAtomicWrite(path, {
                    period: month,
                    updated: Date.now(),
                    transactions: merged
                });
            }

            // 2. Metadata & Summaries
            const currentLiquidity = this.calculateLiquidity(state);
            const summary = await this.transactionAggregator.updateSummaries(state.transactions, state.budgets);
            this.transactionAggregator.calculateRunway(summary, currentLiquidity);

            await this.safeAtomicWrite(`${this.BASE_PATH}/core/summaries.json`, summary);

            // 3. Prepare Hot Data & Split
            // CRITICAL FIX: Save ALL transactions to ledger.json to ensure data persistence across sessions.
            // Sharding is kept as a backup/recovery mechanism.
            // In a future v2, we can implement lazy loading for cold data, but for now, reliability > complexity.

            // Create a view of the state to persist
            const stateToPersist = {
                ...state,
                transactions: state.transactions, // Save all transactions
                summaries: summary
            };

            // 4. Persistence via Repository
            // Split the monolithic state into domain chunks
            const chunks = this.repository.splitData(stateToPersist);

            // Write chunks in parallel for performance
            try {
                await Promise.all(
                    (Object.keys(chunks) as Array<keyof FileMap>).map(filename =>
                        this.repository.write(filename, chunks[filename])
                    )
                );
            } catch (e) {
                console.error("[Persistence] Split Write Failed", e);
                new Notice("⚠️ Error guardando datos parciales.");
                throw e;
            }

            // 5. Cleanup Legacy Data (Migration Step)
            // If we successfully saved everything, and a data.json exists, we renaming it to .migrated
            if (await this.app.vault.adapter.exists(this.LEGACY_DATA_PATH)) {
                try {
                    // Only rename if we are sure we have the new data.
                    // Verification implicitly done by successful Promise.all above.
                    await this.app.vault.adapter.rename(this.LEGACY_DATA_PATH, `${this.LEGACY_DATA_PATH}.migrated`);
                    new Notice("📦 Generación de datos migrada a estructura granular.");
                } catch (e) {
                    // Ignore rename errors (maybe already renamed)
                }
            }

            // 6. Purga de WAL (Solo al final y si todo salió bien)
            if (await this.app.vault.adapter.exists(this.WAL_PATH)) {
                await this.app.vault.adapter.write(this.WAL_PATH, "");
            }


        });
    }

    /**
     * RECUPERACIÓN INTELIGENTE
     * Solo aplica cambios si el WAL tiene contenido válido.
     */
    public async recoverFromWAL(currentData: Data.PluginData): Promise<{ data: Data.PluginData, recovered: boolean }> {
        if (!(await this.app.vault.adapter.exists(this.WAL_PATH))) {
            return { data: currentData, recovered: false };
        }

        const content = await this.app.vault.adapter.read(this.WAL_PATH);
        if (!content.trim()) return { data: currentData, recovered: false };

        const txMap = new Map<string, Transaction>();
        currentData.transactions.forEach(t => txMap.set(t.id, t));

        let recoveredCount = 0;
        const lines = content.split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const mutation = JSON.parse(line);
                if (mutation.id && mutation.amount !== undefined) {
                    const { t, ...cleanTx } = mutation;
                    txMap.set(cleanTx.id, cleanTx as Transaction);
                    recoveredCount++;
                }
            } catch { /* Skip corrupt */ }
        }

        if (recoveredCount > 0) {
            new Notice(`🔄 Sesión restaurada: ${recoveredCount} transacciones recuperadas.`);
            return {
                data: {
                    ...currentData,
                    transactions: Array.from(txMap.values())
                },
                recovered: true
            };
        }

        return { data: currentData, recovered: false };
    }

    /**
     * Checks if the new granular data structure exists.
     */
    public async hasGranularData(): Promise<boolean> {
        return this.app.vault.adapter.exists(normalizePath(`${this.BASE_PATH}/infra.json`));
    }

    /**
     * Load Data Helper with Failover (Granular -> Legacy -> Backup)
     */
    public async loadDataWithFailover(): Promise<Data.PluginData | null> {
        try {
            // 1. Try Granular Load (New Standard)
            // We check for a key file, e.g., 'infra.json' or 'settings.json'
            // If 'infra.json' exists, we assume the granular structure is active.
            if (await this.app.vault.adapter.exists(normalizePath(`${this.BASE_PATH}/infra.json`))) {
                const files: Array<keyof FileMap> = [
                    'settings.json', 'infra.json', 'assets.json', 'credit.json',
                    'trading.json', 'business.json', 'ledger.json', 'simulations.json', 'custodial.json'
                ];

                const parts = await Promise.all(files.map(f => this.repository.read(f)));

                // Merge all parts
                // Initialize with empty object/defaults if needed, but the main loadData will apply defaults.
                // We just merge what we found.
                let combined: any = {};
                parts.forEach(part => {
                    if (part) combined = { ...combined, ...(part as any) };
                });

                // Verification: Did we get enough data?
                if (combined && Object.keys(combined).length > 0) {
                    return combined as Data.PluginData;
                }
            }

            // 2. Fallback: Legacy Monolithic Load
            if (await this.app.vault.adapter.exists(this.LEGACY_DATA_PATH)) {
                return JSON.parse(await this.app.vault.adapter.read(this.LEGACY_DATA_PATH));
            }

            // 3. Fallback: Legacy Backup
            const backupPath = `${this.LEGACY_DATA_PATH}.bak`;
            if (await this.app.vault.adapter.exists(backupPath)) {
                new Notice("⚠️ Cargando desde respaldo automático (Legacy).");
                return JSON.parse(await this.app.vault.adapter.read(backupPath));
            }

        } catch (e) {
            console.error("Data load failed", e);
            new Notice("❌ Error crítico cargando datos.");
        }
        return null; // Will trigger DEFAULT_DATA in main.ts
    }

    /**
     * Generic atomic write (kept for internal non-repository usage like sharding)
     */
    private async safeAtomicWrite(path: string, data: any): Promise<void> {
        const normalizedPath = normalizePath(path);
        const tempPath = `${normalizedPath}.tmp`;
        // Backup disabled for shards to save space/IO, atomic rename is sufficient given WAL protection
        const content = JSON.stringify(data, null, 2);

        try {
            // Ensure parent dir exists (legacy safety)
            const folder = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
            if (folder && !(await this.app.vault.adapter.exists(folder))) {
                try { await this.app.vault.createFolder(folder); } catch { }
            }

            await this.app.vault.adapter.write(tempPath, content);

            if (await this.app.vault.adapter.exists(normalizedPath)) {
                await this.app.vault.adapter.remove(normalizedPath);
            }

            await this.app.vault.adapter.rename(tempPath, normalizedPath);

        } catch (e) {
            console.error(`[AtomicWrite] Fallo en ${path}`, e);
            if (await this.app.vault.adapter.exists(tempPath)) {
                await this.app.vault.adapter.remove(tempPath).catch(() => { });
            }
            throw e;
        }
    }

    private partitionByMonth(txs: Transaction[]): Map<string, Transaction[]> {
        const map = new Map();
        txs.forEach(t => {
            if (!t.date) return;
            const m = t.date.substring(0, 7);
            if (!map.has(m)) map.set(m, []);
            map.get(m).push(t);
        });
        return map;
    }

    private mergeTransactions(existing: Transaction[], incoming: Transaction[]): Transaction[] {
        const map = new Map<string, Transaction>();
        existing.forEach(t => map.set(t.id, t));
        incoming.forEach(t => map.set(t.id, t));
        // Sort descending
        return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    private async loadShardSafe(path: string): Promise<Transaction[]> {
        try {
            if (await this.app.vault.adapter.exists(path)) {
                const c = await this.app.vault.adapter.read(path);
                return JSON.parse(c).transactions || [];
            }
        } catch { return []; }
        return [];
    }

    private calculateLiquidity(data: Data.PluginData): number {
        try {
            const balancesMap = BalanceCalculator.compute(data.transactions, data.accountRegistry);
            let totalInBase = 0;
            const rates = data.exchangeRates || {};
            const base = data.baseCurrency;

            balancesMap.forEach((currencies) => {
                currencies.forEach((amount, currency) => {
                    if (currency === base) {
                        totalInBase += amount;
                    } else {
                        const rate = rates[currency] || 0;
                        if (rate > 0) {
                            totalInBase += amount * rate;
                        }
                    }
                });
            });
            return totalInBase;
        } catch (e) {
            console.warn("Failed to calculate liquidity", e);
            return 0;
        }
    }

    /**
     * DANGER: Purges all persisted data from disk.
     */
    public async purgeDatabase(): Promise<void> {
        return this.ioQueue.enqueue(async () => {
            console.warn("[Persistence] PURGING DATABASE...");

            // 1. Delete WAL
            if (await this.app.vault.adapter.exists(this.WAL_PATH)) {
                await this.app.vault.adapter.remove(this.WAL_PATH);
            }

            // 2. Delete Ledgers (Recursive)
            if (await this.app.vault.adapter.exists(this.SHARD_PATH)) {
                await this.app.vault.adapter.rmdir(this.SHARD_PATH, true);
            }

            // 3. Delete Core/Summaries
            if (await this.app.vault.adapter.exists(`${this.BASE_PATH}/core`)) {
                await this.app.vault.adapter.rmdir(`${this.BASE_PATH}/core`, true);
            }

            // 4. Delete Granular Files
            const files: Array<keyof FileMap> = [
                'settings.json', 'infra.json', 'assets.json', 'credit.json',
                'trading.json', 'business.json', 'ledger.json', 'simulations.json', 'custodial.json'
            ];
            for (const f of files) {
                const p = normalizePath(`${this.BASE_PATH}/${f}`);
                if (await this.app.vault.adapter.exists(p)) await this.app.vault.adapter.remove(p);
            }

            // 5. Delete Legacy
            if (await this.app.vault.adapter.exists(this.LEGACY_DATA_PATH)) {
                await this.app.vault.adapter.remove(this.LEGACY_DATA_PATH);
            }
            if (await this.app.vault.adapter.exists(this.LEGACY_DATA_PATH + '.migrated')) {
                await this.app.vault.adapter.remove(this.LEGACY_DATA_PATH + '.migrated');
            }

            // Re-create empty structure
            await this.fsGuard.ensureStructure();
        });
    }
}