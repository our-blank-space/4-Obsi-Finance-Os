/**
 * Backup Service
 * ==============
 * Sistema de backup automático para datos financieros.
 * Crítico para proteger contra pérdida de datos.
 */
import { PluginData } from '../types';

interface Backup {
    id: string;
    timestamp: Date;
    version: number;
    data: PluginData;
    checksum: string;
    context: string;
}

interface BackupConfig {
    maxBackups: number;
    backupPath: string;
    autoBackupInterval: number; // minutos
}

export class BackupService {
    private config: BackupConfig = {
        maxBackups: 10,
        backupPath: 'Finance/Backups', // Ruta visible en el Vault
        autoBackupInterval: 30 // cada 30 minutos
    };

    private backups: Backup[] = [];
    private autoBackupTimer?: ReturnType<typeof setInterval>;

    constructor(
        private saveToFile: (path: string, content: string) => Promise<void>,
        private loadFromFile: (path: string) => Promise<string | null>,
        private listFiles: (path: string) => Promise<string[]>
    ) { }

    /**
     * Inicia el backup automático
     */
    startAutoBackup(getData: () => PluginData): void {
        this.stopAutoBackup();

        this.autoBackupTimer = setInterval(async () => {
            try {
                const data = getData();
                await this.createBackup(data, 'auto');
            } catch (error) {
                // Silently fail on auto-backup
            }
        }, this.config.autoBackupInterval * 60 * 1000);
    }

    /**
     * Detiene el backup automático
     */
    stopAutoBackup(): void {
        if (this.autoBackupTimer) {
            clearInterval(this.autoBackupTimer);
            this.autoBackupTimer = undefined;
        }
    }

    /**
     * Crea un backup manual
     */
    async createBackup(data: PluginData, context: string): Promise<string> {
        const timestamp = new Date();
        const id = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}_${context}`;

        const backup: Backup = {
            id,
            timestamp,
            version: data.version,
            data,
            checksum: this.calculateChecksum(data),
            context
        };

        const backupPath = `${this.config.backupPath}/${id}.json`;

        try {
            await this.saveToFile(backupPath, JSON.stringify(backup, null, 2));
            this.backups.push(backup);

            // Rotar backups antiguos
            await this.rotateBackups();

            return id;
        } catch (error) {
            console.error('[FinanceOS] Error creando backup:', error);
            throw error;
        }
    }

    /**
     * Restaura desde un backup específico
     */
    async restore(backupId: string): Promise<PluginData> {
        const backupPath = `${this.config.backupPath}/${backupId}.json`;

        const content = await this.loadFromFile(backupPath);
        if (!content) {
            throw new Error(`Backup no encontrado: ${backupId}`);
        }

        const backup: Backup = JSON.parse(content);

        // Verificar integridad
        const currentChecksum = this.calculateChecksum(backup.data);
        if (currentChecksum !== backup.checksum) {
            throw new Error('Backup corrupto: checksum no coincide');
        }

        return backup.data;
    }

    /**
     * Lista todos los backups disponibles
     */
    async listBackups(): Promise<Omit<Backup, 'data'>[]> {
        try {
            const files = await this.listFiles(this.config.backupPath);
            const backups: Omit<Backup, 'data'>[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await this.loadFromFile(`${this.config.backupPath}/${file}`);
                    if (content) {
                        const backup: Backup = JSON.parse(content);
                        backups.push({
                            id: backup.id,
                            timestamp: backup.timestamp,
                            version: backup.version,
                            checksum: backup.checksum,
                            context: backup.context
                        });
                    }
                }
            }

            return backups.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        } catch (error) {
            console.error('[FinanceOS] Error listando backups:', error);
            return [];
        }
    }

    /**
     * Elimina backups antiguos manteniendo solo los más recientes
     */
    private async rotateBackups(): Promise<void> {
        const backups = await this.listBackups();

        // Mantener auto-backups y manual-backups por separado
        const autoBackups = backups.filter(b => b.context === 'auto');
        const manualBackups = backups.filter(b => b.context !== 'auto');

        // Rotar auto-backups (mantener últimos 5)
        const toDeleteAuto = autoBackups.slice(5);
        for (const backup of toDeleteAuto) {
            await this.deleteBackup(backup.id);
        }

        // Rotar manual-backups (mantener últimos 10)
        const toDeleteManual = manualBackups.slice(10);
        for (const backup of toDeleteManual) {
            await this.deleteBackup(backup.id);
        }
    }

    /**
     * Elimina un backup específico
     */
    private async deleteBackup(backupId: string): Promise<void> {
        const backupPath = `${this.config.backupPath}/${backupId}.json`;
        // Nota: La implementación de delete dependerá de la API de Obsidian

    }

    /**
     * Calcula checksum para verificar integridad
     */
    private calculateChecksum(data: PluginData): string {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Crea backup antes de operaciones críticas
     */
    async createPreOperationBackup(
        data: PluginData,
        operation: string
    ): Promise<string> {
        return this.createBackup(data, `pre-${operation}`);
    }
}
