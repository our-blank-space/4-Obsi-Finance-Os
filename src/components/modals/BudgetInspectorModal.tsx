import React, { useMemo } from 'react';
import { Transaction } from '../../types';
import { Modal } from '../ui/Modal';
import { useCurrency } from '../../hooks/useCurrency';
import { TrendingDown } from 'lucide-react';
import { BudgetAnalysis } from '../../hooks/useBudgetMonitor';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    budgetData: BudgetAnalysis | null;
}

export const BudgetInspectorModal: React.FC<Props> = ({ isOpen, onClose, budgetData }) => {
    const { format } = useCurrency();
    const { t } = useTranslation();

    if (!budgetData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('bud.modal.detail', { name: budgetData.area })} size="md">
            <div className="space-y-6">

                {/* Header Resumen */}
                <div className="grid grid-cols-3 gap-2 text-center bg-[var(--background-secondary)] p-4 rounded-xl border border-[var(--background-modifier-border)]">
                    <div>
                        <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">{t('bud.modal.limit')}</div>
                        <div className="font-mono font-bold">{format(budgetData.amount, budgetData.currency)}</div>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">{t('bud.modal.spent')}</div>
                        <div className={`font-mono font-bold ${budgetData.status === 'critical' ? 'text-rose-500' : 'text-[var(--text-normal)]'}`}>
                            {format(budgetData.spent, budgetData.currency)}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">{t('bud.modal.remaining')}</div>
                        <div className={`font-mono font-bold ${budgetData.remaining < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {format(budgetData.remaining, budgetData.currency)}
                        </div>
                    </div>
                </div>

                {/* Lista de Transacciones */}
                <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest flex items-center gap-2">
                        <TrendingDown size={14} /> {t('bud.modal.movements')}
                    </h4>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar border rounded-xl border-[var(--background-modifier-border)]">
                        {budgetData.relatedTransactions.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[var(--text-muted)] italic">
                                {t('bud.modal.empty')}
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[var(--background-secondary)] sticky top-0 text-[10px] font-bold uppercase text-[var(--text-muted)] z-10">
                                    <tr>
                                        <th className="p-3">{t('bud.modal.col_date')}</th>
                                        <th className="p-3">{t('bud.modal.col_detail')}</th>
                                        <th className="p-3 text-right">{t('bud.modal.col_amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--background-modifier-border)] text-xs">
                                    {budgetData.relatedTransactions.map((tx: Transaction) => (
                                        <tr key={tx.id} className="hover:bg-[var(--background-modifier-hover)] transition-colors">
                                            <td className="p-3 font-mono text-[var(--text-muted)] whitespace-nowrap w-24">
                                                {tx.date.slice(8, 10)} <span className="opacity-50">/ {tx.date.slice(5, 7)}</span>
                                            </td>
                                            <td className="p-3 font-medium text-[var(--text-normal)] truncate max-w-[150px]" title={tx.note}>
                                                {tx.note || t('bud.modal.no_note')}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                                                {format(tx.amount, tx.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
