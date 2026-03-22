import { Plugin, TFile, TFolder, normalizePath, Notice, TAbstractFile, debounce } from 'obsidian';
import {
    Data,
    Ledger, // Assuming Ledger namespace has things like Transaction
} from './types';
import { Obsidian } from './types'; // Namespace for FinanceObsidianAPI
import { FinanceView, VIEW_TYPE_FINANCE } from './ReactView';
import { FinanceOSSettingTab } from './settings';
import { VaultParserService } from './services/VaultParserService';
import { LedgerService } from './services/LedgerService';
import { ReportsService } from './services/ReportsService';
import { BackupService } from './services/BackupService';
import { DEFAULT_DATA } from './data/defaults';
import { MigrationManager } from './logic/MigrationManager';
import { PersistenceService } from './services/PersistenceService';
import { DateUtils } from './utils/date';
import { TransactionModal } from './modals/TransactionModal';
import { TransactionType } from './types';


export default class FinanceOSPlugin extends Plugin {
    data!: Data.PluginData;

    // Services
    parserService!: VaultParserService;
    ledgerService!: LedgerService;
    reportsService!: ReportsService;
    backupService!: BackupService;
    persistenceService!: PersistenceService;

    public isInitialized = false;
    private saveInterval!: number;

    // ✅ ARCHITECTURE FIX 1: Deferred Promise Pattern
    // Control estricto de concurrencia. La API pública esperará a esta señal.
    private resolveDbReady!: () => void;
    private dbReadyPromise: Promise<void>;

    // ✅ ARCHITECTURE FIX 2: Centralized Debouncer
    // Evita IO Storms compartiendo el debounce entre UI y FileSystem Events
    private debouncedSave: (data: Data.PluginData) => void;

    constructor(app: any, manifest: any) {
        super(app, manifest);

        // Inicializamos el bloqueo de base de datos
        this.dbReadyPromise = new Promise((resolve) => {
            this.resolveDbReady = resolve;
        });

        // Configuramos el debouncer global (3 segundos de calma)
        this.debouncedSave = debounce((data: Data.PluginData) => {
            if (this.persistenceService) {
                this.persistenceService.consolidate(data).catch(err =>
                    console.error("[FinanceOS] Save failed:", err)
                );
            }
        }, 3000, true);
    }

    async onload() {
        // FASE 1: Infraestructura Crítica (Bloqueante)
        await this.initPersistenceLayer();

        // FASE 2: Servicios de Dominio
        this.initDomainServices();

        // FASE 3: UI & Integración
        this.initUserInterface();
        this.initCommands();

        // FASE 4: Vigilancia (Background)
        this.initWatchers();
        this.startSafetyLoop();
    }

    async onunload() {
        window.clearInterval(this.saveInterval);

        // Guardado final seguro (Force flush)
        if (this.persistenceService) {
            await this.persistenceService.consolidate(this.data);
        }

        if (this.backupService) {
            this.backupService.stopAutoBackup();
        }
    }

    // --- FASE 1: PERSISTENCIA ---
    private async initPersistenceLayer() {
        this.persistenceService = new PersistenceService(this.app, this.manifest.dir || '');
        await this.persistenceService.initialize();

        // Carga, Migración y WAL Recovery
        await this.loadPluginData();

        // VALIDACIÓN DE MIGRACIÓN: Si cargamos datos pero no tenemos estructura granular, forzamos la migración
        if (this.data && !(await this.persistenceService.hasGranularData())) {
            await this.savePluginData();
        }

        // Validación de Seguridad
        this.checkSecurityRisk();

        // ✅ SEÑAL DE LISTO: Desbloquea la API pública
        this.resolveDbReady();
        this.isInitialized = true;
    }

    // --- FASE 2: DOMINIO ---
    private initDomainServices() {
        // Inyectamos dependencias si es necesario
        this.parserService = new VaultParserService(this.app, this.data.baseCurrency);
        this.ledgerService = new LedgerService(this.app);
        this.reportsService = new ReportsService(this.app);

        this.backupService = new BackupService(
            // Adaptador FS simple para BackupService
            async (path, content) => {
                const np = normalizePath(path);
                const folder = np.substring(0, np.lastIndexOf('/'));
                if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
                const f = this.app.vault.getAbstractFileByPath(np);
                if (f instanceof TFile) await this.app.vault.modify(f, content);
                else await this.app.vault.create(np, content);
            },
            async (path) => {
                const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
                return f instanceof TFile ? await this.app.vault.read(f) : null;
            },
            async (path) => {
                const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
                return f instanceof TFolder ? f.children.filter(c => c instanceof TFile).map(c => c.name) : [];
            }
        );
    }

