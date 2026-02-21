import React, { useState, useMemo } from 'react';
import { Loan, Debt, LoanPayment } from '../../types';
import { CreditEngine } from '../../core/analytics/CreditEngine';
import { User, BarChart3, X, HandCoins, Receipt, Pencil, Trash2, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../ui/Button';
import { NumericInput } from '../ui/NumericInput';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    item: Loan | Debt;
    mode: 'lending' | 'debt';
    format: (v: number, c: any) => string;
    onAddPayment: (id: string, amount: number) => void;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onItemUpdate: (item: Loan | Debt) => void;
}

import { PaymentHistoryModal } from './PaymentHistoryModal';
import { CreditAnalyzerModal } from './CreditAnalyzerModal';
import { History, LineChart } from 'lucide-react';

export const CreditCard: React.FC<Props> = ({ item, mode, format, onAddPayment, onEdit, onDelete, onItemUpdate }) => {
    const { t } = useTranslation();
    const [showChart, setShowChart] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAnalyzer, setShowAnalyzer] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

    const name = 'borrowerName' in item ? item.borrowerName : item.lenderName;
    const paid = 'collected' in item ? item.collected : item.paid;
    const totalDue = CreditEngine.calculateTotalDue(item);
    const remaining = CreditEngine.calculateRemaining(item);
    const progress = totalDue > 0 ? Math.min(100, (paid / totalDue) * 100) : 0;

    // Analyze status for badge
    const analysis = useMemo(() => CreditEngine.analyzePaymentStatus(item), [item]);

    // Handler wrapper for History Modal updates (since it modifies payments)
    // We need to propagate this up to the parent `onUpdate` which expects the full array

    const handleUpdateItem = (updated: any) => {
        onItemUpdate(updated);
    };

    const chartData = useMemo(() => {
        return (item.payments || []).reduce((acc: any[], curr: LoanPayment) => {
            const lastPending = acc.length > 0 ? acc[acc.length - 1].pending : totalDue;
            acc.push({ date: curr.date.substring(5), pending: lastPending - curr.amount });
            return acc;
        }, [{ date: t('common.date'), pending: totalDue }]);
    }, [item.payments, totalDue, t]);

    return (
        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2.5rem] p-8 hover:border-[var(--text-normal)] transition-all shadow-sm relative overflow-hidden group">

            <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8">
                <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${mode === 'lending' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                        <User size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black text-[var(--text-normal)] tracking-tight">{name}</h3>
                            {/* STATUS BADGE */}
                            {item.status === 'active' && (
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${analysis.status === 'late' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                    analysis.status === 'ahead' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                    {t(`credit.status.${analysis.status}`)}
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mt-1">{item.startDate}</div>
                    </div>
                </div>

                <div className="flex items-center gap-8 justify-between lg:justify-end flex-1">
                    <div className="text-right">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">{t('credit.remaining')}</div>
                        <div className={`text-3xl font-mono font-black ${remaining <= 0 ? 'text-emerald-500' : 'text-[var(--text-normal)]'}`}>
                            {format(remaining, item.currency)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setShowHistory(true)} title={t('credit.history.title')}><History size={18} /></Button>
                        <Button variant="outline" size="icon" onClick={() => setShowAnalyzer(true)} title={t('credit.analyzer.title')}><LineChart size={18} /></Button>
                        <Button variant="outline" size="icon" onClick={() => setShowChart(!showChart)}><BarChart3 size={18} /></Button>
                        {item.status === 'active' && (
                            <Button variant={mode === 'lending' ? 'success' : 'danger'} onClick={() => setShowPaymentForm(!showPaymentForm)}>
                                {showPaymentForm ? <X size={16} /> : (mode === 'lending' ? <HandCoins size={16} /> : <Receipt size={16} />)}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {showChart && (
                <div className="mb-8 h-[180px] w-full bg-[var(--background-primary)] p-4 rounded-3xl border border-[var(--background-modifier-border)]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="date" hide />
                            <Tooltip formatter={(v: any) => [format(v, item.currency), t('credit.remaining')]} contentStyle={{ borderRadius: '12px', background: 'var(--background-secondary)', border: 'none' }} />
                            <Area type="monotone" dataKey="pending" stroke={mode === 'lending' ? '#a855f7' : '#f43f5e'} fill={mode === 'lending' ? '#a855f7' : '#f43f5e'} fillOpacity={0.1} strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {showPaymentForm && (
                <div className="mb-8 p-6 bg-[var(--background-primary)] border border-[var(--interactive-accent)]/30 rounded-3xl flex flex-col sm:flex-row items-end gap-4 animate-in slide-in-from-top-2">
                    <div className="flex-1 w-full">
                        <NumericInput label={t('credit.payment_amount')} value={paymentAmount} onValueChange={setPaymentAmount} currency={item.currency} autoFocus />
                    </div>
                    <Button onClick={() => { onAddPayment(item.id, parseFloat(paymentAmount)); setShowPaymentForm(false); setPaymentAmount(''); }}>{t('btn.confirm')}</Button>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-[var(--background-modifier-border)]">
                <Detail label={t('credit.form.principal')} value={format(item.principal, item.currency)} />
                <Detail label={t('credit.form.interest')} value={format(CreditEngine.calculateInterest(item), item.currency)} subtext={t('credit.annual_pct', { pct: item.annualInterestRate })} />
                <Detail label={t('credit.total')} value={format(totalDue, item.currency)} />
                <Detail label={t('credit.paid')} value={format(paid, item.currency)} className="text-emerald-500" />
            </div>

            <div className="space-y-2 mt-2">
                <div className="flex justify-between text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                    <span>{t('credit.progress')}</span>
                    <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--background-primary)] rounded-full overflow-hidden p-0.5">
                    <div className={`h-full rounded-full transition-all duration-1000 ${mode === 'lending' ? 'bg-purple-500' : 'bg-rose-500'}`} style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(item)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-normal)]"><Pencil size={18} /></button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-[var(--text-muted)] hover:text-rose-500"><Trash2 size={18} /></button>
            </div>

            {/* MODALS */}
            <PaymentHistoryModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                item={item}
                onUpdate={(updated) => { handleUpdateItem(updated); }}
            />

            <CreditAnalyzerModal
                isOpen={showAnalyzer}
                onClose={() => setShowAnalyzer(false)}
                item={item}
            />
        </div>
    );
};

const Detail = ({ label, value, subtext, className = "" }: any) => (
    <div>
        <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-lg font-mono font-black text-[var(--text-normal)] ${className}`}>{value}</div>
        {subtext && <div className="text-[8px] font-bold opacity-60">{subtext}</div>}
    </div>
);