import { MigrationToV3 } from '../logic/MigrationToV3';
import { StorageService } from '../services/StorageService';
import { PersistenceTests } from '../services/PersistenceTests';
import { PluginData, Transaction, TransactionType } from '../types';
import { FinanceObsidianAPI } from '../types/obsidian';
import { Notice } from 'obsidian';

export class RuntimeTests {
    private api: FinanceObsidianAPI;
    private basePath: string;

    constructor(api: FinanceObsidianAPI, basePath: string = '.obsidian/plugins/finance-os-plugin2') {
        this.api = api;
        this.basePath = basePath;
    }

    public async runAll() {
        console.log("--------------- STARTING RUNTIME TESTS ---------------");
        new Notice("🧪 Iniciando Tests de Arquitectura V3...", 3000);

        try {
            await this.testNormalization();
            await this.testSharding();

            const pTests = new PersistenceTests(this.api, this.basePath);
            await pTests.run();

            console.log("✅ ALL TESTS PASSED");
            new Notice("✅ PRUEBAS EXITOSAS: Normalización y Persistencia funcionan.", 5000);
        } catch (e) {
            console.error("❌ TEST FAILED", e);
            new Notice(`❌ ERROR EN PRUEBAS: ${e.message}`, 10000);
        }
        console.log("--------------- END RUNTIME TESTS ---------------");
    }

    private assert(condition: boolean, message: string) {
        if (!condition) throw new Error(message);
    }

    private async testNormalization() {
        console.log("TEST: Entity Normalization...");

        const data: Partial<PluginData> = {
            transactions: [
                { id: '1', area: 'Food', from: 'Bank', date: '2026-01-01', type: TransactionType.EXPENSE, amount: 100, currency: 'USD', note: 'T1' } as any,
                { id: '2', area: 'Food', from: 'Cash', date: '2026-01-02', type: TransactionType.EXPENSE, amount: 50, currency: 'USD', note: 'T2' } as any
            ],
            categoryRegistry: [
                { id: 'cat-food', name: 'Food', type: 'expense', isArchived: false },
                { id: 'cat-tech', name: 'Tech', type: 'expense', isArchived: false }
            ],
            accountRegistry: [
                { id: 'acc-bank', name: 'Bank', currency: 'USD', isArchived: false },
                { id: 'acc-cash', name: 'Cash', currency: 'USD', isArchived: false }
            ],
            budgets: [],
            recurrents: []
        };

        const result = MigrationToV3.run(data as PluginData);

        this.assert(result.categoryRegistry.length >= 2, "Should have created categories");
        const foodCat = result.categoryRegistry.find(c => c.name === 'Food');
        this.assert(!!foodCat, "Category 'Food' not found in registry");
        this.assert(!!foodCat?.id, "Category 'Food' has no ID");

        const tx1 = result.transactions.find(t => t.id === '1');
        this.assert(tx1?.areaId === foodCat?.id, "Transaction 1 not linked to Food Category ID");

        console.log("✅ Normalization Passed");
    }

    private async testSharding() {
        console.log("TEST: Data Sharding...");

        // Mock Storage Service via API wrapper or direct instantiation if possible
        // We use the real service but mocked writes to avoid corrupting data? 
        // Better: We rely on the logic check.

        const storage = new StorageService(this.api, this.basePath);

        const transactions = [
            { id: 'old-1', date: '2020-01-01', amount: 10, type: TransactionType.EXPENSE, currency: 'USD' } as any,
            { id: 'new-1', date: new Date().getFullYear() + '-01-01', amount: 10, type: TransactionType.EXPENSE, currency: 'USD' } as any
        ];

        // Hack: Intercept API writeJson
        let writtenFiles: Record<string, any> = {};
        const originalWrite = this.api.writeJson;
        this.api.writeJson = async (path, data) => { writtenFiles[path] = data; };

        const active = await storage.partitionAndSave(transactions, new Date().getFullYear());

        // Restore API
        this.api.writeJson = originalWrite;

        this.assert(active.length === 1, "Should return only 1 active transaction");
        this.assert(active[0].id === 'new-1', "Active transaction should be the current year one");

        const archiveKey = Object.keys(writtenFiles).find(k => k.includes('2020'));
        this.assert(!!archiveKey, "Should have written 2020 archive file");
        this.assert(writtenFiles[archiveKey!].transactions.length === 1, "Archive 2020 should have 1 transaction");

        console.log("✅ Sharding Passed");
    }
}