    // --- FASE 3: UI ---
    private initUserInterface() {
        this.registerView(
            VIEW_TYPE_FINANCE,
            (leaf) => new FinanceView(leaf, this, this.data, this.createPublicAPI())
        );

        this.addRibbonIcon('dollar-sign', 'Finance OS', () => {
            this.activateView();
        });

        this.addSettingTab(new FinanceOSSettingTab(this.app, this));
    }

    // --- FASE 4: EVENTOS Y COMANDOS ---
    private initCommands() {
        this.addCommand({
            id: 'finance-os-modal-expense',
            name: 'Registrar Gasto Rápido (Modal)',
            callback: () => {
                new TransactionModal(this.app, this, TransactionType.EXPENSE).open();
            }
        });

        this.addCommand({
            id: 'finance-os-modal-income',
            name: 'Registrar Ingreso Rápido (Modal)',
            callback: () => {
                new TransactionModal(this.app, this, TransactionType.INCOME).open();
            }
        });

        this.addCommand({
            id: 'finance-os-modal-transfer',
            name: 'Registrar Traslado Rápido (Modal)',
            callback: () => {
                new TransactionModal(this.app, this, TransactionType.TRANSFER).open();
            }
        });

        this.addCommand({
            id: 'create-backup',
            name: 'Crear Backup Manual',
            callback: async () => {
                try {
                    const backupId = await this.backupService.createBackup(this.data, 'manual');
                    new Notice(`✅ Backup creado: ${backupId.slice(-20)}`);
                } catch (e) {
                    new Notice(`❌ Error: ${e}`);
                }
            }
        });



        // Comando DEV solo visible si estamos en debug (opcional)
        // this.addCommand({...}); 
    }

    private initWatchers() {
        this.app.workspace.onLayoutReady(() => {
            this.registerEvent(this.app.vault.on('modify', async (f) => this.handleFileEvent(f)));
            this.registerEvent(this.app.vault.on('create', async (f) => this.handleFileEvent(f)));
        });
    }

    private startSafetyLoop() {
        // Loop de seguridad V6 (Non-destructive)
        // Cada 5 minutos fuerza una consolidación si hubo cambios pendientes en memoria
        this.saveInterval = window.setInterval(async () => {
            await this.persistenceService.consolidate(this.data).catch(e => console.error("[FinanceOS] Auto-save failed:", e));
        }, 5 * 60 * 1000);
    }

    // =========================================================
    // DATA LOADING & RECOVERY CORE
    // =========================================================

    async loadPluginData() {
        // 1. Failover Load
        let loadedData = await this.persistenceService.loadDataWithFailover();
        if (!loadedData) {
            loadedData = await this.loadData();
        }

        const rawData = Object.assign({}, DEFAULT_DATA, loadedData);

        // 2. Migration & Schema Validation
        let currentData: Data.PluginData;
        try {
            currentData = MigrationManager.upgradeDataSchema(rawData);
        } catch (e) {
            console.error("[FinanceOS] CRITICAL: Data load failed. Entering SAFE MODE.", e);
            new Notice("⚠️ Error crítico de datos. Iniciando en MODO SEGURO.", 10000);
            currentData = {
                ...DEFAULT_DATA,
                meta: { ...DEFAULT_DATA.meta, mode: 'production' as any } // Cast to avoid strict type error if 'production' isn't explicitly in StateMeta mode union
            };
        }

        // 3. WAL Recovery (Resiliencia ante cierres forzados)
        const recoveryResult = await this.persistenceService.recoverFromWAL(currentData);
        this.data = recoveryResult.data;

        // 4. Bootstrap Consolidation (Si hubo recuperación, limpiar el log)
        if (recoveryResult.recovered) {
            await this.persistenceService.consolidate(this.data);
        }

        // 5. Version Drift Fix
        if (loadedData?.version !== this.data.version) {
            await this.savePluginData();
        }
    }

    async savePluginData() {
        await this.persistenceService.consolidate(this.data);
    }

