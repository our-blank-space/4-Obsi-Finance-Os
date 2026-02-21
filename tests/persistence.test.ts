import { PersistenceService } from '../src/services/PersistenceService';
import { Data } from '../src/types';
import { App, TFile } from 'obsidian';

// Mock TFile since it's used in instanceof checks
jest.mock('obsidian', () => ({
    ...jest.requireActual('obsidian'),
    TFile: class { },
    normalizePath: (path: string) => path,
    Notice: jest.fn()
}));

const mockAdapter = {
    exists: jest.fn(),
    read: jest.fn(),
    write: jest.fn(),
    append: jest.fn(),
    remove: jest.fn(),
    rename: jest.fn(),
    copy: jest.fn(),
    createFolder: jest.fn(),
    rmdir: jest.fn()
};

const mockVault = {
    adapter: mockAdapter,
    getAbstractFileByPath: jest.fn(),
    read: jest.fn(),
    createFolder: jest.fn(),
    create: jest.fn(),
    modify: jest.fn()
};

const mockApp = {
    vault: mockVault
} as unknown as App;

describe('PersistenceService', () => {
    let service: PersistenceService;
    let sampleData: Data.PluginData;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PersistenceService(mockApp, 'plugin-dir');

        // Setup minimal valid data
        sampleData = {
            version: 1,
            settings: { geminiApiKey: 'test-key' } as any,
            features: {},
            meta: {},
            baseCurrency: 'USD',
            exchangeRates: { 'EUR': 0.85 },
            transactions: [
                { id: 'tx1', date: '2024-01-01', amount: 100, type: 'expense' } as any,
                { id: 'tx2', date: '2023-12-31', amount: 50, type: 'income' } as any // Historical
            ],
            assets: [{ id: 'asset1', name: 'House' }] as any,
            debts: [],
            loans: [],
            trades: [],
            budgets: [],
            recurrents: [],
            snapshots: [],
            reminders: [],
            tradingTransfers: [],
            custodialAccounts: [],
            business: {} as any,
            scenarios: [],
            tags: [],
            categoryRegistry: [],
            accountRegistry: [],
            assetTypes: [],
            enabledModules: [],
            projectionParams: {} as any
        } as any;
    });

    test('consolidate should split data into correct files', async () => {
        // Setup mocks
        mockAdapter.exists.mockResolvedValue(false); // Assume fresh write
        mockVault.getAbstractFileByPath.mockReturnValue(null); // No existing files

        await service.consolidate(sampleData);

        // Verify sharding
        // 2024-01 -> tx1
        // 2023-12 -> tx2
        expect(mockAdapter.write).toHaveBeenCalledWith(
            expect.stringContaining('plugin-dir/.finance-db/ledger/2024-01.json.tmp'),
            expect.any(String)
        );
        expect(mockAdapter.write).toHaveBeenCalledWith(
            expect.stringContaining('plugin-dir/.finance-db/ledger/2023-12.json.tmp'),
            expect.any(String)
        );

        // Verify granular split logic via Repository
        // assets.json should contain the asset
        expect(mockAdapter.write).toHaveBeenCalledWith(
            expect.stringContaining('plugin-dir/.finance-db/assets.json.tmp'),
            expect.stringContaining('"name": "House"')
        );

        // settings.json should contain settings
        expect(mockAdapter.write).toHaveBeenCalledWith(
            expect.stringContaining('plugin-dir/.finance-db/settings.json.tmp'),
            expect.stringContaining('"geminiApiKey": "test-key"')
        );
    });

    test('loadDataWithFailover should prefer granular data if present', async () => {
        // Setup infra.json existing
        mockAdapter.exists.mockImplementation((path: string) => {
            if (path.includes('infra.json') || path.includes('settings.json')) return Promise.resolve(true);
            return Promise.resolve(false);
        });

        mockAdapter.read.mockImplementation((path: string) => {
            if (path.includes('settings.json')) return Promise.resolve(JSON.stringify({ settings: { geminiApiKey: 'granular-key' } }));
            if (path.includes('infra.json')) return Promise.resolve(JSON.stringify({ baseCurrency: 'EUR' }));
            return Promise.resolve('{}');
        });

        const data = await service.loadDataWithFailover();

        expect(data).toBeDefined();
        if (data) {
            expect(data.settings.geminiApiKey).toBe('granular-key');
            expect(data.baseCurrency).toBe('EUR');
        }

        // Legacy path should NOT be called
        expect(mockAdapter.read).not.toHaveBeenCalledWith('plugin-dir/data.json');
    });

    test('loadDataWithFailover should fall back to legacy data.json', async () => {
        // Setup Granular MISSING
        mockAdapter.exists.mockImplementation((path: string) => {
            if (path === 'plugin-dir/data.json') return Promise.resolve(true);
            return Promise.resolve(false);
        });

        mockAdapter.read.mockImplementation((path: string) => {
            if (path === 'plugin-dir/data.json') return Promise.resolve(JSON.stringify({ version: 99, settings: { geminiApiKey: 'legacy-key' } }));
            return Promise.resolve(null);
        });

        const data = await service.loadDataWithFailover();

        expect(data).toBeDefined();
        if (data) {
            expect(data.settings.geminiApiKey).toBe('legacy-key');
        }
    });
});
