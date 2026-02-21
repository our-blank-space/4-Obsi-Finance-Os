import { ShardManager } from './ShardManager';

export interface IndexData {
    batches: Record<string, string>; // batchId -> 'production/batch-001.json'
    lastUpdated: string;
}

/**
 * GlobalIndexer
 * 
 * Mantiene el archivo core/index.json que actúa como mapa del tesoro.
 * Permite saber dónde está cada cosa sin recorrer carpetas.
 */
export class GlobalIndexer {
    private manager: ShardManager;
    private indexPath = '.finance-db/core/index.json';
    private cache: IndexData | null = null;

    constructor(manager: ShardManager) {
        this.manager = manager;
    }

    /**
     * Inicializa el índice si no existe.
     */
    public async initialize(): Promise<void> {
        const existing = await this.manager.loadShard<IndexData>(this.indexPath);
        if (existing) {
            this.cache = existing;
        } else {
            this.cache = {
                batches: {},
                lastUpdated: new Date().toISOString()
            };
            await this.save();
        }
    }

    public async registerBatch(batchId: string, location: string): Promise<void> {
        if (!this.cache) await this.initialize();
        if (!this.cache) return; // Should not happen

        this.cache.batches[batchId] = location;
        this.cache.lastUpdated = new Date().toISOString();
        await this.save();
    }

    public async getBatchLocation(batchId: string): Promise<string | undefined> {
        if (!this.cache) await this.initialize();
        return this.cache?.batches[batchId];
    }

    private async save(): Promise<void> {
        if (this.cache) {
            await this.manager.saveShard(this.indexPath, this.cache);
        }
    }
}
