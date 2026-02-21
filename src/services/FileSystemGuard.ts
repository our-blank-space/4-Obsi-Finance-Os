import { App, normalizePath } from 'obsidian';

export class FileSystemGuard {
    private readonly REQUIRED_PATHS: string[];

    constructor(private app: App, basePath: string) {
        const root = `${basePath}/.finance-db`;
        this.REQUIRED_PATHS = [
            root,
            `${root}/wal`,
            `${root}/ledger`,
            `${root}/core`
        ];
    }

    /**
     * Garantiza la existencia de la estructura de directorios.
     * Operación idempotente y ligera.
     */
    public async ensureStructure(): Promise<void> {
        for (const path of this.REQUIRED_PATHS) {
            const normalized = normalizePath(path);
            if (!(await this.app.vault.adapter.exists(normalized))) {
                try {
                    await this.app.vault.createFolder(normalized);
                } catch (e) {
                    // Ignorar error si se creó concurrentemente o ya existe
                }
            }
        }
    }
}
