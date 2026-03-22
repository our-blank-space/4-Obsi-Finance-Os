import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, FileSpreadsheet, FileUp, FileText, Shield, FolderOpen, RefreshCw, Save, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Notice } from 'obsidian';
import { useFinance } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useTransactionsController } from '../../application/useTransactionsController';
import { ExportService } from '../../services/ExportService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CSVImporter } from '../CSVImporter';
import DemoSimulator from '../DemoSimulator';
import { DEFAULT_DATA } from '../../data/defaults';
import { BackupInfo } from '../../types/obsidian';

export const SettingsData: React.FC = () => {
    const { state, dispatch, saveDataNow, api } = useFinance();
    const { t } = useTranslation();
    const { importCSV } = useTransactionsController();
    
    const isDemo = state.meta?.mode === 'demo';

    // UI States
    const [showImporter, setShowImporter] = useState(false);
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

    useEffect(() => {
        loadBackups();
    }, []);

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
        const currentSettings = { ...state.settings };
        dispatch({ type: 'RESET_STATE' });
        dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: currentSettings } });
        saveDataNow();
        new Notice(t('msg.factory_reset_success'));
        closeConfirm();
    };

    const executeResetSettings = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: DEFAULT_DATA.settings } });
        saveDataNow();
        new Notice(t('msg.config_reset_success'));
        closeConfirm();
    };

    const closeConfirm = () => setConfirmAction({ ...confirmAction, isOpen: false });

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* 1. SIMULADOR */}
            {!isDemo ? (
                <div className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-6 rounded-2xl">
                    <h3 className="text-xs font-black uppercase flex items-center gap-2 text-[var(--text-muted)] tracking-widest mb-4">
                        <Database size={14} /> {t('settings.test_env')}
                    </h3>
                    <DemoSimulator onLoadData={(data: any) => dispatch({ type: 'LOAD_DEMO_DATA', payload: data })} />
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {/* Exportar JSON */}
                    <button onClick={handleExportJSON} className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all group">
                        <Download size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                        <span className="text-xs font-bold text-center">{t('settings.export_json')}</span>
                        <span className="text-[9px] text-[var(--text-muted)] text-center mt-1">{t('settings.backup_full')}</span>
                    </button>

                    {/* Restaurar JSON */}
                    <label className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all cursor-pointer group">
                        <Upload size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                        <span className="text-xs font-bold text-center">{t('settings.restore_json')}</span>
                        <span className="text-[9px] text-[var(--text-muted)] text-center mt-1">{t('settings.from_file')}</span>
                        <input type="file" onChange={handleImportJSON} className="hidden" accept=".json" />
                    </label>

                    {/* Importar CSV */}
                    <button onClick={() => setShowImporter(true)} className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all group">
                        <FileUp size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                        <span className="text-xs font-bold text-center">{t('settings.import_csv')}</span>
                        <span className="text-[9px] text-[var(--text-muted)] text-center mt-1">{t('settings.banks_excel')}</span>
                    </button>

                    {/* Exportar CSV */}
                    <button onClick={() => { ExportService.exportToCSV(state.transactions); new Notice('CSV Exportado'); }} className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all group">
                        <FileText size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                        <span className="text-xs font-bold text-center">Exportar CSV</span>
                        <span className="text-[9px] text-[var(--text-muted)] text-center mt-1">Formato Contable</span>
                    </button>

                    {/* Exportar PDF */}
                    <button onClick={() => { ExportService.exportToPDF(state.transactions); new Notice('Generando PDF...'); }} className="flex flex-col items-center justify-center p-4 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl hover:border-[var(--interactive-accent)] transition-all group">
                        <FileText size={24} className="text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] mb-2 transition-colors" />
                        <span className="text-xs font-bold text-center">Exportar PDF</span>
                        <span className="text-[9px] text-[var(--text-muted)] text-center mt-1">Reporte Limpio</span>
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

            <CSVImporter
                isOpen={showImporter}
                onClose={() => setShowImporter(false)}
                onImport={importCSV}
            />

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
