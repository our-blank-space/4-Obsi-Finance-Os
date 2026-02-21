// src/App.tsx
import React, { useState, useEffect, Suspense } from 'react';
import {
    BookOpen, Wallet, Activity, Menu, X, Save,
    PieChart, Repeat, CandlestickChart, HandCoins, Receipt,
    Box, ShoppingBag, Calculator, Briefcase, Bell,
    ClipboardCheck, TrendingUp, Users2, Book, Settings as SettingsIcon, RefreshCw, History
} from 'lucide-react';
import { Notice } from 'obsidian';

// Namespaces (Arquitectura V3)
import { Data, Core, UI, Obsidian } from './types';

// Context & Hooks
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { useTranslation } from './hooks/useTranslation';
import { useHotkeys } from './hooks/useHotkeys';
import { useAutoRefreshRates } from './hooks/useAutoRefreshRates'; // ✅ NUEVO HOOK

// UI Core
import { NavItem } from './components/ui/NavItem';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
// Componentes críticos se mantienen estáticos para LCP (Largest Contentful Paint)
import Dashboard from './components/Dashboard';

// --- LAZY LOAD MODULES (Optimización de Rendimiento) ---
// Solo cargamos el JS de estos módulos cuando el usuario hace click en ellos
const Balances = React.lazy(() => import('./components/Balances'));
const DailyTransactions = React.lazy(() => import('./components/DailyTransactions'));
const Budgets = React.lazy(() => import('./components/Budgets'));
const RecurrentTransactions = React.lazy(() => import('./components/RecurrentTransactions'));
const TradingJournal = React.lazy(() => import('./components/TradingJournal'));
const Lending = React.lazy(() => import('./components/Lending'));
const Debts = React.lazy(() => import('./components/Debts'));
const AssetProjects = React.lazy(() => import('./components/AssetProjects'));
// Manejo de exportaciones nombradas para componentes que no son default
const BusinessManager = React.lazy(() => import('./components/BusinessManager').then(m => ({ default: m.BusinessManager })));
const ScenarioSimulator = React.lazy(() => import('./components/ScenarioSimulator').then(m => ({ default: m.ScenarioSimulator })));
const WorkQuotation = React.lazy(() => import('./components/WorkQuotation').then(m => ({ default: m.WorkQuotation })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));

const Reminders = React.lazy(() => import('./components/Reminders'));
const MonthlyReview = React.lazy(() => import('./components/MonthlyReview'));
const AnnualReport = React.lazy(() => import('./components/AnnualReport'));
const CustodialAccountManager = React.lazy(() => import('./components/CustodialAccountManager'));
const Guide = React.lazy(() => import('./components/Guide'));
const DealCalculator = React.lazy(() => import('./components/DealCalculator'));
const WeeklySnapshots = React.lazy(() => import('./components/WeeklySnapshots'));

// Componente de Carga
const LoadingSpinner = () => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center h-full text-[var(--text-muted)] animate-pulse">
            <div className="flex flex-col items-center gap-2">
                <Activity className="animate-spin" size={32} />
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">{t('common.loading_module')}</span>
            </div>
        </div>
    );
};

// --- Core Logic ---
import { TransactionFactory } from './core/TransactionFactory';

