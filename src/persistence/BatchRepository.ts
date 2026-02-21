import { FinanceObsidianAPI } from '../types';
import { Batch } from '../types/agripro';

export class BatchRepository {
    private api: FinanceObsidianAPI;
    private readonly BASE_PATH = '.finance-db/agripro/batches';

    constructor(api: FinanceObsidianAPI) {
        this.api = api;
    }

    /**
     * Guarda un lote en su propio archivo shard.
     * @param batch El objeto Batch completo.
     */
    public async save(batch: Batch): Promise<void> {
        if (!batch.id) throw new Error("Batch must have an ID to be saved.");

        // Sharding Strategy: Individual file per batch
        const path = `${this.BASE_PATH}/${batch.id}.json`;

        // Ensure atomic write (Obsidian API handles this mostly)
        await this.api.writeJson(path, {
            ...batch,
            lastUpdated: new Date().toISOString()
        });

        console.debug(`[BatchRepository] Saved batch ${batch.id} to ${path}`);
    }

    /**
     * Carga un lote desde su archivo shard.
     * @param batchId ID del lote
     */
    public async load(batchId: string): Promise<Batch | null> {
        const path = `${this.BASE_PATH}/${batchId}.json`;
        try {
            const batch = await this.api.readJson<Batch>(path);
            if (!batch) return null;
            return batch;
        } catch (error) {
            console.error(`[BatchRepository] Failed to load batch ${batchId}`, error);
            return null;
        }
    }

    /**
     * Elimina un archivo de lote.
     * @param batchId ID del lote
     */
    public async delete(batchId: string): Promise<void> {
        // TODO: Add delete functionality to FinanceObsidianAPI if not present
        // taking a conservative approach: move to trash or just archive
        console.warn("[BatchRepository] Delete not implemented yet to prevent data loss.");
    }
}
