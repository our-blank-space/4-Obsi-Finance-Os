import { FinanceObsidianAPI, Transaction } from '../types';

export class ShardManager {
    private api: FinanceObsidianAPI;
    private readonly BASE_PATH = '.finance-db';

    constructor(api: FinanceObsidianAPI) {
        this.api = api;
    }

    /**
     * Inicializa la estructura de carpetas si no existe (Bootstrap).
     */
    async ensureDatabaseStructure() {
        const dirs = [
            this.BASE_PATH,
            `${this.BASE_PATH}/ledger`,
            `${this.BASE_PATH}/core`
        ];
        for (const dir of dirs) {
            await this.api.createFolder(dir);
        }
    }

    /**
     * Guarda transacciones fusionándolas con el archivo existente (Atomic Merge).
     */
    async persistShard(month: string, newTransactions: Transaction[]) {
        const path = `${this.BASE_PATH}/ledger/${month}.json`;

        // 1. Leer datos existentes para no borrar nada
        const existingData = await this.api.readJson<{ transactions: Transaction[] }>(path);
        const existingTxs = existingData?.transactions || [];

        // 2. Fusionar (Merge) deduplicando por ID
        const txMap = new Map<string, Transaction>();
        existingTxs.forEach(tx => txMap.set(tx.id, tx));
        newTransactions.forEach(tx => txMap.set(tx.id, tx));

        // 3. Escribir atómicamente
        await this.api.writeJson(path, {
            month,
            lastUpdated: new Date().toISOString(),
            transactions: Array.from(txMap.values())
        });
    }

    async loadShard(month: string): Promise<Transaction[]> {
        const path = `${this.BASE_PATH}/ledger/${month}.json`;
        const data = await this.api.readJson<{ transactions: Transaction[] }>(path);
        return data?.transactions || [];
    }

    // Compatibility method for GlobaIndexer or other legacy services
    async listShards(directory: string = 'ledger'): Promise<string[]> {
        // Adjust directory logic if needed, but assuming standard subfolders
        const path = `${this.BASE_PATH}/${directory}`;
        return await this.api.listJsonFiles(path);
    }
}
