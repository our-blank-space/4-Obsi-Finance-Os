import React, { useMemo, useState } from 'react';
import { Asset, AssetTransaction } from '../../types/assets';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';
import { AssetEngine } from '../../core/analytics/AssetEngine';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Calendar, FileText, Trash2, Edit, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal, ModalFooter } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { NumericInput } from '../ui/NumericInput';

interface Props {
    asset: Asset;
    onUpdate: (asset: Asset) => void;
    onClose: () => void;
    onEdit: (asset: Asset) => void;
    onDelete: (assetId: string) => void;
}

export const AssetDetailView: React.FC<Props> = ({ asset, onUpdate, onClose, onEdit, onDelete }) => {
    const { format, baseCurrency } = useCurrency();
    const { t } = useTranslation();
    const [tab, setTab] = useState<'overview' | 'financials'>('overview');

    // Transaction Modal State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
    const [deletingAsset, setDeletingAsset] = useState(false);
    const [txData, setTxData] = useState<Partial<AssetTransaction>>({
        type: 'maintenance',
        date: new Date().toISOString().split('T')[0],
        currency: asset.currency
    });

    const metrics = useMemo(() => ({
        netValue: AssetEngine.calculateNetValue(asset), // TODO: Pass liability
        tco: AssetEngine.calculateTCO(asset),
        roi: AssetEngine.calculateROI(asset),
        cashFlow: AssetEngine.calculateMonthlyCashFlow(asset),
        depreciation: AssetEngine.calculateDepreciation(asset),
        netInvestment: AssetEngine.calculateNetInvestment(asset)
    }), [asset]);

    const transactions = useMemo(() =>
        (asset.transactions || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [asset.transactions]);

    const handleAddTransaction = () => {
        if (!txData.amount || !txData.description) return;

        let updatedTransactions = [...(asset.transactions || [])];

        if (editingTxId) {
            updatedTransactions = updatedTransactions.map(t =>
                t.id === editingTxId ? {
                    ...t,
                    date: txData.date || t.date,
                    description: txData.description || t.description,
                    amount: Number(txData.amount),
                    currency: txData.currency || t.currency,
                    type: txData.type || t.type,
                    isRecurrent: !!txData.isRecurrent,
                    category: txData.category
                } : t
            );
        } else {
            const newTx: AssetTransaction = {
                id: crypto.randomUUID(),
                assetId: asset.id,
                date: txData.date || new Date().toISOString().split('T')[0],
                description: txData.description || '',
                amount: Number(txData.amount),
                currency: txData.currency || asset.currency,
                type: txData.type || 'maintenance',
                isRecurrent: !!txData.isRecurrent,
                category: txData.category
            };
            updatedTransactions.push(newTx);
        }

        const updatedAsset = {
            ...asset,
            transactions: updatedTransactions,
            updatedAt: new Date().toISOString()
        };

        onUpdate(updatedAsset);
        setIsTxModalOpen(false);
        setEditingTxId(null);
        setTxData({ type: 'maintenance', date: new Date().toISOString().split('T')[0], currency: asset.currency });
    };

    const handleEditTransaction = (tx: AssetTransaction) => {
        setTxData(tx);
        setEditingTxId(tx.id);
        setIsTxModalOpen(true);
    };

    const confirmDeleteTransaction = () => {
        if (!deletingTxId) return;

        const updatedAsset = {
            ...asset,
            transactions: (asset.transactions || []).filter(t => t.id !== deletingTxId),
            updatedAt: new Date().toISOString()
        };
        onUpdate(updatedAsset);
        setDeletingTxId(null);
    };

    const handleDeleteTransaction = (txId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingTxId(txId);
    };

    const confirmDeleteAsset = () => {
        onDelete(asset.id);
        setDeletingAsset(false);
    };

    return (
        <div className="bg-[var(--background-primary)] h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* HEADER */}
            <div className="p-6 border-b border-[var(--background-modifier-border)] flex justify-between items-start">
                <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{t(`assets.cat.${asset.category?.toLowerCase().replace(' ', '_')}`) || asset.category}</div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-[var(--text-normal)] tracking-tight">{asset.name}</h2>
                        <div className="flex gap-1">
                            <button onClick={() => onEdit(asset)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--interactive-accent)] bg-[var(--background-modifier-hover)] rounded-md transition-colors" title={t('btn.edit')}>
                                <Edit size={16} />
                            </button>
                            <button onClick={() => setDeletingAsset(true)} className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 bg-[var(--background-modifier-hover)] rounded-md transition-colors" title={t('btn.delete')}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${metrics.cashFlow >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {metrics.cashFlow >= 0 ? t('credit.status.ahead') : t('credit.status.late')}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Activity size={12} /> {t('asset.roi')}: {metrics.roi.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <Button variant="ghost" onClick={onClose}><X size={20} /></Button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-[var(--background-modifier-border)] px-6">
                <button onClick={() => setTab('overview')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 ${tab === 'overview' ? 'border-[var(--interactive-accent)] text-[var(--text-normal)]' : 'border-transparent text-[var(--text-muted)]'}`}>{t('assets.tabs.overview')}</button>
                <button onClick={() => setTab('financials')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 ${tab === 'financials' ? 'border-[var(--interactive-accent)] text-[var(--text-normal)]' : 'border-transparent text-[var(--text-muted)]'}`}>{t('assets.tabs.financials')}</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {tab === 'overview' && (
                    <>
                        <div className="space-y-8 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-[var(--background-secondary)] rounded-2xl border border-[var(--background-modifier-border)] flex flex-col justify-between">
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{t('assets.detail.current_value')}</div>
                                    <div className="text-3xl font-black text-[var(--text-normal)] mt-2">{format(asset.currentValue || 0, asset.currency)}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                                        <span className="opacity-50">{t('assets.detail.original_cost')}:</span> {format(asset.purchasePrice || 0, asset.currency)}
                                    </div>
                                </div>
                                <div className="p-5 bg-[var(--background-secondary)] rounded-2xl border border-[var(--background-modifier-border)] flex flex-col justify-between">
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">
                                        {metrics.netInvestment > 0 ? t('assets.detail.net_investment') : t('assets.detail.net_profit')}
                                    </div>
                                    <div className={`text-3xl font-black mt-2 ${metrics.netInvestment <= 0 ? 'text-emerald-500' : 'text-[var(--text-normal)]'}`}>
                                        {format(Math.abs(metrics.netInvestment), asset.currency)}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1">
                                        {metrics.netInvestment > 0 ? t('assets.detail.break_even_desc') : 'Activo 100% pagado y generando ganancias'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Bar */}
                        <div className="flex gap-3 mt-8">
                            <Button
                                className="flex-1"
                                variant="secondary"
                                onClick={() => {
                                    setTxData({ type: 'maintenance', date: new Date().toISOString().split('T')[0], currency: asset.currency, description: '', amount: undefined });
                                    setEditingTxId(null);
                                    setIsTxModalOpen(true);
                                }}
                                icon={<ArrowUpRight size={16} className="text-rose-500" />}
                            >
                                {t('assets.btn.add_expense')}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="secondary"
                                onClick={() => {
                                    setTxData({ type: 'revenue', date: new Date().toISOString().split('T')[0], currency: asset.currency, description: '', amount: undefined });
                                    setEditingTxId(null);
                                    setIsTxModalOpen(true);
                                }}
                                icon={<ArrowDownRight size={16} className="text-emerald-500" />}
                            >
                                {t('assets.btn.add_income')}
                            </Button>
                        </div>
                    </>
                )}

                {tab === 'financials' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold uppercase text-[var(--text-muted)]">{t('assets.history.title')}</h3>
                        </div>
                        <div className="space-y-2">
                            {transactions.length === 0 && <p className="text-xs text-[var(--text-muted)] italic text-center py-4">{t('assets.history.empty')}</p>}
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${tx.type === 'revenue' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {tx.type === 'revenue' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">{tx.description}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                                                <span>{tx.date}</span>
                                                <span className="capitalize px-1.5 py-0.5 rounded-md bg-[var(--background-primary)] border border-[var(--background-modifier-border)]">{tx.type === 'maintenance' ? t('assets.tx.type.expense') : t('assets.tx.type.income')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`font-mono font-bold ${tx.type === 'revenue' ? 'text-emerald-500' : 'text-[var(--text-normal)]'}`}>
                                            {tx.type === 'revenue' ? '+' : '-'}{format(tx.amount, tx.currency)}
                                        </div>
                                        <button
                                            onClick={() => handleEditTransaction(tx)}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--interactive-accent)] hover:bg-[var(--background-primary)] rounded-lg transition-colors"
                                            title={t('btn.edit')}
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteTransaction(tx.id, e)}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title={t('btn.delete')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE ASSET CONFIRMATION MODAL */}
            <Modal isOpen={deletingAsset} onClose={() => setDeletingAsset(false)} title={t('assets.manage.delete')}>
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">{t('common.confirm_delete')}</p>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setDeletingAsset(false)}>{t('btn.cancel')}</Button>
                        <Button onClick={confirmDeleteAsset} className="bg-rose-500 hover:bg-rose-600 text-white border-none">{t('btn.delete')}</Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={!!deletingTxId} onClose={() => setDeletingTxId(null)} title={t('logs.delete_confirm.title')}>
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">{t('logs.delete_confirm.message')}</p>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setDeletingTxId(null)}>{t('btn.cancel')}</Button>
                        <Button onClick={confirmDeleteTransaction} className="bg-rose-500 hover:bg-rose-600 text-white border-none">{t('btn.delete')}</Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* TRANSACTION MODAL */}
            <Modal isOpen={isTxModalOpen} onClose={() => { setIsTxModalOpen(false); setEditingTxId(null); }} title={editingTxId ? t('assets.tx.edit_title') : t('assets.tx.title')}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setTxData({ ...txData, type: 'maintenance' })} className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${txData.type !== 'revenue' ? 'bg-rose-500/10 border-rose-500 text-rose-500 font-bold' : 'opacity-50 hover:opacity-100'}`}>
                            {t('assets.tx.type.expense')}
                        </div>
                        <div onClick={() => setTxData({ ...txData, type: 'revenue' })} className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${txData.type === 'revenue' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold' : 'opacity-50 hover:opacity-100'}`}>
                            {t('assets.tx.type.income')}
                        </div>
                    </div>

                    <Input label={t('assets.tx.desc_label')} placeholder={t('assets.tx.desc_ph')} value={txData.description || ''} onChange={(e) => setTxData({ ...txData, description: e.target.value })} autoFocus />

                    <div className="grid grid-cols-2 gap-4">
                        <NumericInput
                            label={t('common.amount')}
                            value={txData.amount?.toString() || ''}
                            onValueChange={(v) => setTxData({ ...txData, amount: Number(v) })}
                            currency={txData.currency}
                        />
                        <Select
                            label={t('common.currency')}
                            value={txData.currency || asset.currency}
                            onChange={(e) => setTxData({ ...txData, currency: e.target.value as any })}
                            options={['COP', 'USD', 'EUR'].map(c => ({ value: c, label: c }))}
                        />
                    </div>
                    <Input type="date" label={t('common.date')} value={txData.date} onChange={(e) => setTxData({ ...txData, date: e.target.value })} />

                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setIsTxModalOpen(false)}>{t('btn.cancel')}</Button>
                        <Button onClick={handleAddTransaction}>{t('btn.save')}</Button>
                    </ModalFooter>
                </div>
            </Modal>
        </div >
    );
};
