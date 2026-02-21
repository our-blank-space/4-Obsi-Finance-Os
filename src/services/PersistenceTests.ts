
import { FinanceObsidianAPI } from '../types/obsidian';
import { ShardManager } from './ShardManager';
import { PersistenceService } from './PersistenceService';
import { PluginData, TransactionType } from '../types';

export class PersistenceTests {
    private api: FinanceObsidianAPI;
    private basePath: string;

    constructor(api: FinanceObsidianAPI, basePath: string) {
        this.api = api;
        this.basePath = basePath;
    }

    private assert(condition: boolean, message: string) {
        if (!condition) throw new Error(message);
    }

    public async run() {
        console.log("--- Starting Persistence Layer Tests ---");

        await this.testBasePathResolution();
        await this.testRawJsonOperations();
        await this.testPersistenceLifecycle();

        console.log("✅ Persistence Layer Tests Passed");
    }

    private async testBasePathResolution() {
        console.log("TEST: Base Path Resolution...");
        this.assert(this.basePath.length > 0, "Base path should not be empty");
        this.assert(this.basePath.includes('finance-os'), "Base path should look like a plugin path");
        console.log(`[Tests] Verified basePath: ${this.basePath}`);
    }

    private async testRawJsonOperations() {
        console.log("TEST: Raw JSON Operations...");
        const testPath = `${this.basePath}/.finance-db/test_write.json`;
        const testData = { success: true, timestamp: Date.now() };

        await this.api.writeJson(testPath, testData);
        const readData = await this.api.readJson<any>(testPath);

        this.assert(readData !== null, "Should be able to read back written JSON");
        this.assert(readData.success === true, "Read data should match written data");
        console.log("✅ Raw JSON Ops Passed");
    }

    private async testPersistenceLifecycle() {
        console.log("TEST: Persistence Lifecycle (Force Save)...");

        const shardManager = new ShardManager(this.api, this.basePath);
        const persistence = new PersistenceService(this.api, this.basePath, shardManager);

        const testState = {
            transactions: [
                { id: 'test-cycle-1', date: '2022-01-01', amount: 99, currency: 'USD', type: TransactionType.EXPENSE, area: 'Test' }
            ],
            categoryRegistry: [],
            accountRegistry: [],
            meta: { mode: 'prod' }
        };

        // We expect this to:
        // 1. Shard the 2022 transaction to .finance-db/ledger/2022-01.json
        // 2. Write the remainder to the main data.json

        await persistence.forceSave(testState);

        // Verify shard exists
        const shardData = await this.api.readJson<any>(`${this.basePath}/.finance-db/ledger/2022-01.json`);
        this.assert(shardData !== null, "2022 shard file should have been created");
        this.assert(shardData.transactions.some((t: any) => t.id === 'test-cycle-1'), "Shard should contain the test transaction");

        console.log("✅ Persistence Lifecycle Passed");
    }
}
