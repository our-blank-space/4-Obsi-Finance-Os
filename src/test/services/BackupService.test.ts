/**
 * BackupService Test Suite
 * =========================
 * Tests para el sistema de backup de datos financieros.
 */

import { BackupService } from '../../services/BackupService';
import { Data, Ledger } from '../../types';
const { TransactionType, TransactionSentiment } = Ledger;

// Mock de filesystem
const createMockFileSystem = () => {
    const storage = new Map<string, string>();

    return {
        saveToFile: jest.fn(async (path: string, content: string) => {
            storage.set(path, content);
        }),
        loadFromFile: jest.fn(async (path: string) => {
            return storage.get(path) || null;
        }),
        listFiles: jest.fn(async (path: string) => {
            return Array.from(storage.keys())
                .filter(key => key.startsWith(path))
                .map(key => key.split('/').pop()!);
        }),
        storage
    };
};

// Mock de PluginData
const createMockData = (overrides: Partial<Data.PluginData> = {}): Data.PluginData => ({
    version: 10,
    settings: {
        transactionsFolder: 'Finance/Transactions',
        createNoteOnLog: true,
        smartLedger: true,
        loggingStrategy: 'dailyNote',
        language: 'es',
        geminiApiKey: '',
        autoSave: true,
        fiscalYearStart: 2020,
        useManualRates: false,
        manualExchangeRates: {}
    },
    features: { ai: true, projections: true, cashFlowChart: true, categoryChart: true, netWorthChart: true, savingsChart: true },
    meta: { mode: 'production', version: 10 },
    baseCurrency: 'COP',
    exchangeRates: { 'USD': 4156 },
    exchangeRate: 4156,
    projectionParams: { years: 5, expectedReturn: 0.1, inflationRate: 0.04 },
    categoryRegistry: [{ id: 'food', name: 'Food', type: 'expense', isArchived: false }],
    accountRegistry: [{ id: 'cash', name: 'Cash', currency: 'COP', isArchived: false }],
    assetTypes: [],
    enabledModules: [],
    transactions: [{ id: 'tx_1', date: '2026-02-01', type: TransactionType.EXPENSE, sentiment: TransactionSentiment.NEED, amount: 100000, currency: 'COP', areaId: 'food', fromId: 'cash', area: 'food', from: 'cash', to: 'none', note: 'Test', tags: [], amountBase: 100000, exchangeRateSnapshot: 1 }],
    budgets: [],
    recurrents: [],
    assets: [],
    trades: [],
    loans: [],
    debts: [],
    reminders: [],
    snapshots: [],
    tradingTransfers: [],
    tags: [],
    custodialAccounts: [],
    business: { products: [], sales: [], clients: [] },
    scenarios: [],
    ...overrides
});

