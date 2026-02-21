// src/components/SettingsView.tsx
import React, { useState, useEffect } from 'react';
import {
  Settings, Save, Download, Upload, Globe, Bot,
  FolderOpen, FileText, Wallet, Check,
  ToggleLeft, ToggleRight, Database, Zap, Trash2,
  Box, RefreshCw, Shield, Clock, AlertTriangle,
  GitMerge, AlertOctagon, FileSpreadsheet, RotateCcw, FileUp
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Currency, PluginSettings, FeatureFlags } from '../types';
import { BackupInfo } from '../types/obsidian';
import { CSVImporter } from './CSVImporter';
import DemoSimulator from './DemoSimulator';
import { useTransactionsController } from '../application/useTransactionsController';
import { TaxonomyManager } from './settings/TaxonomyManager';
import { SelectStyled } from './ui/SelectStyled';
import { useTranslation } from '../hooks/useTranslation';
import { useTaxonomy } from '../hooks/useTaxonomy';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Notice } from 'obsidian';
import { DEFAULT_DATA } from '../data/defaults'; // Necesario para reset settings

const DEFAULT_ASSET_TYPES = ['Real Estate', 'Tech', 'Livestock', 'Stock Market', 'Crypto', 'Private Equity'];

export const SettingsView: React.FC = () => {
  const { state, dispatch, saveDataNow, api } = useFinance();
  const { t } = useTranslation();
  const { settings, baseCurrency, accountRegistry, categoryRegistry, features, meta } = state;
  const accounts = accountRegistry.map(a => a.name);
  const areas = categoryRegistry.map(c => c.name);
  const isDemo = meta?.mode === 'demo';

  // Hooks
  const { importCSV } = useTransactionsController();
  const { addEntity, deleteEntity } = useTaxonomy();

  // UI States
  const [isSaved, setIsSaved] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'data'>('general');

  // Backup States
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  // Dialog States
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'reset_data' | 'reset_settings' | 'restore_backup' | 'demo_exit' | null;
    payload?: any;
    title: string;
    desc: string;
  }>({ isOpen: false, type: null, title: '', desc: '' });

  // --- EFFECTS ---
  useEffect(() => {
    if (activeTab === 'data') loadBackups();
  }, [activeTab]);

  // --- LOGIC: BACKUPS ---
  const loadBackups = async () => {
    if (!api?.listBackups) return;
    setIsLoadingBackups(true);
    try {
      const list = await api.listBackups();
      setBackups(list);
    } catch (error) {
      new Notice(t('msg.error_backups'));
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!api?.createBackup) return;
    setIsCreatingBackup(true);
    try {
      await api.createBackup('manual-user');
      await loadBackups();
      new Notice(t('msg.backup_created'));
    } catch (error) {
      new Notice(t('msg.error_creating_backup'));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!api?.restoreBackup || !confirmAction.payload) return;
    const backupId = confirmAction.payload;

    setIsRestoring(backupId);
    try {
      const restoredData = await api.restoreBackup(backupId);
      dispatch({ type: 'LOAD_DATA', payload: restoredData });
      new Notice(t('msg.restore_success'));
    } catch (error) {
      new Notice(t('msg.restore_fail'));
      console.error(error);
    } finally {
      setIsRestoring(null);
      closeConfirm();
    }
  };

  // --- LOGIC: FILE IMPORT/EXPORT ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const node = document.createElement('a');
    node.setAttribute("href", dataStr);
    node.setAttribute("download", `finance_os_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(node);
    node.click();
    node.remove();
    new Notice(t('msg.json_exported'));
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      reader.readAsText(event.target.files[0], "UTF-8");
      reader.onload = (e) => {
        if (e.target?.result) {
          try {
            const data = JSON.parse(e.target.result as string);
            // Validar estructura básica
            if (!data.version) throw new Error("Archivo inválido");

            dispatch({ type: 'LOAD_DATA', payload: data });
            saveDataNow();
            new Notice(t('msg.import_success'));
          } catch (err) {
            new Notice(t('msg.invalid_file'));
          }
        }
      };
    }
  };

  // --- LOGIC: RESETS ---
  const executeFactoryReset = () => {
    // Mantiene solo settings, borra datos
    const currentSettings = { ...state.settings };
    dispatch({ type: 'RESET_STATE' });
    // Restauramos settings para no perder API key ni idioma
    dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: currentSettings } });
    saveDataNow();
    new Notice(t('msg.factory_reset_success'));
    closeConfirm();
  };

  const executeResetSettings = () => {
    // Mantiene datos, resetea settings a default
    dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: DEFAULT_DATA.settings } });
    saveDataNow();
    new Notice(t('msg.config_reset_success'));
    closeConfirm();
  };

  // --- LOGIC: SETTINGS UPDATES ---
  const triggerAutoSave = () => {
    saveDataNow();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const updateSettings = (partialSettings: Partial<PluginSettings>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        settings: { ...settings, ...partialSettings },
        ...(partialSettings.language ? { language: partialSettings.language } : {})
      }
    });
    triggerAutoSave();
  };

  // --- LOGIC: RATES ---
  const fetchExchangeRates = async () => {
    setIsFetchingRates(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error("Network error");

      const data = await response.json();
      const usdToBase = data.rates[baseCurrency] || 1;

      const newRates: Record<string, number> = {
        'USD': usdToBase,
        'EUR': Math.round((usdToBase / (data.rates.EUR || 0.92)) * 100) / 100,
        'GBP': Math.round((usdToBase / (data.rates.GBP || 0.79)) * 100) / 100,
        'MXN': Math.round((usdToBase / (data.rates.MXN || 17.5)) * 100) / 100,
        'BRL': Math.round((usdToBase / (data.rates.BRL || 5.0)) * 100) / 100,
      };

      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          exchangeRates: { ...state.exchangeRates, ...newRates },
          exchangeRate: newRates.USD,
          lastRateUpdate: Date.now()
        }
      });
      new Notice(t('msg.rates_updated'));
      triggerAutoSave();
    } catch (e) {
      new Notice(t('msg.error_rates'));
    } finally {
      setIsFetchingRates(false);
    }
  };

  // --- HELPERS ---
  const closeConfirm = () => setConfirmAction({ ...confirmAction, isOpen: false });

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-5xl mx-auto font-sans">

      {/* HEADER FIJO */}
      <div className="flex items-center justify-between sticky top-0 bg-[var(--background-primary)]/95 backdrop-blur z-20 py-4 border-b border-[var(--background-modifier-border)]">
        <div>
          <h2 className="text-2xl font-black italic flex items-center gap-3 text-[var(--text-normal)]">
            <Settings className="text-[var(--interactive-accent)]" /> {t('settings.title')}
          </h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isSaved ? 'bg-[var(--interactive-accent)]/10 text-[var(--interactive-accent)]' : 'text-transparent'}`}>
          <Check size={14} /> {t('state.saved')}
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)] w-full sm:w-fit">
        <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Globe size={14} />} label={t('settings.tab.general')} />
        <TabButton active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} icon={<Box size={14} />} label={t('settings.tab.modules')} />
        <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={14} />} label={t('settings.tab.data')} />
      </div>

      {/* === TAB 1: GENERAL & LISTAS === */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-left-4">
          {/* Región y Moneda */}
          <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
              <Globe size={14} /> {t('settings.regional')}
            </h3>

            <div className="flex bg-[var(--background-primary)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
              <button onClick={() => updateSettings({ language: 'es' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.language === 'es' ? 'bg-[var(--interactive-accent)] text-[var(--text-on-accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--background-secondary)]'}`}>Español</button>
              <button onClick={() => updateSettings({ language: 'en' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.language === 'en' ? 'bg-[var(--interactive-accent)] text-[var(--text-on-accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--background-secondary)]'}`}>English</button>
            </div>

            <div className="space-y-2 mb-4">
              <SelectStyled
                label={t('settings.base_currency')}
                value={baseCurrency}
                onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { baseCurrency: v as Currency } })}
                options={[
                  { value: 'COP', label: 'COP - Peso Colombiano' },
                  { value: 'USD', label: 'USD - Dólar Estadounidense' },
                  { value: 'EUR', label: 'EUR - Euro' }
                ]}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('settings.exchange_rates')}</label>
                <div className="flex gap-2">
                  <button onClick={fetchExchangeRates} disabled={isFetchingRates || settings.useManualRates} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--interactive-accent)]/10 text-[var(--interactive-accent)] rounded-lg text-xs font-bold hover:bg-[var(--interactive-accent)]/20 transition-all disabled:opacity-50">
                    <RefreshCw size={12} className={isFetchingRates ? 'animate-spin' : ''} /> {isFetchingRates ? '...' : t('settings.update_rates')}
                  </button>
                </div>
              </div>

              {/* Resilience Toggle */}
              <div
                className={`p-3 rounded-xl border transition-all mb-4 ${settings.useManualRates ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[var(--background-primary)] border-[var(--background-modifier-border)]'}`}
                onClick={() => updateSettings({ useManualRates: !settings.useManualRates })}
              >
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={settings.useManualRates ? 'text-amber-500' : 'text-[var(--text-muted)]'} />
                    <span className="text-xs font-bold uppercase tracking-tight">{t('settings.resilience_mode')}</span>
                  </div>
                  <div className={settings.useManualRates ? 'text-amber-500' : 'text-[var(--text-muted)]'}>
                    {settings.useManualRates ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </div>
                </div>
                {settings.useManualRates && (
                  <p className="text-[9px] text-amber-600/70 mt-1 font-medium italic">{t('settings.resilience_desc')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.keys(DEFAULT_DATA.exchangeRates).map(curr => (
                  <div key={curr} className={`bg-[var(--background-primary)] border rounded-xl p-2 px-3 flex flex-col justify-between transition-all ${settings.useManualRates ? 'border-amber-500/30' : 'border-[var(--background-modifier-border)]'}`}>
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{curr}</span>
                    {settings.useManualRates ? (
                      <input
                        type="number"
                        step="0.01"
                        value={settings.manualExchangeRates?.[curr] ?? state.exchangeRates?.[curr] ?? 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const newManual = { ...settings.manualExchangeRates, [curr]: val };
                          updateSettings({ manualExchangeRates: newManual });
                        }}
                        className="bg-transparent text-sm font-mono font-bold outline-none border-b border-amber-500/20 focus:border-amber-500 w-full"
                      />
                    ) : (
                      <span className="text-sm font-mono font-bold">{state.exchangeRates?.[curr] || 0}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Taxonomía */}
          <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
              <Wallet size={14} /> {t('settings.lists')}
            </h3>
            <TaxonomyManager title="Cuentas" items={accounts} type="account" onAdd={(v) => { addEntity('account', v); triggerAutoSave(); }} />

            <div className="p-3 bg-[var(--background-secondary)]/50 border border-[var(--interactive-accent)]/20 rounded-xl flex gap-3 text-xs text-[var(--interactive-accent)]">
              <Shield size={16} className="shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-normal)]">{t('settings.tip.liquidity_title')}</strong> <span className="text-[var(--text-muted)]">{t('settings.tip.liquidity_desc')}</span>
              </p>
            </div>
            <TaxonomyManager title="Categorías" items={areas} type="area" onAdd={(v) => { addEntity('area', v); triggerAutoSave(); }} />

            <div className="p-3 bg-[var(--background-secondary)]/50 border border-[var(--interactive-accent)]/20 rounded-xl flex gap-3 text-xs text-[var(--interactive-accent)]">
              <GitMerge size={16} className="shrink-0 mt-0.5" />
              <p><strong className="text-[var(--text-normal)]">{t('settings.taxonomy.tip')}</strong></p>
            </div>
          </section>
        </div>
      )}

      {/* === TAB 2: MÓDULOS E INTEGRACIONES === */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
          {/* Global Modules */}
          <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
              <Box size={14} /> {t('settings.global_modules')}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'recurrent', label: t('nav.recurrent') },
                { id: 'budgets', label: t('nav.budgets') },
                { id: 'trading', label: t('nav.trading') },
                { id: 'assets', label: t('nav.assets') },
                { id: 'business', label: t('nav.business') },
                { id: 'simulations', label: t('nav.simulations') },
                { id: 'lending', label: t('nav.lending') },
                { id: 'debts', label: t('nav.debts') },
                { id: 'reviews', label: t('nav.reviews') },
                { id: 'quotation', label: t('nav.quotation') },
                { id: 'custodial', label: t('nav.custodial') },
                { id: 'fx', label: t('nav.fx') },
              ].map(mod => (
                <Toggle key={mod.id} label={mod.label} desc={t('settings.module_main')} active={state.enabledModules.includes(mod.id as any)}
                  onToggle={() => {
                    const newList = state.enabledModules.includes(mod.id as any)
                      ? state.enabledModules.filter((m: any) => m !== mod.id)
                      : [...state.enabledModules, mod.id as any];
                    dispatch({ type: 'UPDATE_SETTINGS', payload: { enabledModules: newList } });
                    triggerAutoSave();
                  }}
                />
              ))}
            </div>
          </section>

          {/* Obsidian & AI */}
          <div className="space-y-6">
            <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
              <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
                <FolderOpen size={14} /> {t('settings.integration')}
              </h3>
              <Toggle
                label={t('settings.create_note')}
                desc={t('settings.create_note_desc')}
                active={settings.createNoteOnLog}
                onToggle={() => updateSettings({ createNoteOnLog: !settings.createNoteOnLog })}
              />

              <Toggle
                label={t('settings.smart_ledger')}
                desc={t('settings.smart_ledger_desc')}
                active={settings.smartLedger ?? true}
                onToggle={() => updateSettings({ smartLedger: !settings.smartLedger })}
              />

              {(settings.createNoteOnLog || settings.smartLedger) && (
                <div className="p-4 bg-[var(--background-primary)] rounded-xl border border-[var(--background-modifier-border)]">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-2">{t('settings.tx_folder')}</label>
                  <input
                    type="text"
                    value={settings.transactionsFolder}
                    onChange={(e) => updateSettings({ transactionsFolder: e.target.value })}
                    className="w-full bg-transparent border-b border-[var(--background-modifier-border)] text-sm pb-1 outline-none focus:border-[var(--interactive-accent)]"
                  />
                </div>
              )}
            </section>

            <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
              <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
                <Bot size={14} /> {t('settings.section.ai')}
              </h3>
              <Toggle label={t('settings.ai_enable')} desc={t('settings.ai_desc')} active={features.ai} onToggle={() => dispatch({ type: 'UPDATE_FEATURE_FLAGS', payload: { ai: !features.ai } })} />
              {features.ai && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t('settings.gemini_key')}</label>
                  <input type="password" value={settings.geminiApiKey || ''} onChange={(e) => updateSettings({ geminiApiKey: e.target.value })} className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] p-3 rounded-xl text-sm outline-none font-mono" placeholder="sk-..." />
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* === TAB 3: DATOS, BACKUP & DANGER ZONE === */}
      {activeTab === 'data' && (
        <div className="space-y-8 animate-in fade-in">

          {/* 1. SIMULADOR */}
          {!isDemo ? (
            <div className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl">
              <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest mb-4">
                <Database size={14} /> {t('settings.test_env')}
              </h3>
              <DemoSimulator onLoadData={(data) => dispatch({ type: 'LOAD_DEMO_DATA', payload: data })} />
            </div>
          ) : (
            <div className="bg-[var(--background-secondary)]/50 border border-[var(--interactive-accent)]/30 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--interactive-accent)]/20 rounded-full flex items-center justify-center text-[var(--interactive-accent)]"><Zap size={20} /></div>
                <div>
                  <h3 className="font-black text-[var(--interactive-accent)]">{t('settings.sim_active')}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('settings.sim_warning')}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction({ isOpen: true, type: 'demo_exit', title: t('settings.exit_sim'), desc: t('settings.sim_warning') })}
                className="px-4 py-2 bg-[var(--background-primary)] border border-[var(--interactive-accent)]/20 hover:border-[var(--interactive-accent)] hover:bg-[var(--interactive-accent)]/10 text-[var(--text-normal)] rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
              >
                {t('btn.exit')}
              </button>
            </div>
          )}

          {/* 2. PORTABILIDAD (IMPORT/EXPORT) */}
          <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
              <FileSpreadsheet size={14} /> {t('settings.portability')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Exportar JSON */}
              <button onClick={handleExportJSON} className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all group">
                <Download size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                <span className="text-xs font-bold">{t('settings.export_json')}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{t('settings.backup_full')}</span>
              </button>

              {/* Restaurar JSON */}
              <label className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all cursor-pointer group">
                <Upload size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                <span className="text-xs font-bold">{t('settings.restore_json')}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{t('settings.from_file')}</span>
                <input type="file" onChange={handleImportJSON} className="hidden" accept=".json" />
              </label>

              {/* Importar CSV */}
              <button onClick={() => setShowImporter(true)} className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all group">
                <FileUp size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                <span className="text-xs font-bold">{t('settings.import_csv')}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{t('settings.banks_excel')}</span>
              </button>
            </div>
          </section>

          {/* 3. SNAPSHOTS DEL SISTEMA (Backups internos) */}
          <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
                <Shield size={14} /> {t('settings.snapshots_title')}
              </h3>
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="text-xs bg-[var(--interactive-accent)] text-[var(--text-on-accent)] px-3 py-1.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isCreatingBackup ? <RefreshCw size={12} className="animate-spin" /> : <FolderOpen size={12} />}
                {t('settings.create_snapshot')}
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs border-2 border-dashed border-[var(--background-modifier-border)] rounded-xl">
                {t('settings.no_snapshots')}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {backups.map(backup => (
                  <div key={backup.id} className="flex items-center justify-between p-3 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${backup.context === 'auto' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {backup.context === 'auto' ? <Clock size={14} /> : <Save size={14} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{new Date(backup.timestamp).toLocaleString()}</div>
                        <div className="text-[9px] text-[var(--text-muted)] uppercase">{backup.context} • v{backup.version}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmAction({
                        isOpen: true,
                        type: 'restore_backup',
                        payload: backup.id,
                        title: t('settings.restore_confirm'),
                        desc: t('settings.restore_desc').replace('{date}', new Date(backup.timestamp).toLocaleString())
                      })}
                      disabled={isRestoring === backup.id}
                      className="px-3 py-1.5 bg-[var(--background-secondary)] hover:bg-[var(--interactive-accent)] hover:text-white text-[var(--text-muted)] text-[10px] font-black uppercase rounded-lg transition-all"
                    >
                      {isRestoring === backup.id ? '...' : t('btn.confirm')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. DANGER ZONE */}
          <section className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-black uppercase flex items-center gap-2 text-rose-500 tracking-widest">
              <AlertTriangle size={14} /> {t('settings.danger_zone')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-rose-500/10 rounded-xl bg-[var(--background-primary)]">
                <h4 className="text-sm font-bold text-[var(--text-normal)]">{t('settings.factory_reset')}</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 mb-4">{t('settings.factory_reset_desc')}</p>
                <button
                  onClick={() => setConfirmAction({
                    isOpen: true,
                    type: 'reset_data',
                    title: t('action.confirm_delete'),
                    desc: t('settings.factory_reset_desc')
                  })}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                >
                  {t('settings.delete_all')}
                </button>
              </div>
              <div className="p-4 border border-rose-500/10 rounded-xl bg-[var(--background-primary)]">
                <h4 className="text-sm font-bold text-[var(--text-normal)]">{t('settings.reset_config')}</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 mb-4">{t('settings.reset_config_desc')}</p>
                <button
                  onClick={() => setConfirmAction({
                    isOpen: true,
                    type: 'reset_settings',
                    title: t('settings.reset_config'),
                    desc: t('settings.reset_config_desc')
                  })}
                  className="w-full py-2 bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 text-[var(--text-muted)] rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                >
                  {t('settings.reset_btn')}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* CSV IMPORTER MODAL */}
      <CSVImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onImport={importCSV}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={confirmAction.isOpen}
        onClose={closeConfirm}
        onConfirm={() => {
          if (confirmAction.type === 'reset_data') executeFactoryReset();
          if (confirmAction.type === 'reset_settings') executeResetSettings();
          if (confirmAction.type === 'restore_backup') handleRestoreBackup();
          if (confirmAction.type === 'demo_exit') dispatch({ type: 'RESET_STATE' });
          closeConfirm();
        }}
        title={confirmAction.title}
        description={confirmAction.desc}
        confirmText={t('settings.confirm_action')}
        intent={confirmAction.type?.includes('reset') || confirmAction.type === 'restore_backup' ? 'reset_data' : 'generic_info'}
        variant={confirmAction.type?.includes('reset') || confirmAction.type === 'restore_backup' ? 'danger' : 'info'}
      />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active
      ? 'bg-[var(--background-primary)] text-[var(--text-normal)] shadow-sm border border-[var(--background-modifier-border)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'
      }`}
  >
    {icon} {label}
  </button>
);

const Toggle = ({ label, desc, active, onToggle }: any) => (
  <div onClick={onToggle} className={`cursor-pointer p-4 rounded-xl border transition-all flex justify-between items-center ${active ? 'bg-[var(--background-primary)] border-[var(--interactive-accent)]/50 shadow-sm' : 'bg-[var(--background-secondary)] border-[var(--background-modifier-border)] opacity-70'}`}>
    <div>
      <div className="font-bold text-sm text-[var(--text-normal)]">{label}</div>
      <div className="text-[10px] text-[var(--text-muted)]">{desc}</div>
    </div>
    <div className={`transition-colors ${active ? 'text-[var(--interactive-accent)] opacity-100' : 'text-[var(--text-muted)] opacity-50'}`}>
      {active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
    </div>
  </div>
);