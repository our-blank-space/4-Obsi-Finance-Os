import { PluginData, FinanceCategory, FinanceAccount, Transaction, Budget, RecurrentTransaction } from '../types';

/**
 * Migration Service for FinanceOS v3.0 Entity Normalization.
 * 
 * This service is responsible for converting legacy string-based entity references
 * (Areas, Accounts) into stable UUID-based entities.
 */
/**
 * Helper robusto para generar UUIDs.
 * Funciona en entornos modernos (Obsidian/Electron) y en entornos de prueba (Jest/Node legacy)
 */
import { generateUUID } from '../utils/uuid';

export class MigrationToV3 {

    public static run(data: PluginData): PluginData {

        // 1. Initialize Registries if missing
        if (!data.categoryRegistry) data.categoryRegistry = [];
        if (!data.accountRegistry) data.accountRegistry = [];

        // 2. Build Category Registry
        const categoryMap = new Map<string, string>(); // Name -> ID

        // Load existing categories if any (re-run safety)
        data.categoryRegistry.forEach(c => categoryMap.set(c.name, c.id));

        // Scan sources for Categories
        const legacyAreas = (data as any).areas || [];
        const uniqueCategories = new Set<string>([
            ...legacyAreas,
            ...data.transactions.map(t => t.area).filter(Boolean),
            ...data.budgets.map(b => b.area).filter(Boolean),
            ...data.recurrents.map(r => r.area).filter(Boolean)
        ]);

        uniqueCategories.forEach(catName => {
            if (!categoryMap.has(catName)) {
                const newId = generateUUID();
                const newCat: FinanceCategory = {
                    id: newId,
                    name: catName,
                    type: 'expense', // Default, logic can be improved later
                    isArchived: false
                };
                data.categoryRegistry.push(newCat);
                categoryMap.set(catName, newId);
            }
        });

        // 3. Build Account Registry
        const accountMap = new Map<string, string>(); // Name -> ID

        data.accountRegistry.forEach(a => accountMap.set(a.name, a.id));

        const legacyAccounts = (data as any).accounts || [];
        const uniqueAccounts = new Set<string>([
            ...legacyAccounts,
            ...data.transactions.map(t => (t as any).from).filter(Boolean),
            ...data.transactions.map(t => (t as any).to).filter(Boolean),
            ...data.recurrents.map(r => (r as any).account).filter(Boolean)
        ]);

        uniqueAccounts.forEach(accName => {
            if (!accountMap.has(accName)) {
                const newId = generateUUID();
                const newAcc: FinanceAccount = {
                    id: newId,
                    name: accName,
                    currency: data.baseCurrency, // Default to base, user can edit later
                    isArchived: false
                };
                data.accountRegistry.push(newAcc);
                accountMap.set(accName, newId);
            }
        });

        // 4. Normalize Transactions
        data.transactions = data.transactions.map(t => {
            const updates: Partial<Transaction> = {};

            // 4a. Critical Safety: Ensure ID exists
            if (!t.id) {
                updates.id = generateUUID();
            }

            if (t.area && categoryMap.has(t.area)) updates.areaId = categoryMap.get(t.area);
            if (t.from && accountMap.has(t.from)) updates.fromId = accountMap.get(t.from);
            if (t.to && accountMap.has(t.to)) updates.toId = accountMap.get(t.to);

            return { ...t, ...updates };
        });

        // 5. Normalize Budgets
        data.budgets = data.budgets.map(b => ({
            ...b,
            areaId: b.area && categoryMap.has(b.area) ? categoryMap.get(b.area) : b.areaId
        }));

        // 6. Normalize Recurrents
        data.recurrents = data.recurrents.map(r => ({
            ...r,
            areaId: r.area && categoryMap.has(r.area) ? categoryMap.get(r.area) : r.areaId,
            accountId: r.account && accountMap.has(r.account) ? accountMap.get(r.account) : r.accountId
        }));

        // 7. BACKFILL: Exchange Rate Snapshots (Historical Integrity)
        // Freeze the value of past transactions using current known rates if snapshot is missing.
        const rates = data.exchangeRates || {};
        const baseCurrency = data.baseCurrency || 'COP';

        data.transactions = data.transactions.map(t => {
            if (t.exchangeRateSnapshot !== undefined) return t;

            let snapshot = 1;
            if (t.currency !== baseCurrency) {
                // Try to find rate in current registry
                // Rate format: 1 Unit of Currency = X Base Currency
                // If not found, fallback to 1 (parity) or legacy global exchangeRate if USD
                if (rates[t.currency]) {
                    snapshot = rates[t.currency];
                } else if (t.currency === 'USD' && (data as any).exchangeRate) {
                    snapshot = (data as any).exchangeRate;
                }
            }

            return {
                ...t,
                exchangeRateSnapshot: snapshot
            };
        });

        return data;
    }

    /**
     * Normaliza una sola transacción usando registries existentes.
     * Útil para eventos de sincronización de archivos individuales.
     */
    public static normalizeTransaction(t: Transaction, categories: FinanceCategory[], accounts: FinanceAccount[]): Transaction {
        const updates: Partial<Transaction> = {};

        if (t.area) {
            const cat = categories.find(c => c.name.toLowerCase() === t.area?.toLowerCase());
            if (cat) updates.areaId = cat.id;
        }

        if (t.from) {
            const acc = accounts.find(a => a.name.toLowerCase() === t.from?.toLowerCase());
            if (acc) updates.fromId = acc.id;
        }

        if (t.to && t.to !== 'none') {
            const acc = accounts.find(a => a.name.toLowerCase() === t.to?.toLowerCase());
            if (acc) updates.toId = acc.id;
        }

        return { ...t, ...updates };
    }
}
