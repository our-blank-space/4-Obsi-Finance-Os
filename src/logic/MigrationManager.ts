import { PluginData } from '../types';
import { DEFAULT_DATA } from '../data/defaults';
import { MigrationService } from '../services/MigrationService';
import { DEFAULT_ACCOUNTS, DEFAULT_AREAS } from '../data/taxonomy';

/**
 * MigrationManager
 * 
 * Responsable de asegurar que los datos del plugin estén siempre normalizados
 * y actualizados a la última versión del esquema (V3/V9+).
 */
export class MigrationManager {
    /**
     * Normaliza y actualiza el esquema de datos.
     * Se debe llamar al cargar datos de disco o al inicializar el plugin.
     */
    static upgradeDataSchema(data: any): PluginData {
        // Audit Phase 3: Pre-Migration Validation
        // Si el objeto no parece datos del plugin o tiene una versión futura desconocida, 
        // abortamos preventivamente para evitar corrupción.
        if (data && typeof data === 'object' && data.version > DEFAULT_DATA.version) {
            console.error(`[FinanceOS] Version Mismatch: Data (v${data.version}) is newer than plugin (v${DEFAULT_DATA.version}).`);
            throw new Error(`CRITICAL: Your data is from a newer version (v${data.version}) of the plugin. Please update the plugin to avoid data loss.`);
        }

        const base = { ...DEFAULT_DATA };
        const input = data || {};

        // 1. Aplicar migraciones secuenciales si existen (V5 -> V6 -> V7 -> V8 -> V9)
        const targetVersion = DEFAULT_DATA.version;
        let upgraded = MigrationService.migrate(input as PluginData, targetVersion);

        // 2. Asegurar colecciones básicas (Sanitización)
        upgraded = {
            ...base,
            ...upgraded,
            settings: { ...base.settings, ...(upgraded.settings || {}) },
            features: { ...base.features, ...(upgraded.features || {}) },
            meta: { ...base.meta, ...(upgraded.meta || {}) }
        };

        // 3. ENFORCE V3 NORMALIZATION (Idempotent Repair)
        // Ejecutamos esto SIEMPRE para asegurar que los Registries y IDs estén sincronizados,
        // incluso si la versión ya es 9 (para arreglar estados sucios durante desarrollo).
        const { MigrationToV3 } = require('./MigrationToV3');
        upgraded = MigrationToV3.run(upgraded);

        // Auditoría Fase 4: Limpieza absoluta de campos legacy (Delegado a MigrationToV3 vía Service)
        delete (upgraded as any).accounts;
        delete (upgraded as any).areas;

        // 3. Inicializar colecciones faltantes (Safety net para tipos nuevos)
        const collections: (keyof PluginData)[] = [
            'transactions', 'budgets', 'recurrents', 'reminders',
            'snapshots', 'assets', 'loans', 'debts', 'trades',
            'tradingTransfers', 'tags', 'custodialAccounts', 'scenarios'
        ];

        collections.forEach(key => {
            if (!upgraded[key]) {
                (upgraded as any)[key] = [];
            }
        });

        // 4. Asegurar campos requeridos en registries (V3 hardening)
        upgraded.accountRegistry = upgraded.accountRegistry.map(acc => ({
            ...acc,
            currency: acc.currency || upgraded.baseCurrency || 'COP',
            isArchived: !!acc.isArchived
        }));

        upgraded.categoryRegistry = upgraded.categoryRegistry.map(cat => ({
            ...cat,
            isArchived: !!cat.isArchived
        }));

        // 5. SEED DEFAULT TAXONOMY (User Request Idempotency)
        // Agregamos las cuentas y categorías por defecto si no existen
        DEFAULT_ACCOUNTS.forEach(accName => {
            if (!upgraded.accountRegistry.some(a => a.name === accName)) {
                upgraded.accountRegistry.push({
                    id: `acc-${accName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: accName,
                    currency: upgraded.baseCurrency || 'COP',
                    isArchived: false
                });
            }
        });

        DEFAULT_AREAS.forEach(catName => {
            if (!upgraded.categoryRegistry.some(c => c.name === catName)) {
                upgraded.categoryRegistry.push({
                    id: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: catName,
                    isArchived: false
                });
            }
        });

        return upgraded;
    }
}