    // =========================================================
    // PUBLIC API FACTORY (BOUNDED CONTEXT)
    // =========================================================

    createPublicAPI(): Obsidian.FinanceObsidianAPI {
        return {
            saveData: async (newData) => {
                // Actualización optimista en memoria
                this.data = { ...this.data, ...newData };
                // Schedule debounce
                this.debouncedSave(this.data);
            },

            forceSave: async (data) => {
                this.data = data;
                await this.persistenceService.consolidate(this.data);
                new Notice("✅ Datos asegurados en disco.");
            },

            scheduleSave: (data) => {
                this.data = data;
                this.debouncedSave(this.data);
            },

            // --- READ OPERATIONS (Blocking until DB Ready) ---
            getSummaries: async () => {
                await this.dbReadyPromise; // 🔒 Bloqueo de seguridad

                // Ahora es seguro leer
                const summaryPath = `${this.manifest.dir}/FinanceOS-Data/core/summaries.json`;
                try {
                    const file = this.app.vault.getAbstractFileByPath(normalizePath(summaryPath));
                    if (file instanceof TFile) {
                        return JSON.parse(await this.app.vault.read(file));
                    }
                } catch (e) {
                    console.error("[API] Error loading summaries", e);
                }
                return null;
            },

            // --- WRAPPERS (Facades) ---
            createBackup: async (context: string) => this.backupService.createBackup(this.data, context),
            listBackups: async () => this.backupService.listBackups(),
            restoreBackup: async (id: string) => {
                const restored = await this.backupService.restore(id);
                this.data = restored;
                await this.savePluginData();
                return restored;
            },

            syncLedger: async (txs: Ledger.Transaction[]) => this.ledgerService.sync(txs),
            syncReports: async (d) => {
                await this.reportsService.syncSnapshots(d.snapshots || []);
                await this.reportsService.syncAssets(d.assets || []);
                await this.reportsService.syncCredit(d.loans || [], d.debts || []);
                await this.reportsService.syncTrading(d.trades || []);
            },
            updateMonthlyLedger: async (txs, date) => this.ledgerService.updateMonthlyLedger(txs, date),

            // --- FILESYSTEM UTILS ---
            // (Se mantienen igual por ahora, pero idealmente deberían ir a un FileSystemAPI separado)
            openLink: (path) => this.app.workspace.openLinkText(path, '', true),
            createNote: async (path, content) => {
                const normalizedPath = normalizePath(path.endsWith('.md') ? path : path + ".md");
                const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
                if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
                    try {
                        await this.app.vault.createFolder(folderPath);
                    } catch (e) {
                        console.error(`[FinanceOS] Error al intentar crear carpeta ${folderPath}`, e);
                    }
                }

                const existing = this.app.vault.getAbstractFileByPath(normalizedPath);
                if (!existing) await this.app.vault.create(normalizedPath, content || "");
                else if (existing instanceof TFile && content) {
                    const currentContent = await this.app.vault.read(existing);
                    if (currentContent !== content) await this.app.vault.modify(existing, content);
                }
            },
            appendToNote: async (path, content) => {
                const normalizedPath = normalizePath(path.endsWith('.md') ? path : path + '.md');
                const file = this.app.vault.getAbstractFileByPath(normalizedPath);
                if (file instanceof TFile) {
                    await this.app.vault.append(file, content);
                    return true;
                }
                return false;
            },
            createFolder: async (path) => {
                if (!await this.app.vault.adapter.exists(path)) {
                    try {
                        await this.app.vault.createFolder(path);
                    } catch (e) {
                        console.error(`[FinanceOS] Error al intentar crear carpeta ${path}`, e);
                    }
                }
            },
            getBasePath: () => this.manifest.dir || '',
            fileExists: (path) => !!this.app.vault.getAbstractFileByPath(normalizePath(path)),
            searchNotes: (query) => {
                return this.app.vault.getMarkdownFiles()
                    .filter(f => f.basename.toLowerCase().includes(query.toLowerCase()))
                    .map(f => ({ path: f.path, basename: f.basename }))
                    .slice(0, 10);
            },

            // Raw JSON IO (Low Level)
            writeJson: async (path, data) => {
                const normalized = normalizePath(path);
                const folder = normalized.substring(0, normalized.lastIndexOf('/'));
                if (folder && !(await this.app.vault.adapter.exists(folder))) {
                    try {
                        await this.app.vault.createFolder(folder);
                    } catch (e) {
                        console.error(`[FinanceOS] Error al intentar crear carpeta ${folder} para json`, e);
                    }
                }
                await this.app.vault.adapter.write(normalized, JSON.stringify(data, null, 2));
            },
            readJson: async <T>(path: string): Promise<T | null> => {
                try {
                    const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
                    if (f instanceof TFile) return JSON.parse(await this.app.vault.read(f));
                } catch (e) {
                    console.error(`[FinanceOS] Error al cargar o parsear JSON en ${path}`, e);
                }
                return null;
            },
            listJsonFiles: async (path) => {
                const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
                return f instanceof TFolder ? f.children.filter(c => c.name.endsWith('.json')).map(c => c.name) : [];
            },
            delete: async (path) => {
                const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
                if (f) await this.app.vault.delete(f);
            },
            exists: async (path) => await this.app.vault.adapter.exists(normalizePath(path))
        };
    }

    // =========================================================
    // EVENT HANDLERS & HELPERS
    // =========================================================

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_FINANCE)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false)!;
            if (leaf) await leaf.setViewState({ type: VIEW_TYPE_FINANCE, active: true });
        }
        if (leaf) workspace.revealLeaf(leaf);
    }

    private async checkSecurityRisk() {
        // Validación de .gitignore para el nuevo directorio FinanceOS-Data
        try {
            const gitIgnorePath = normalizePath('.gitignore');
            if (await this.app.vault.adapter.exists(gitIgnorePath)) {
                const content = await this.app.vault.adapter.read(gitIgnorePath);
                if (this.data.settings.geminiApiKey && !content.includes('FinanceOS-Data')) {
                    new Notice("⚠️ SEGURIDAD: La carpeta FinanceOS-Data no está ignorada en git. Tu API Key podría filtrarse.", 10000);
                }
            }
        } catch (e) {
            console.error("[FinanceOS] Error al comprobar el riesgo de seguridad", e);
        }
    }

    // ✅ ARCHITECTURE FIX 3: Event Storm Protection
    private async handleFileEvent(file: TAbstractFile) {
        if (!this.isInitialized) return;

        // 1. Filtrado rápido
        if (!(file instanceof TFile) || !file.path.startsWith(this.data.settings.transactionsFolder)) return;

        // 2. Proceso de Parseo
        const parsedTx = await this.parserService.parseTransactionFile(file);
        if (!parsedTx) return;

        // 3. Normalización V3
        const { MigrationToV3 } = require('./logic/MigrationToV3');
        const updatedTx = MigrationToV3.normalizeTransaction(parsedTx, this.data.categoryRegistry, this.data.accountRegistry);

        // 4. Actualización de Estado (In-Memory)
        const index = this.data.transactions.findIndex(t => t.id === updatedTx.id);
        let changed = false;

        if (index > -1) {
            // Check diff
            const current = this.data.transactions[index];
            if (JSON.stringify(current) !== JSON.stringify(updatedTx)) { // Deep compare simple
                this.data.transactions[index] = updatedTx;
                changed = true;
            }
        } else {
            this.data.transactions.push(updatedTx);
            changed = true;
        }

        // 5. Guardado DEBOUNCED (No directo)
        if (changed) {
            // Notificamos a la UI inmediatamente
            window.dispatchEvent(new CustomEvent('finance-os-external-update', { detail: updatedTx }));

            // Programamos guardado en disco con calma
            this.debouncedSave(this.data);
        }
    }

    /**
     * Factory Reset: Borra todo el almacenamiento y reinicia el estado.
     */
    async performFactoryReset() {
        await this.persistenceService.purgeDatabase();

        const prevSettings = { ...this.data.settings };
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));

        // Restore Critical Settings
        this.data.settings.geminiApiKey = prevSettings.geminiApiKey;
        this.data.settings.language = prevSettings.language;

        await this.savePluginData();

        // Force UI Refresh
        this.app.workspace.getLeavesOfType(VIEW_TYPE_FINANCE).forEach(leaf => {
            if (leaf.view instanceof FinanceView) {
                leaf.view.updateData(this.data);
            }
        });

        new Notice("♻️ Sistema reiniciado de fábrica.");
    }
}