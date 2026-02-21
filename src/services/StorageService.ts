import { FinanceObsidianAPI, Transaction, PluginData } from '../types';

export class StorageService {
    private api: FinanceObsidianAPI;
    private readonly BASE_PATH: string;
    private readonly LEDGER_BASE_PATH: string;

    constructor(api: FinanceObsidianAPI, basePath: string) {
        this.api = api;
        this.BASE_PATH = `${basePath}/.finance-db`;
        this.LEDGER_BASE_PATH = `${this.BASE_PATH}/ledger`;
    }

    /**
     * Escritura directa a JSON con sistema de Backups Rotativos.
     * Evitamos el uso de .tmp para no confundir a Obsidian Sync.
     */
    private async safeWrite(path: string, data: any): Promise<void> {
        try {
            // 1. Crear Backup Rotativo solo para el archivo principal de datos
            if (path.endsWith('data.json')) {
                await this.rotateBackups(path);
            }

            // 2. Escritura Directa (Obsidian maneja la atomicidad a nivel de FS)
            await this.api.writeJson(path, data);

        } catch (e) {
            console.error(`[Storage] Write failed for ${path}`, e);
            throw e;
        }
    }

    /**
     * Mantiene 2 versiones de backup: .bak.1 y .bak.2
     */
    private async rotateBackups(originalPath: string) {
        try {
            const bak1 = `${originalPath}.bak.1`;
            const bak2 = `${originalPath}.bak.2`;

            // Si existe bak1, mover a bak2 (rota el más viejo)
            if (await this.api.exists(bak1)) {
                // Nota: Obsidian API no tiene 'move' directo fácil en la interfaz actual,
                // leemos y escribimos. Para archivos pequeños (<10MB) es aceptable.
                const content1 = await this.api.readJson(bak1);
                await this.api.writeJson(bak2, content1);
            }

            // Copiar actual a bak1
            if (await this.api.exists(originalPath)) {
                const currentContent = await this.api.readJson(originalPath);
                await this.api.writeJson(bak1, currentContent);
            }
        } catch (e) {
            console.warn("[Storage] Backup rotation failed (non-critical)", e);
        }
    }

    /**
     * Initializes the storage service by ensuring necessary directories exist.
     */
    public async initialize(): Promise<void> {
        const dirs = [
            `${this.BASE_PATH}/core`,
            `${this.BASE_PATH}/ledger`,
            `${this.BASE_PATH}/inventory`,
            `${this.BASE_PATH}/production`,
            `${this.BASE_PATH}/vault`
        ];
        for (const dir of dirs) {
            await this.api.createFolder(dir);
        }
    }

    /**
     * Guarda transacciones particionando por MES (YYYY-MM).
     * Retorna las transacciones que se mantienen en memoria (Hot Data).
     * Para FASE 2: Mantenemos el año en curso en memoria, el resto a disco.
     * O mejor, según el roadmap: "Cargar solo un archivo".
     * Pero React necesita un estado inicial.
     * 
     * Estrategia Híbrida V2:
     * - Guardar TODO lo antiguo en YYYY-MM.json.
     * - Retornar solo el mes actual (o rango seleccionado) para la UI.
     * - Pero por compatibilidad con el código actual que espera array `transactions`,
     *   retornaremos lo del AÑO actual, igual que antes, pero guardado en shards mensuales.
     */
    public async partitionAndSave(
        allTransactions: Transaction[],
        currentYear: number
    ): Promise<Transaction[]> {

        // 1. Agrupar transacciones por Año-Mes
        const txByMonth = new Map<string, Transaction[]>();
        const activeTransactions: Transaction[] = []; // Lo que se queda en data.json (hot)

        for (const tx of allTransactions) {
            const year = parseInt(tx.date.substring(0, 4));
            const monthKey = tx.date.substring(0, 7); // YYYY-MM

            if (!txByMonth.has(monthKey)) txByMonth.set(monthKey, []);
            txByMonth.get(monthKey)?.push(tx);

            // Cold storage logic: Si es de años anteriores, no va a data.json principal
            if (year >= currentYear) {
                activeTransactions.push(tx);
            }
        }

        // 2. Guardar archivos mensuales (Shards)
        for (const [monthKey, txs] of txByMonth.entries()) {
            await this.saveMonthShard(monthKey, txs);
        }

        return activeTransactions;
    }

