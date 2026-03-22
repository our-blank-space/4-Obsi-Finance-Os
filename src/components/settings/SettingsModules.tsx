import React from 'react';
import { Box, FolderOpen, Bot, ToggleLeft, ToggleRight } from 'lucide-react';

const Toggle = ({ label, desc, active, onToggle }: { label: string, desc: string, active: boolean, onToggle: () => void }) => (
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

export const SettingsModules = ({ 
    state, 
    dispatch, 
    updateSettings, 
    triggerAutoSave, 
    t 
}: any) => {
    const { settings, features } = state;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
            <section className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl space-y-6">
                <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest">
                    <Box size={14} /> {t('settings.global_modules')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'dashboard', label: t('nav.dashboard') },
                        { id: 'balances', label: t('nav.balances') },
                        { id: 'logs', label: t('nav.logs') },
                        { id: 'monthly_review', label: t('nav.monthly_review') },
                        { id: 'annual_report', label: t('nav.annual_report') },
                        { id: 'guide', label: t('nav.guide') },
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
                        { id: 'reminders', label: t('nav.reminders') },
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ transactionsFolder: e.target.value })}
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
                            <input type="password" value={settings.geminiApiKey || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ geminiApiKey: e.target.value })} className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] p-3 rounded-xl text-sm outline-none font-mono" placeholder="sk-..." />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
