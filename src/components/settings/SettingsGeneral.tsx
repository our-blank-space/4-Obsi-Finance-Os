import React from 'react';
import { Globe, RefreshCw, Shield, ToggleLeft, ToggleRight, Wallet, GitMerge } from 'lucide-react';
import { SelectStyled } from '../ui/SelectStyled';
import { TaxonomyManager } from './TaxonomyManager';
import { Currency, PluginSettings } from '../../types';
import { DEFAULT_DATA } from '../../data/defaults';

export const SettingsGeneral = ({ 
    state, 
    dispatch, 
    updateSettings, 
    fetchExchangeRates, 
    isFetchingRates, 
    triggerAutoSave, 
    addEntity, 
    t 
}: any) => {
    const { settings, baseCurrency, accountRegistry, categoryRegistry } = state;
    const accounts = accountRegistry.map((a: any) => a.name);
    const areas = categoryRegistry.map((c: any) => c.name);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-left-4">
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
                            { value: 'EUR', label: 'EUR - Euro' },
                            { value: 'GBP', label: 'GBP - Libra Esterlina' },
                            { value: 'MXN', label: 'MXN - Peso Mexicano' },
                            { value: 'BRL', label: 'BRL - Real Brasileño' },
                            { value: 'ARS', label: 'ARS - Peso Argentino' },
                            { value: 'CLP', label: 'CLP - Peso Chileno' },
                            { value: 'PEN', label: 'PEN - Sol Peruano' }
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

            <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
                <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
                    <Wallet size={14} /> {t('settings.lists')}
                </h3>
                <TaxonomyManager title={t('settings.section.accounts')} items={accounts} type="account" onAdd={(v: string) => { addEntity('account', v); triggerAutoSave(); }} />

                <div className="p-3 bg-[var(--background-secondary)]/50 border border-[var(--interactive-accent)]/20 rounded-xl flex gap-3 text-xs text-[var(--interactive-accent)]">
                    <Shield size={16} className="shrink-0 mt-0.5" />
                    <p>
                        <strong className="text-[var(--text-normal)]">{t('settings.tip.liquidity_title')}</strong> <span className="text-[var(--text-muted)]">{t('settings.tip.liquidity_desc')}</span>
                    </p>
                </div>
                <TaxonomyManager title={t('settings.section.areas')} items={areas} type="area" onAdd={(v: string) => { addEntity('area', v); triggerAutoSave(); }} />

                <div className="p-3 bg-[var(--background-secondary)]/50 border border-[var(--interactive-accent)]/20 rounded-xl flex gap-3 text-xs text-[var(--interactive-accent)]">
                    <GitMerge size={16} className="shrink-0 mt-0.5" />
                    <p><strong className="text-[var(--text-normal)]">{t('settings.taxonomy.tip')}</strong></p>
                </div>
            </section>
        </div>
    );
};
