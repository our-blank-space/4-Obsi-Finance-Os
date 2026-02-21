
import { MigrationToV3 } from '../logic/MigrationToV3';
import { StorageService } from '../services/StorageService';
import { PluginData, Transaction, TransactionType } from '../types';
import { FinanceObsidianAPI } from '../types/obsidian';
import { createMockApi } from '../test/utils/mockApi';



describe('FinanceOS Architecture V3 (Longevity)', () => {

    // Test Data Generators
    const createLegacyTx = (id: string, area: string, date: string): Transaction => ({
        id, date, amount: 100, area, from: 'Bank', to: '',
        type: TransactionType.EXPENSE, currency: 'USD', note: 'Test'
    } as any);

    describe('1. Entity Normalization (Migration V3)', () => {
        it('should extract registries and normalize IDs', () => {
            const data: Partial<PluginData> = {
                transactions: [
                    createLegacyTx('1', 'Food', '2026-01-01'),
                    createLegacyTx('2', 'Food', '2026-01-02'), // Duplicate string
                    createLegacyTx('3', 'Tech', '2026-01-03')
                ],
                categoryRegistry: [
                    { id: 'cat-food', name: 'Food', type: 'expense', isArchived: false },
                    { id: 'cat-tech', name: 'Tech', type: 'expense', isArchived: false },
                    { id: 'cat-travel', name: 'Travel', type: 'expense', isArchived: false }
                ],
                accountRegistry: [
                    { id: 'acc-bank', name: 'Bank', currency: 'USD', isArchived: false },
                    { id: 'acc-cash', name: 'Cash', currency: 'USD', isArchived: false }
                ],
                budgets: [],
                recurrents: []
            };

            const result = MigrationToV3.run(data as PluginData);

            // Assert Registries
            expect(result.categoryRegistry).toBeDefined();
            expect(result.categoryRegistry.length).toBeGreaterThanOrEqual(3); // Food, Tech, Travel

            const foodCategory = result.categoryRegistry.find(c => c.name === 'Food');
            expect(foodCategory).toBeDefined();
            expect(foodCategory?.id).toBeDefined();

            // Assert Transactions Normalized
            const tx1 = result.transactions.find(t => t.id === '1');
            expect(tx1?.areaId).toBe(foodCategory?.id);
            expect(tx1?.fromId).toBeDefined(); // Should match 'Bank' account ID
        });
    });

    describe('2. Data Sharding (Partitioning)', () => {
        let api: FinanceObsidianAPI;
        let storage: StorageService;

        beforeEach(() => {
            api = createMockApi();
            storage = new StorageService(api, '.obsidian/plugins/finance-os-plugin2/data');
        });

        it('should partition cold data to archives and keep hot data', async () => {
            const transactions = [
                createLegacyTx('old-1', 'Food', '2024-05-20'),
                createLegacyTx('old-2', 'Food', '2025-12-31'),
                createLegacyTx('active-1', 'Food', '2026-01-01'),
                createLegacyTx('active-2', 'Food', '2026-05-20')
            ];

            const currentYear = 2026;
            const activeTxs = await storage.partitionAndSave(transactions, currentYear);

            // Assert Active Data (Returned)
            expect(activeTxs.length).toBe(2);
            expect(activeTxs.map(t => t.id)).toEqual(['active-1', 'active-2']);

            // Assert Archived Data (Written to File)
            expect(api.writeJson).toHaveBeenCalledTimes(2); // 2024 and 2025

            // Verify 2025 Archive Write
            const expectedPath2025 = '.obsidian/plugins/finance-os-plugin2/data/archives/finance-2025.json';
            const callArgs2025 = (api.writeJson as jest.Mock).mock.calls.find(call => call[0].includes('2025'));

            expect(callArgs2025).toBeDefined();
            expect(callArgs2025[0]).toBe(expectedPath2025);
            expect(callArgs2025[1].transactions.length).toBe(1);
            expect(callArgs2025[1].transactions[0].id).toBe('old-2');
        });
    });

});
