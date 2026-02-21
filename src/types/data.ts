
import { PluginSettings } from './settings';
import { Transaction, Budget, RecurrentTransaction } from './ledger';
import { AssetProject } from './assets';
import { Trade, TradingTransfer } from './trading';
import { Loan, Debt } from './credit';
import { Currency, StateMeta, FeatureFlags, FinanceCategory, FinanceAccount, FinanceModule } from './core';
// Importamos los nuevos módulos segregados
import { WeeklySnapshot, Reminder } from './infra';
import { CustodialAccount } from './custodial';
import { BusinessData } from './business';
import { Scenario, ProjectionParams } from './simulations';

export interface PluginData {
    version: number;
    settings: PluginSettings;
    features: FeatureFlags;
    meta: StateMeta;

    // Financial Context
    baseCurrency: Currency;
    exchangeRates: Record<string, number>;

    /** 
     * @deprecated Legacy single-currency support. 
     * Use `exchangeRates['USD']` instead. Kept for V9 migration compatibility.
     */
    exchangeRate: number;

    projectionParams: ProjectionParams;

    // Registries (V3)
    categoryRegistry: FinanceCategory[];
    accountRegistry: FinanceAccount[];
    assetTypes: string[];
    enabledModules: FinanceModule[];

    // Data Collections
    transactions: Transaction[];
    budgets: Budget[];
    recurrents: RecurrentTransaction[];
    assets: AssetProject[];
    trades: Trade[];
    loans: Loan[];
    debts: Debt[];

    // Collections
    snapshots: WeeklySnapshot[];
    reminders: Reminder[];
    tradingTransfers: TradingTransfer[];
    custodialAccounts: CustodialAccount[];
    business: BusinessData;
    scenarios: Scenario[];

    tags: string[];
}
