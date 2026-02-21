import { Data, Ledger } from '../types';
import { MigrationToV3 } from '../logic/MigrationToV3';
import { DEFAULT_ACCOUNTS, DEFAULT_AREAS } from '../data/taxonomy';

/**
 * Una migración pura del sistema.
 * Nunca muta input, nunca toca UI, nunca hace logs.
 */
interface Migration<T> {
    readonly from: number;
    readonly to: number;
    readonly apply: (data: Readonly<T>) => T;
}

/**
 * Custodio del tiempo del sistema.
 * ÚNICO lugar donde los datos históricos evolucionan.
 */
export class MigrationService {
    /**
     * Punto de entrada oficial de migraciones.
     * Determinista, ordenado y auditable.
     */
    static migrate(
        data: Readonly<Data.PluginData>,
        targetVersion: number
    ): Data.PluginData {
        let current: Data.PluginData = {
            ...data,
            version: data.version ?? 1
        };

        for (const migration of MIGRATIONS) {
            if (
                current.version === migration.from &&
                migration.to <= targetVersion
            ) {
                current = migration.apply(current);
            }
        }

        return current;
    }
}

/* -------------------------------------------------------------------------- */
/*                              MIGRACIONES                                   */
/* -------------------------------------------------------------------------- */

const MIGRATIONS: readonly Migration<Data.PluginData>[] = [
    migrateV5ToV6(),
    migrateV6ToV7(),
    migrateV7ToV8(),
    migrateV8ToV9(),
    migrateV9ToV10(),
    migrateV10ToV11()
];

/* -------------------------------------------------------------------------- */
/*                             IMPLEMENTACIONES                                */
/* -------------------------------------------------------------------------- */

/**
 * v5 → v6
 * Introduce soporte explícito para tags.
 */
function migrateV5ToV6(): Migration<Data.PluginData> {
    return {
        from: 5,
        to: 6,
        apply: (data) => ({
            ...data,
            version: 6,
            tags: Array.isArray(data.tags) ? data.tags : []
        })
    };
}

/**
 * v6 → v7
 * Recurrentes estructurales (Trial Hunter).
 * Extrae metadatos embebidos en el nombre.
 */
function migrateV6ToV7(): Migration<Data.PluginData> {
    return {
        from: 6,
        to: 7,
        apply: (data) => ({
            ...data,
            version: 7,
            recurrents: migrateRecurrentsToV7(data.recurrents)
        })
    };
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS PUROS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Migra recurrentes SIN romper el dominio.
 * Conserva todos los campos obligatorios.
 */
function migrateRecurrentsToV7(
    recurrents?: readonly Ledger.RecurrentTransaction[]
): Ledger.RecurrentTransaction[] {
    if (!Array.isArray(recurrents)) return [];

    return recurrents.map((r) => {
        const match = r.name.match(/#TRIAL:(\d{4}-\d{2}-\d{2})/);

        return {
            ...r, // 🔒 dominio intacto
            name: r.name.split(' #TRIAL')[0].trim(),
            isTrial: Boolean(match),
            trialEndDate: match?.[1] ?? r.trialEndDate
        };
    });
}

/* -------------------------------------------------------------------------- */
/*                             MIGRACIÓN v7 → v8                               */
/* -------------------------------------------------------------------------- */

/**
 * v7 → v8
 * Multi-Currency Architecture.
 * Transforma exchangeRate (single number) a exchangeRates (Record).
 */
function migrateV7ToV8(): Migration<Data.PluginData> {
    return {
        from: 7,
        to: 8,
        apply: (data: any) => {
            const legacyRate = data.exchangeRate || 4000;

            return {
                ...data,
                version: 8,
                exchangeRates: {
                    'USD': legacyRate,
                    'EUR': Math.round(legacyRate * 1.08), // Estimación EUR/USD
                    'GBP': Math.round(legacyRate * 1.25), // Estimación GBP/USD
                    'MXN': Math.round(legacyRate * 0.058), // Estimación MXN/USD
                    'BRL': Math.round(legacyRate * 0.20)   // Estimación BRL/USD
                },
                meta: {
                    ...data.meta,
                    version: 8
                }
            };
        }
    };
}

/**
 * v8 → v9
 * Entity Normalization (Architecture 3.0).
 * Creates Category and Account registries and populates stable IDs.
 */
function migrateV8ToV9(): Migration<Data.PluginData> {
    return {
        from: 8,
        to: 9,
        apply: (data: Data.PluginData) => {
            // Utilizamos la lógica centralizada de migración
            const migratedData = MigrationToV3.run({ ...data }); // Copia superficial para seguridad

            return {
                ...migratedData,
                version: 9,
                meta: {
                    ...migratedData.meta,
                    version: 9
                }
            };
        }
    };
}

/**
 * v9 → v10
 * Seed Default Taxonomy.
 * Ensures requested accounts and categories are present in the registries.
 */
function migrateV9ToV10(): Migration<Data.PluginData> {
    return {
        from: 9,
        to: 10,
        apply: (data: Data.PluginData) => {
            const categoryRegistry = [...data.categoryRegistry];
            const accountRegistry = [...data.accountRegistry];

            // Ensure Accounts
            DEFAULT_ACCOUNTS.forEach((accName: string) => {
                if (!accountRegistry.some(a => a.name === accName)) {
                    accountRegistry.push({
                        id: `acc-${accName.toLowerCase().replace(/\s+/g, '-')}`,
                        name: accName,
                        currency: data.baseCurrency || 'COP',
                        isArchived: false
                    });
                }
            });

            // Ensure Categories
            DEFAULT_AREAS.forEach((catName: string) => {
                if (!categoryRegistry.some(c => c.name === catName)) {
                    categoryRegistry.push({
                        id: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
                        name: catName,
                        isArchived: false
                    });
                }
            });

            return {
                ...data,
                version: 10,
                accountRegistry,
                categoryRegistry,
                meta: {
                    ...data.meta,
                    version: 10
                }
            };
        }
    };
}

/**
 * v10 → v11
 * Feature Activation (Assets & Business).
 * Ensures that key modules are enabled if they were missing from previous configs.
 */
function migrateV10ToV11(): Migration<Data.PluginData> {
    return {
        from: 10,
        to: 11,
        apply: (data: Data.PluginData) => {
            const enabledModules: any[] = [...(data.enabledModules || [])];

            // Core Modules that should be visible by default in this version
            const requiredModules = ['assets', 'business', 'custodial'];

            requiredModules.forEach(mod => {
                if (!enabledModules.includes(mod)) {
                    enabledModules.push(mod);
                }
            });

            return {
                ...data,
                version: 11,
                enabledModules,
                meta: {
                    ...data.meta,
                    version: 11
                }
            };
        }
    };
}
