import React, { useMemo } from 'react';
import { Loan, Debt } from '../../types';
import { CreditEngine } from '../../core/analytics/CreditEngine';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: Loan | Debt;
}

export const CreditAnalyzerModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
    const { t } = useTranslation();
    const { format } = useCurrency();

    const analysis = useMemo(() => CreditEngine.analyzePaymentStatus(item), [item]);
    const { status, diff, expectedToDate, paidToDate, expectedPayment } = analysis;

    const StatusIcon = {
        'on_track': CheckCircle2,
        'late': AlertCircle,
        'ahead': TrendingUp
    }[status];

    const statusColor = {
        'on_track': 'text-emerald-500',
        'late': 'text-rose-500',
        'ahead': 'text-blue-500'
    }[status];

    const statusBg = {
        'on_track': 'bg-emerald-500/10 border-emerald-500/20',
        'late': 'bg-rose-500/10 border-rose-500/20',
        'ahead': 'bg-blue-500/10 border-blue-500/20'
    }[status];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('credit.analyzer.title')} icon={<BarChart3 size={20} />}>
            <div className="space-y-6">

                {/* 1. STATUS CARD */}
                <div className={`p-4 rounded-2xl border ${statusBg} flex items-center gap-4`}>
                    <div className={`p-3 rounded-full bg-[var(--background-primary)] ${statusColor}`}>
                        <StatusIcon size={24} />
                    </div>
                    <div>
                        <h3 className={`font-black uppercase text-sm ${statusColor}`}>
                            {t(`credit.status.${status}`)}
                        </h3>
                        <p className="text-xs text-[var(--text-normal)] mt-1 opacity-80 leading-relaxed">
                            {status === 'late'
                                ? t('credit.analyzer.late_msg', { amount: format(Math.abs(diff), item.currency) })
                                : t(`credit.analyzer.msg.${status}`)}
                        </p>
                    </div>
                </div>

                {/* 2. SUMMARY STATS */}
                <div className="grid grid-cols-2 gap-4">
                    <StatBox label={t('credit.expected_to_date')} value={format(expectedToDate, item.currency)} />
                    <StatBox label={t('credit.paid_to_date')} value={format(paidToDate, item.currency)} highlight={statusColor} />
                    <StatBox label={t('credit.next_installment')} value={format(expectedPayment, item.currency)} />
                    <StatBox label={t('credit.diff')} value={format(diff, item.currency)} highlight={diff < 0 ? 'text-rose-500' : 'text-emerald-500'} />
                </div>

                {/* 3. SIMPLIFIED SCHEDULE TABLE */}
                <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--background-modifier-border)] overflow-hidden">
                    <div className="px-4 py-2 bg-[var(--background-modifier-form-field)]/50 border-b border-[var(--background-modifier-border)] text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] flex justify-between">
                        <span>{t('credit.progress_projection')}</span>
                        <span>{item.durationMonths} {t('common.months')}</span>
                    </div>
                    {/* Placeholder for visual schedule - for MVP just a text summary */}
                    <div className="p-4 text-center">
                        <p className="text-xs text-[var(--text-muted)]">
                            {t('credit.analyzer.projection_desc', {
                                end: new Date(new Date(item.startDate).setMonth(new Date(item.startDate).getMonth() + item.durationMonths)).toLocaleDateString()
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const StatBox = ({ label, value, highlight = '' }: any) => (
    <div className="p-3 bg-[var(--background-primary)] rounded-xl border border-[var(--background-modifier-border)]">
        <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">{label}</div>
        <div className={`font-mono font-bold text-sm ${highlight || 'text-[var(--text-normal)]'}`}>{value}</div>
    </div>
);
