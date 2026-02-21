// src/components/CustodialAccountManager.tsx
import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
    Currency,
    CustodialAccount,
    CustodialTransaction,
    CustodialTransactionType,
    CustodialAccountStatus
} from '../types';
import {
    ShieldCheck,
    Clock,
    User,
    FileText,
    AlertCircle,
    ArrowRightLeft,
    HandHelping,
    Scale
} from 'lucide-react';
import { calculateCustodialAccountBalance } from '../selectors/custodialSelectors';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../hooks/useTranslation';

import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { NumericInput } from './ui/NumericInput';
import { Modal, ModalFooter } from './ui/Modal';

export const CustodialAccountManager: React.FC = () => {
    const { state, dispatch } = useFinance();
    const { baseCurrency, custodialAccounts } = state;
    const { toBase, format } = useCurrency();
    const { t } = useTranslation();

    // --- ESTADOS DE UI ---
    const [showForm, setShowForm] = useState(false);
    const [showTxForm, setShowTxForm] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);

    const initialFormState: Omit<CustodialAccount, 'id' | 'transactions' | 'status'> = {
        name: '',
        entity: '',
        currency: baseCurrency,
        purpose: '',
        deadline: '',
        interestRate: 0,
        notes: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [txForm, setTxForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: CustodialTransactionType.DEPOSIT,
        amount: '',
        note: '',
        sourceAccount: ''
    });

    // --- LÓGICA DE ANALÍTICA DE CUSTODIA ---
    const globalStats = useMemo(() => {
        const total = custodialAccounts.reduce((acc, curr) =>
            acc + calculateCustodialAccountBalance(curr, toBase), 0
        );
        const activeCount = custodialAccounts.filter(a => a.status === CustodialAccountStatus.ACTIVE).length;
        return { total, activeCount };
    }, [custodialAccounts, toBase]);

    // --- HANDLERS ---
    const handleSaveAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.entity) return;

        const payload: CustodialAccount = {
            id: editId || crypto.randomUUID(),
            ...formData,
            transactions: editId ? (custodialAccounts.find(a => a.id === editId)?.transactions || []) : [],
            status: CustodialAccountStatus.ACTIVE
        };

        dispatch(editId ? { type: 'UPDATE_CUSTODIAL_ACCOUNT', payload } : { type: 'ADD_CUSTODIAL_ACCOUNT', payload });
        setShowForm(false);
        setEditId(null);
        setFormData(initialFormState);
    };

    const handleAddTransaction = () => {
        if (!selectedAccountId || !txForm.amount) return;

        const transaction: CustodialTransaction = {
            id: crypto.randomUUID(),
            date: txForm.date,
            type: txForm.type,
            amount: parseFloat(txForm.amount),
            note: txForm.note,
            sourceAccount: txForm.sourceAccount
        };

        dispatch({ type: 'ADD_CUSTODIAL_TRANSACTION', payload: { accountId: selectedAccountId, transaction } });
        setShowTxForm(false);
        setSelectedAccountId(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto font-sans">

            {/* HEADER ESTRATÉGICO: RESPONSABILIDAD TOTAL */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[var(--text-normal)] uppercase italic flex items-center gap-3">
                        <Scale className="text-indigo-500" /> Libro de Custodia
                    </h1>
                    <p className="text-[var(--text-muted)] mt-1 text-sm font-medium">Gestión de fondos de terceros y responsabilidades fiduciarias.</p>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-6 shadow-sm">
                    <div className="text-right">
                        <div className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Pasivo Total Bajo Gestión</div>
                        <div className="text-2xl font-mono font-black text-indigo-500">
                            {format(globalStats.total, baseCurrency)}
                        </div>
                    </div>
                    <Button onClick={() => { setEditId(null); setFormData(initialFormState); setShowForm(true); }} icon={<HandHelping size={18} />} variant="primary">
                        Nueva Responsabilidad
                    </Button>
                </div>
            </header>

            {/* LISTADO DE CONTRATOS/CUENTAS */}
            <div className="grid grid-cols-1 gap-6">
                {custodialAccounts.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-[var(--background-modifier-border)] rounded-3xl opacity-50">
                        <ShieldCheck size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
                        <p className="text-sm font-bold uppercase tracking-widest">No hay fondos externos bajo custodia</p>
                    </div>
                )}

                {custodialAccounts.map(account => {
                    const balance = calculateCustodialAccountBalance(account, toBase);
                    const daysRemaining = account.deadline ?
                        Math.ceil((new Date(account.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                        <div key={account.id} className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2rem] p-8 hover:border-indigo-500/50 transition-all shadow-sm group">
                            <div className="flex flex-col lg:flex-row justify-between gap-8">
                                {/* Info del "Contrato" */}
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 bg-[var(--background-primary)] rounded-2xl flex items-center justify-center text-indigo-500 border border-[var(--background-modifier-border)] shadow-inner">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-[var(--text-normal)] tracking-tight uppercase">{account.name}</h3>
                                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase border border-indigo-500/20">{account.entity}</span>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)] mt-1 font-medium italic">"{account.purpose}"</p>

                                        {/* Indicadores de Presión */}
                                        <div className="flex gap-4 mt-3">
                                            {daysRemaining !== null && (
                                                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${daysRemaining < 7 ? 'text-rose-500' : 'text-amber-500'}`}>
                                                    <Clock size={12} /> {daysRemaining <= 0 ? 'Vencido' : `Vence en ${daysRemaining} días`}
                                                </div>
                                            )}
                                            {account.interestRate > 0 && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                                                    <AlertCircle size={12} /> Rendimiento: {account.interestRate}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Balance y Acciones */}
                                <div className="flex items-center gap-8 justify-between lg:justify-end flex-1 border-t lg:border-0 pt-4 lg:pt-0">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">Saldo a Reintegrar</div>
                                        <div className="text-3xl font-mono font-black text-[var(--text-normal)]">
                                            {format(balance, account.currency)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => { setSelectedAccountId(account.id); setShowTxForm(true); }} icon={<ArrowRightLeft size={16} />}>Movimiento</Button>
                                        <Button variant="ghost" onClick={() => { setEditId(account.id); setFormData(account); setShowForm(true); }} icon={<FileText size={16} />} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: DEFINICIÓN DE RESPONSABILIDAD */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? "Editar Responsabilidad" : "Nueva Custodia de Fondos"} icon={<ShieldCheck size={24} />}>
                <form onSubmit={handleSaveAccount} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Identificador de la Cuenta" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Fondos Familiares" autoFocus />
                    <Input label="Entidad Propietaria" value={formData.entity} onChange={e => setFormData({ ...formData, entity: e.target.value })} placeholder="Nombre de la persona/entidad" />

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Moneda" options={['COP', 'USD', 'EUR']} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })} />
                        <Input label="Tasa (%)" type="number" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })} />
                    </div>

                    <Input label="Fecha de Devolución" type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                    <div className="md:col-span-2">
                        <Input label="Propósito / Acuerdo" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} placeholder="Ej: Administrar ahorros para viaje" />
                    </div>

                    <div className="md:col-span-2">
                        <ModalFooter>
                            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit">Confirmar Contrato</Button>
                        </ModalFooter>
                    </div>
                </form>
            </Modal>

            {/* MODAL: REGISTRO DE MOVIMIENTO DE CUSTODIA */}
            <Modal isOpen={showTxForm} onClose={() => setShowTxForm(false)} title="Registrar Movimiento de Custodia" icon={<ArrowRightLeft size={24} />}>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Tipo de Operación"
                            value={txForm.type}
                            onChange={e => setTxForm({ ...txForm, type: e.target.value as CustodialTransactionType })}
                            options={[
                                { value: CustodialTransactionType.DEPOSIT, label: 'Entrada de Capital' },
                                { value: CustodialTransactionType.WITHDRAWAL, label: 'Salida / Reintegro' },
                                { value: CustodialTransactionType.INTEREST, label: 'Abono de Rendimiento' },
                                { value: CustodialTransactionType.ADJUSTMENT, label: 'Ajuste de Balance' }
                            ]}
                        />
                        <NumericInput label="Monto" value={txForm.amount} onValueChange={v => setTxForm({ ...txForm, amount: v })} currency={custodialAccounts.find(a => a.id === selectedAccountId)?.currency} />
                    </div>
                    <Input label="Nota / Justificación" value={txForm.note} onChange={e => setTxForm({ ...txForm, note: e.target.value })} />

                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setShowTxForm(false)}>Cerrar</Button>
                        <Button onClick={handleAddTransaction}>Ejecutar Movimiento</Button>
                    </ModalFooter>
                </div>
            </Modal>
        </div>
    );
};

export default CustodialAccountManager;