describe('BackupService', () => {
    let mockFs: ReturnType<typeof createMockFileSystem>;
    let backupService: BackupService;

    beforeEach(() => {
        mockFs = createMockFileSystem();
        backupService = new BackupService(
            mockFs.saveToFile,
            mockFs.loadFromFile,
            mockFs.listFiles
        );
        jest.useFakeTimers();
    });

    afterEach(() => {
        backupService.stopAutoBackup();
        jest.useRealTimers();
    });

    // ============================================
    // BACKUP CREATION TESTS
    // ============================================
    describe('createBackup()', () => {
        it('should create a backup successfully', async () => {
            const data = createMockData();
            const backupId = await backupService.createBackup(data, 'manual');

            expect(backupId).toMatch(/^backup_.*_manual$/);
            expect(mockFs.saveToFile).toHaveBeenCalled();
        });

        it('should include correct metadata in backup', async () => {
            const data = createMockData({ version: 8 });
            await backupService.createBackup(data, 'test');

            const savedContent = Array.from(mockFs.storage.values())[0];
            const backup = JSON.parse(savedContent);

            expect(backup.version).toBe(8);
            expect(backup.context).toBe('test');
            expect(backup.checksum).toBeDefined();
            expect(backup.timestamp).toBeDefined();
        });

        it('should generate unique IDs for multiple backups', async () => {
            const data = createMockData();

            const id1 = await backupService.createBackup(data, 'test1');

            // Avanzar tiempo para garantizar IDs únicos
            jest.advanceTimersByTime(1000);

            const id2 = await backupService.createBackup(data, 'test2');

            expect(id1).not.toBe(id2);
        });

        it('should calculate checksum correctly', async () => {
            const data = createMockData();
            await backupService.createBackup(data, 'test');

            const savedContent = Array.from(mockFs.storage.values())[0];
            const backup = JSON.parse(savedContent);

            expect(typeof backup.checksum).toBe('string');
            expect(backup.checksum.length).toBeGreaterThan(0);
        });
    });

    // ============================================
    // BACKUP RESTORE TESTS
    // ============================================
    describe('restore()', () => {
        it('should restore backup successfully', async () => {
            const originalData = createMockData({ version: 7 });
            const backupId = await backupService.createBackup(originalData, 'test');

            const restoredData = await backupService.restore(backupId);

            expect(restoredData.version).toBe(7);
            expect(restoredData.transactions).toEqual(originalData.transactions);
        });

        it('should throw error for non-existent backup', async () => {
            await expect(backupService.restore('non-existent-id'))
                .rejects.toThrow('Backup no encontrado');
        });

        it('should verify checksum on restore', async () => {
            const data = createMockData();
            const backupId = await backupService.createBackup(data, 'test');

            // Corromper el backup
            const key = Array.from(mockFs.storage.keys())[0];
            const backup = JSON.parse(mockFs.storage.get(key)!);
            backup.data.transactions = []; // Modificar datos
            mockFs.storage.set(key, JSON.stringify(backup));

            await expect(backupService.restore(backupId))
                .rejects.toThrow('checksum');
        });
    });

    // ============================================
    // LIST BACKUPS TESTS
    // ============================================
    describe('listBackups()', () => {
        it('should list all backups', async () => {
            const data = createMockData();

            await backupService.createBackup(data, 'backup1');
            jest.advanceTimersByTime(1000);
            await backupService.createBackup(data, 'backup2');
            jest.advanceTimersByTime(1000);
            await backupService.createBackup(data, 'backup3');

            const backups = await backupService.listBackups();

            expect(backups.length).toBe(3);
        });

        it('should sort backups by date (newest first)', async () => {
            const data = createMockData();

            await backupService.createBackup(data, 'old');
            jest.advanceTimersByTime(5000);
            await backupService.createBackup(data, 'new');

            const backups = await backupService.listBackups();

            expect(backups[0].context).toBe('new');
            expect(backups[1].context).toBe('old');
        });

        it('should return empty array when no backups exist', async () => {
            const backups = await backupService.listBackups();
            expect(backups).toEqual([]);
        });
    });

    // ============================================
    // AUTO-BACKUP TESTS
    // ============================================
    describe('Auto-backup', () => {
        it('should start auto-backup timer', () => {
            const getData = () => createMockData();

            backupService.startAutoBackup(getData);

            // Avanzar 30 minutos
            jest.advanceTimersByTime(30 * 60 * 1000);

            expect(mockFs.saveToFile).toHaveBeenCalled();
        });

        it('should create backup at configured interval', () => {
            const getData = () => createMockData();

            backupService.startAutoBackup(getData);

            // Primera ejecución a los 30 min
            jest.advanceTimersByTime(30 * 60 * 1000);
            expect(mockFs.saveToFile).toHaveBeenCalledTimes(1);

            // Segunda ejecución a los 60 min
            jest.advanceTimersByTime(30 * 60 * 1000);
            expect(mockFs.saveToFile).toHaveBeenCalledTimes(2);
        });

        it('should stop auto-backup timer', () => {
            const getData = () => createMockData();

            backupService.startAutoBackup(getData);
            backupService.stopAutoBackup();

            jest.advanceTimersByTime(60 * 60 * 1000);

            expect(mockFs.saveToFile).not.toHaveBeenCalled();
        });

        it('should use auto context for auto-backups', async () => {
            const getData = () => createMockData();

            backupService.startAutoBackup(getData);
            jest.advanceTimersByTime(30 * 60 * 1000);

            const backups = await backupService.listBackups();
            expect(backups[0].context).toBe('auto');
        });
    });

    // ============================================
    // PRE-OPERATION BACKUP TESTS
    // ============================================
    describe('createPreOperationBackup()', () => {
        it('should create backup before critical operation', async () => {
            const data = createMockData();

            const backupId = await backupService.createPreOperationBackup(data, 'migration');

            expect(backupId).toContain('pre-migration');
        });

        it('should create separate backups for different operations', async () => {
            const data = createMockData();

            const id1 = await backupService.createPreOperationBackup(data, 'import');
            jest.advanceTimersByTime(1000);
            const id2 = await backupService.createPreOperationBackup(data, 'delete');

            expect(id1).toContain('pre-import');
            expect(id2).toContain('pre-delete');
        });
    });

    // ============================================
    // DATA INTEGRITY TESTS
    // ============================================
    describe('Data Integrity', () => {
        it('should preserve all transaction data', async () => {
            const originalData = createMockData({
                transactions: [
                    { id: 'tx_1', date: '2026-01-01', type: 'income', amount: 5000000, currency: 'COP', from: 'Bank', to: 'none', area: 'Salary', note: 'January' },
                    { id: 'tx_2', date: '2026-01-02', type: 'expense', amount: 150000, currency: 'COP', from: 'Cash', to: 'none', area: 'Food', note: 'Groceries' }
                ]
            } as any);

            const backupId = await backupService.createBackup(originalData, 'test');
            const restored = await backupService.restore(backupId);

            expect(restored.transactions).toEqual(originalData.transactions);
            expect(restored.transactions.length).toBe(2);
        });

        it('should preserve decimal precision in amounts', async () => {
            const originalData = createMockData({
                transactions: [
                    { id: 'tx_1', date: '2026-01-01', type: 'expense', amount: 123.4567, currency: 'USD', from: 'Bank', to: 'none', area: 'Test', note: 'Decimal test' }
                ]
            } as any);

            const backupId = await backupService.createBackup(originalData, 'test');
            const restored = await backupService.restore(backupId);

            expect(restored.transactions[0].amount).toBe(123.4567);
        });

        it('should preserve exchange rates', async () => {
            const originalData = createMockData({
                exchangeRates: {
                    'USD': 4156.69,
                    'EUR': 4520.00,
                    'GBP': 5250.75
                }
            });

            const backupId = await backupService.createBackup(originalData, 'test');
            const restored = await backupService.restore(backupId);

            expect(restored.exchangeRates).toEqual(originalData.exchangeRates);
        });

        it('should preserve settings', async () => {
            const originalData = createMockData({
                settings: {
                    transactionsFolder: 'Custom/Path',
                    createNoteOnLog: false,
                    loggingStrategy: 'singleFile',
                    language: 'en',
                    geminiApiKey: 'test-key-123'
                }
            } as any);

            const backupId = await backupService.createBackup(originalData, 'test');
            const restored = await backupService.restore(backupId);

            expect(restored.settings).toEqual(originalData.settings);
        });
    });

    // ============================================
    // REAL-WORLD SCENARIOS
    // ============================================
    describe('Real-World Scenarios', () => {
        it('should handle large datasets (1000+ transactions)', async () => {
            const transactions = Array.from({ length: 1000 }, (_, i) => ({
                id: `tx_${i}`,
                date: '2026-01-01',
                type: i % 2 === 0 ? 'income' : 'expense',
                amount: Math.random() * 1000000,
                currency: 'COP',
                from: 'Bank',
                to: 'none',
                area: 'Test',
                note: `Transaction ${i}`
            }));

            const originalData = createMockData({ transactions } as any);

            const startTime = performance.now();
            const backupId = await backupService.createBackup(originalData, 'large-test');
            const createTime = performance.now() - startTime;

            const restoreStart = performance.now();
            const restored = await backupService.restore(backupId);
            const restoreTime = performance.now() - restoreStart;

            expect(restored.transactions.length).toBe(1000);
            expect(createTime).toBeLessThan(1000); // < 1 second
            expect(restoreTime).toBeLessThan(500); // < 0.5 seconds
        });

        it('should support disaster recovery workflow', async () => {
            // 1. Estado inicial
            const initialData = createMockData({ version: 8 });
            await backupService.createBackup(initialData, 'pre-disaster');

            // 2. Simular corrupción de datos
            const corruptedData = createMockData({
                transactions: [], // Datos perdidos
                version: 8
            });

            // 3. Backup antes de intentar reparar
            await backupService.createPreOperationBackup(corruptedData, 'repair');

            // 4. Listar backups disponibles
            const backups = await backupService.listBackups();
            const preDisasterBackup = backups.find(b => b.context === 'pre-disaster');

            // 5. Restaurar desde backup pre-disaster
            const recovered = await backupService.restore(preDisasterBackup!.id);

            expect(recovered.transactions.length).toBeGreaterThan(0);
        });
    });
});