    /**
     * Guarda el shard mensual.
     */
    private async saveMonthShard(monthKey: string, transactions: Transaction[]) {
        const path = `${this.LEDGER_BASE_PATH}/${monthKey}.json`;

        await this.safeWrite(path, {
            period: monthKey,
            lastUpdated: new Date().toISOString(),
            count: transactions.length,
            transactions
        });
    }

    /**
     * Carga un mes específico.
     */
    public async loadMonthShard(monthKey: string): Promise<Transaction[]> {
        const path = `${this.LEDGER_BASE_PATH}/${monthKey}.json`;
        const data = await this.api.readJson<{ transactions: Transaction[] }>(path);
        return data?.transactions || [];
    }

    /**
     * Carga historial de un año específico escaneando los shards correspondientes.
     */
    public async loadArchiveYear(year: number): Promise<Transaction[]> {
        const yearPrefix = `${year}-`;
        let yearTransactions: Transaction[] = [];

        try {
            const files = await this.api.listJsonFiles(this.LEDGER_BASE_PATH);


            // Filtrar archivos que empiecen con "YYYY-" (ej: "2022-01.json")
            const monthFiles = files.filter(f => f.startsWith(yearPrefix) && f.endsWith('.json'));

            if (monthFiles.length === 0) {
                console.warn(`[Storage] No shard files found for year ${year} (Prefix: ${yearPrefix})`);
            } else {

            }

            for (const file of monthFiles) {
                const monthKey = file.replace('.json', '');
                const shardParams = await this.loadMonthShard(monthKey);
                if (shardParams && shardParams.length > 0) {
                    yearTransactions = yearTransactions.concat(shardParams);
                }
            }
        } catch (error) {
            console.warn(`[Storage] Error loading archive for year ${year}:`, error);
        }

        return yearTransactions.sort((a, b) => b.date.localeCompare(a.date));
    }

    /**
     * Carga historial completo escaneando la carpeta ledger.
     */
    public async loadFullHistory(currentTransactions: Transaction[]): Promise<Transaction[]> {
        let allHistory = [...currentTransactions];

        try {
            const files = await this.api.listJsonFiles(this.LEDGER_BASE_PATH);

            // Filtrar y ordenar archivos YYYY-MM.json
            const monthFiles = files.filter(f => /^\d{4}-\d{2}\.json$/.test(f));

            for (const file of monthFiles) {
                const monthKey = file.replace('.json', '');
                // Evitar duplicados si currentTransactions ya tiene este mes (performance optimization needed later)
                // Por simplicidad: Cargamos todo y luego el Set de IDs en memoria lo limpia si hay conflicto,
                // pero idealmente 'currentTransactions' tiene prioridad.

                const archived = await this.loadMonthShard(monthKey);
                if (archived.length > 0) {
                    allHistory = allHistory.concat(archived);
                }
            }
        } catch (error) {
            console.warn("[Storage] Error loading ledger shards:", error);
        }

        // Deduplicar por ID por si acaso
        const seen = new Set();
        return allHistory.filter(tx => {
            const duplicate = seen.has(tx.id);
            seen.add(tx.id);
            return !duplicate;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }

    /**
     * Devuelve una lista de años disponibles (que tienen datos en ledger o son el año actual).
     */
    public async getAvailableYears(): Promise<string[]> {
        const years = new Set<string>();
        years.add(new Date().getFullYear().toString());

        try {
            const files = await this.api.listJsonFiles(this.LEDGER_BASE_PATH);
            for (const file of files) {
                const match = file.match(/^(\d{4})-\d{2}\.json$/);
                if (match) {
                    years.add(match[1]);
                }
            }
        } catch (error) {
            console.warn("[Storage] Error listing available years:", error);
        }

        // Devolver ordenados descendente
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }
}
