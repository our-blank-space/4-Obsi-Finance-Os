
// 1. Core & Configuration
export * as Core from './types/core';
export * as Settings from './types/settings';

// 2. Domain Models (Business Logic)
export * as Ledger from './types/ledger';
export * as Assets from './types/assets';
export * as Trading from './types/trading';
export * as Credit from './types/credit';
export * as Business from './types/business';
export * as Simulations from './types/simulations';
export * as Custodial from './types/custodial';

// 3. Infrastructure & Services
export * as Infra from './types/infra';
export * as Analytics from './types/analytics';
export * as Obsidian from './types/obsidian';
export { FinanceObsidianAPI } from './types/obsidian';

export * as UI from './types/ui';
export * as Filters from './types/filters';

// 4. Data Root (Plugin State)
export * as Data from './types/data';
export { PluginData } from './types/data';


// 5. Shared Utility Types (Optional re-exports for extreme convenience)
// export { Currency } from './types/core'; // Uncomment if strict namespacing is too painful

// --- LEGACY COMPATIBILITY EXPORTS ---
// These exports are necessary because strict namespacing broke the existing
// codebase which relies on import { X } from '../types'.
// We re-export the most commonly used types directly.

// Core
export {
    Currency,
    Frequency,
    Priority,
    FinanceModule,
    FinanceCategory,
    FinanceAccount,
    Language
} from './types/core';

// Ledger
export {
    Transaction,
    TransactionType,
    TransactionType as BudgetType,
    TransactionSentiment,
    Budget,
    RecurrentTransaction
} from './types/ledger';

// Trading
export {
    Trade,
    TradeSide,
    TradeStatus,
    TradeOutcome,
    TradingAccountType,
    TradingTransfer
} from './types/trading';

// Credit
export {
    InterestType,
    Loan,
    Debt,
    LoanPayment
} from './types/credit';

// Custodial
export {
    CustodialTransactionType,
    CustodialAccountStatus,
    CustodialAccount
} from './types/custodial';

// Assets
export {
    ProjectStatus,
    Asset,
    AssetTransaction,
    AssetType
} from './types/assets';

// Infra
export {
    WeeklySnapshot,
    Reminder,
    GlobalSummary
} from './types/infra';

export {
    PluginSettings
} from './types/settings';

export {
    FeatureFlags,
    StateMeta
} from './types/core';

// Business
export {
    Product,
    Sale,
    SaleItem,
    Project,
    ProjectExpense
} from './types/business';

// Simulations
export {
    Scenario,
    ScenarioType
} from './types/simulations';

