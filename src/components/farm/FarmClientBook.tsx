// src/components/farm/FarmClientBook.tsx
import React, { useState } from 'react';
import { FarmClient, FarmSale, ClientPayment } from '../../types/business';
import { Users, CheckCircle2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { NumericInput } from '../ui/NumericInput';

interface FarmClientBookProps {
    clients: FarmClient[];
    sales: FarmSale[];
    currency: string;
    onRegisterPayment: (clientId: string, saleId: string, payment: ClientPayment, newBalance: number) => void;
}

export const FarmClientBook: React.FC<FarmClientBookProps> = ({ clients, sales, currency, onRegisterPayment }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<{ [saleId: string]: string }>({});
    const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(v);

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] border-2 border-dashed border-[var(--background-modifier-border)] rounded-2xl opacity-50">
                <Users size={48} strokeWidth={1} className="mb-3" />
                <p className="font-bold">Sin clientes registrados</p>
                <p className="text-xs mt-1">Los clientes se crean automáticamente al registrar ventas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {clients.map(client => {
                const clientSales = sales.filter(s => s.clientId === client.id);
                const totalDebt = clientSales.reduce((s, v) => s + v.balance, 0);
                const totalPurchased = clientSales.reduce((s, v) => s + v.totalAmount, 0);
                const isExpanded = expandedId === client.id;

                return (
                    <div key={client.id} className={`bg-[var(--background-primary)] border rounded-2xl overflow-hidden transition-all ${totalDebt > 0 ? 'border-amber-500/30' : 'border-[var(--background-modifier-border)]'}`}>
                        {/* Client header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : client.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-[var(--background-secondary)]/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] flex items-center justify-center font-black text-sm text-[var(--interactive-accent)]">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-[var(--text-normal)]">{client.name}</div>
                                    <div className="text-[10px] text-[var(--text-muted)]">{clientSales.length} compras · Total: {fmt(totalPurchased)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {totalDebt > 0 ? (
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase font-bold text-amber-600">Debe</div>
                                        <div className="font-mono font-black text-amber-500">{fmt(totalDebt)}</div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Al día</span>
                                )}
                                {isExpanded ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                            </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                            <div className="border-t border-[var(--background-modifier-border)] divide-y divide-[var(--background-modifier-border)]">
                                {clientSales.map(sale => (
                                    <div key={sale.id} className="p-4 bg-[var(--background-secondary)]/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs font-bold text-[var(--text-normal)]">{sale.date}</div>
                                                {sale.note && <div className="text-[10px] text-[var(--text-muted)]">{sale.note}</div>}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-sm">{fmt(sale.totalAmount)}</div>
                                                <div className={`text-[10px] font-bold uppercase ${sale.balance <= 0 ? 'text-emerald-500' : 'text-amber-600'}`}>
                                                    {sale.balance <= 0 ? 'Pagado' : `Debe: ${fmt(sale.balance)}`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Registrar abono */}
                                        {sale.balance > 0 && (
                                            <div className="flex gap-2 mt-3">
                                                <div className="flex-1">
                                                    <NumericInput
                                                        label="Registrar abono"
                                                        value={paymentAmount[sale.id] || ''}
                                                        onValueChange={v => setPaymentAmount(prev => ({ ...prev, [sale.id]: v }))}
                                                        currency={currency}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const amount = Number(paymentAmount[sale.id] || 0);
                                                        if (amount <= 0) return;
                                                        const payment: ClientPayment = {
                                                            id: crypto.randomUUID(),
                                                            date: new Date().toISOString().split('T')[0],
                                                            amount,
                                                        };
                                                        const newBalance = Math.max(0, sale.balance - amount);
                                                        onRegisterPayment(client.id, sale.id, payment, newBalance);
                                                        setPaymentAmount(prev => ({ ...prev, [sale.id]: '' }));
                                                    }}
                                                    className="self-end p-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow"
                                                    title="Confirmar abono"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {clientSales.length === 0 && (
                                    <div className="p-4 text-xs text-[var(--text-muted)] text-center">Sin compras registradas.</div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
