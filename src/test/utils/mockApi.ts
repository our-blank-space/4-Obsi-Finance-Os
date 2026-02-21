import { FinanceObsidianAPI } from '../../types/obsidian';

/**
 * Creates a complete mock FinanceObsidianAPI for testing.
 * All methods are jest.fn() mocks that can be configured in individual tests.
 */
export const createMockApi = (): FinanceObsidianAPI => ({
    // Core data persistence
    saveData: jest.fn().mockResolvedValue(undefined),
    forceSave: jest.fn().mockResolvedValue(undefined),
    scheduleSave: jest.fn(),

    // File operations
    openLink: jest.fn(),
    createNote: jest.fn().mockResolvedValue(undefined),
    appendToNote: jest.fn().mockResolvedValue(true),
    createFolder: jest.fn().mockResolvedValue(undefined),
    getBasePath: jest.fn().mockReturnValue('/test/path'),
    fileExists: jest.fn().mockReturnValue(false),
    searchNotes: jest.fn().mockReturnValue([]),

    // Ledger sync
    syncLedger: jest.fn().mockResolvedValue(undefined),
    syncReports: jest.fn().mockResolvedValue(undefined),
    updateMonthlyLedger: jest.fn().mockResolvedValue(undefined),

    // Backup methods
    createBackup: jest.fn().mockResolvedValue('backup-id-123'),
    listBackups: jest.fn().mockResolvedValue([]),
    restoreBackup: jest.fn().mockResolvedValue({} as any),

    // Generic storage
    writeJson: jest.fn().mockResolvedValue(undefined),
    readJson: jest.fn().mockResolvedValue(null),
    listJsonFiles: jest.fn().mockResolvedValue([]),
    getSummaries: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
});