const MainLayout: React.FC = () => {
    const { state, dispatch, saveDataNow } = useFinance();
    const { t } = useTranslation();

    // ✅ Hook de lógica de negocio extraída (Limpio y silencioso)
    useAutoRefreshRates();

    const {
        currentView, enabledModules, isPrivacyMode,
        reminders: remindersList, meta, transactions, assets, trades, loans, debts,
        recurrents, budgets, tradingTransfers, accountRegistry, categoryRegistry, snapshots,
        baseCurrency, exchangeRate, settings, features
    } = state;

    const isDemo = meta?.mode === 'demo';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'none' | 'expense' | 'income' | 'transfer'>('none');

    // Handlers de UI
    const setView = (view: UI.View) => {
        dispatch({ type: 'SET_VIEW', payload: view });
        setIsMobileMenuOpen(false); // Cierra el menú al navegar
    };

    const togglePrivacy = () => {
        dispatch({ type: 'TOGGLE_PRIVACY' });
    };

    // Atajos de teclado globales
    useHotkeys({
        newItem: () => setActiveModal('expense'),
        save: () => saveDataNow()
    });

    // Listener de Comandos de Obsidian
    useEffect(() => {
        const handleCommand = (e: Event) => {
            const customEvent = e as CustomEvent;
            const action = customEvent.detail;
            if (action === 'open-expense') setActiveModal('expense');
            if (action === 'open-income') setActiveModal('income');
            if (action === 'open-transfer') setActiveModal('transfer');
        };
        window.addEventListener('finance-os-command', handleCommand);
        return () => window.removeEventListener('finance-os-command', handleCommand);
    }, []);

    return (
        <div className="flex h-full bg-[var(--background-primary)] text-[var(--text-normal)] overflow-hidden w-full absolute inset-0 font-sans">

            {/* SIDEBAR: Slide-over en mobile, estático en desktop */}
            <nav className={`
                fixed inset-y-0 left-0 w-72 
                bg-[var(--background-secondary)] border-r border-[var(--background-modifier-border)] 
                z-[60] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Header Sidebar con botón de cerrar para mobile */}
                    <div className="flex items-center justify-between p-6 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[var(--interactive-accent)] rounded-xl flex items-center justify-center text-white shadow-lg">
                                <BookOpen size={16} />
                            </div>
                            <h1 className="font-black text-base italic tracking-tighter">FinanceOS</h1>
                        </div>
                        <button className="lg:hidden p-2 text-[var(--text-muted)]" onClick={() => setIsMobileMenuOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Menú de Navegación con Scroll propio */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
                        <NavItem active={currentView === 'dashboard'} onClick={() => setView('dashboard')} icon={<Activity size={18} />} label={t('nav.dashboard')} />
                        <NavItem active={currentView === 'balances'} onClick={() => setView('balances')} icon={<Wallet size={18} />} label={t('nav.balances')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.FX)} active={currentView === 'fx'} onClick={() => setView('fx')} icon={<RefreshCw size={18} />} label={t('nav.fx')} />
                        <NavItem active={currentView === 'logs'} onClick={() => setView('logs')} icon={<Box size={18} />} label={t('nav.logs')} /> {/* Changed Icon to Box temporarily if FileText is missing, or imported correctly */}

                        <div className="my-4 border-t border-[var(--background-modifier-border)] opacity-30 mx-2" />

                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.BUDGETS)} active={currentView === 'budgets'} onClick={() => setView('budgets')} icon={<PieChart size={18} />} label={t('nav.budgets')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.RECURRENT)} active={currentView === 'recurrent'} onClick={() => setView('recurrent')} icon={<Repeat size={18} />} label={t('nav.recurrent')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.TRADING)} active={currentView === 'trading'} onClick={() => setView('trading')} icon={<CandlestickChart size={18} />} label={t('nav.trading')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.LENDING)} active={currentView === 'lending'} onClick={() => setView('lending')} icon={<HandCoins size={18} />} label={t('nav.lending')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.DEBTS)} active={currentView === 'debts'} onClick={() => setView('debts')} icon={<Receipt size={18} />} label={t('nav.debts')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.ASSETS)} active={currentView === 'assets'} onClick={() => setView('assets')} icon={<Box size={18} />} label={t('nav.assets')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.BUSINESS)} active={currentView === 'business'} onClick={() => setView('business')} icon={<ShoppingBag size={18} />} label={t('nav.business')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.SIMULATIONS)} active={currentView === 'simulations'} onClick={() => setView('simulations')} icon={<Calculator size={18} />} label={t('nav.simulations')} />

                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.QUOTATION)} active={currentView === 'quotation'} onClick={() => setView('quotation')} icon={<Briefcase size={18} />} label={t('nav.quotation')} />

                        <NavItem
                            hidden={!enabledModules.includes(Core.FinanceModule.REMINDERS)}
                            active={currentView === 'reminders'}
                            onClick={() => setView('reminders')}
                            icon={<Bell size={18} />}
                            label={t('nav.reminders')}
                            badge={remindersList.filter(r => !r.isCompleted).length}
                        />

                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.REVIEWS)} active={currentView === 'reviews'} onClick={() => setView('reviews')} icon={<History size={18} />} label={t('nav.reviews')} />

                        <NavItem active={currentView === 'monthly_review'} onClick={() => setView('monthly_review')} icon={<ClipboardCheck size={18} />} label={t('nav.monthly_review')} />
                        <NavItem active={currentView === 'annual_report'} onClick={() => setView('annual_report')} icon={<TrendingUp size={18} />} label={t('nav.annual_report')} />
                        <NavItem hidden={!enabledModules.includes(Core.FinanceModule.CUSTODIAL)} active={currentView === 'custodial'} onClick={() => setView('custodial')} icon={<Users2 size={18} />} label={t('nav.custodial')} />
                    </div>

                    <div className="p-3 border-t border-[var(--background-modifier-border)] bg-[var(--background-secondary)]/50">
                        {/* MANUAL SAVE BUTTON */}
                        <button
                            onClick={async () => {
                                await saveDataNow();
                                new Notice(t('msg.manual_save'));
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-3 rounded-xl bg-[var(--interactive-accent)] text-white hover:opacity-90 transition-opacity font-bold text-xs uppercase tracking-widest shadow-lg shadow-[var(--interactive-accent)]/20"
                        >
                            <Save size={14} /> {t('btn.save')}
                        </button>

                        <NavItem active={currentView === 'guide'} onClick={() => setView('guide')} icon={<Book size={18} />} label={t('nav.guide')} />
                        <NavItem active={currentView === 'settings'} onClick={() => setView('settings')} icon={<SettingsIcon size={18} />} label={t('nav.settings')} />
                    </div>
                </div>
            </nav>

            {/* OVERLAY PARA MOBILE */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--background-primary)] relative h-full overflow-hidden">
                {/* Header Superior Fijo */}
                <header className="h-14 sm:h-16 border-b border-[var(--background-modifier-border)] flex items-center justify-between px-4 sm:px-8 bg-[var(--background-primary)]/80 backdrop-blur-xl sticky top-0 z-40 shrink-0">
                    <button className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-normal)] transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu size={20} />
                    </button>

                    {/* Indicador de Modo Demo - Compacto */}
                    {isDemo && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mx-auto lg:mx-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{t('lbl.simulation_mode')}</span>
                        </div>
                    )}
                </header>

                {/* Área de Scroll Principal con Suspense */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar">
                    <div className="max-w-6xl mx-auto h-full">
                        <Suspense fallback={<LoadingSpinner />}>
                            {currentView === 'dashboard' && <Dashboard />}
                            {currentView === 'balances' && <Balances />}
                            {currentView === 'fx' && (
                                <DealCalculator
                                    transactions={transactions} assets={assets} trades={trades} loans={loans} debts={debts}
                                    baseCurrency={baseCurrency} systemExchangeRate={settings.useManualRates ? settings.manualExchangeRates['USD'] : exchangeRate} aiEnabled={features.ai} apiKey={settings.geminiApiKey}
                                />
                            )}
                            {currentView === 'logs' && (
                                <div className="h-full">
                                    <DailyTransactions
                                        accounts={accountRegistry}
                                        areas={categoryRegistry}
                                        externalOpenModal={activeModal}
                                        onCloseExternal={() => setActiveModal('none')}
                                        className="h-full"
                                    />
                                </div>
                            )}

                            {/* --- Lazy Loaded Modules --- */}
                            {currentView === 'trading' && <TradingJournal trades={trades} transfers={tradingTransfers} onUpdateTrades={(newT) => dispatch({ type: 'SET_TRADES', payload: newT })} onUpdateTransfers={(newTr) => dispatch({ type: 'SET_TRANSFERS', payload: newTr })} />}
                            {currentView === 'recurrent' && (
                                <RecurrentTransactions
                                    recurrents={recurrents}
                                    onUpdate={(newRecurrents) => dispatch({ type: 'SET_RECURRENTS', payload: newRecurrents })}
                                    onExecute={(recurrentItem, amountOverride) => {
                                        const { transaction, nextDate } = TransactionFactory.fromRecurrent(recurrentItem);
                                        if (amountOverride) transaction.amount = amountOverride;
                                        dispatch({
                                            type: 'EXECUTE_RECURRENT',
                                            payload: { transaction, recurrentId: recurrentItem.id, nextDate, amountOverride }
                                        });
                                    }}
                                    accounts={accountRegistry}
                                    areas={categoryRegistry}
                                />
                            )}
                            {currentView === 'lending' && <Lending loans={loans} onUpdate={(newL) => dispatch({ type: 'SET_LOANS', payload: newL })} />}
                            {currentView === 'debts' && <Debts debts={debts} onUpdate={(newD) => dispatch({ type: 'SET_DEBTS', payload: newD })} />}
                            {currentView === 'assets' && <AssetProjects assets={assets} onUpdate={(newA) => dispatch({ type: 'SET_ASSETS', payload: newA })} />}
                            {currentView === 'quotation' && <WorkQuotation />}
                            {currentView === 'reminders' && (
                                <Reminders
                                    reminders={remindersList}
                                    onAdd={(r) => dispatch({ type: 'SET_REMINDERS', payload: [...remindersList, r] })}
                                    onToggle={(id) => dispatch({ type: 'SET_REMINDERS', payload: remindersList.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r) })}
                                    onDelete={(id) => dispatch({ type: 'SET_REMINDERS', payload: remindersList.filter(r => r.id !== id) })}
                                />
                            )}
                            {currentView === 'budgets' && <Budgets />}
                            {currentView === 'reviews' && (
                                <WeeklySnapshots
                                    snapshots={snapshots}
                                    accounts={accountRegistry.map(a => a.name)}
                                    onAdd={(s) => dispatch({ type: 'ADD_SNAPSHOT', payload: s })}
                                    onUpdate={(s) => dispatch({ type: 'UPDATE_SNAPSHOT', payload: s })}
                                    onDelete={(id) => dispatch({ type: 'DELETE_SNAPSHOT', payload: id })}
                                />
                            )}
                            {currentView === 'monthly_review' && <MonthlyReview transactions={transactions} assets={assets} exchangeRate={exchangeRate} baseCurrency={baseCurrency} privacyMode={isPrivacyMode} />}
                            {currentView === 'annual_report' && <AnnualReport transactions={transactions} snapshots={snapshots} baseCurrency={baseCurrency} exchangeRate={exchangeRate} />}
                            {currentView === 'guide' && <Guide />}
                            {currentView === 'settings' && <SettingsView />}
                            {currentView === 'custodial' && <CustodialAccountManager />}
                            {currentView === 'business' && <BusinessManager />}
                            {currentView === 'simulations' && <ScenarioSimulator />}
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- APP ENTRY POINT ---
interface AppProps {
    initialData: Data.PluginData;
    api: Obsidian.FinanceObsidianAPI;
}

const App: React.FC<AppProps> = ({ initialData, api }) => {
    const handleExport = async () => {
        try {
            await api.createBackup('crash-recovery');
            new Notice('✅ Backup de emergencia guardado.');
        } catch (e) {
            new Notice('❌ Error al guardar backup: ' + e);
            console.error(e);
        }
    };

    return (
        <FinanceProvider initialData={initialData} api={api}>
            <ErrorBoundary onExport={handleExport}>
                <MainLayout />
            </ErrorBoundary>
        </FinanceProvider>
    );
};

export default App;