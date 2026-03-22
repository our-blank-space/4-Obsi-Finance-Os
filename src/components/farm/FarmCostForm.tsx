// src/components/farm/FarmCostForm.tsx
import React, { useState } from 'react';
import { FarmProject, FarmCost, FarmCostCategory } from '../../types/business';
import { NumericInput } from '../ui/NumericInput';
import { Input } from '../ui/Input';
import { FilePlus } from 'lucide-react';

interface FarmCostFormProps {
    project: FarmProject;
    currency: string;
    onSave: (projectId: string, cost: FarmCost) => void;
}

const COST_CATEGORIES: { value: FarmCostCategory; label: string }[] = [
    { value: 'purchase', label: 'Compra inicial' },
    { value: 'feed_preinit', label: 'Cuido pre-inicio' },
    { value: 'feed_init', label: 'Cuido inicio' },
    { value: 'feed_growth', label: 'Cuido levante / engorde' },
    { value: 'medicine', label: 'Medicamentos / vacunas' },
    { value: 'bedding', label: 'Cascarilla / cama' },
    { value: 'labor', label: 'Mano de obra' },
    { value: 'other', label: 'Otro' },
];

export const FarmCostForm: React.FC<FarmCostFormProps> = ({ project, currency, onSave }) => {
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState<FarmCostCategory>('purchase');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        if (!amount || Number(amount) <= 0) return;
        const cost: FarmCost = {
            id: crypto.randomUUID(),
            date,
            description: desc || COST_CATEGORIES.find(c => c.value === category)?.label || 'Gasto',
            category,
            amount: Number(amount),
            quantity: quantity ? Number(quantity) : undefined,
        };
        onSave(project.id, cost);
        setDesc('');
        setAmount('');
        setQuantity('');
    };

    const totalCosts = project.costs.reduce((s, c) => s + c.amount, 0);
    const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(v);

    return (
        <div className="bg-[var(--background-secondary)] rounded-3xl border border-[var(--background-modifier-border)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm uppercase text-[var(--text-muted)]">Registrar Costo — {project.name}</h3>
                <span className="font-mono text-xs font-bold text-rose-400">{fmt(totalCosts)} total</span>
            </div>

            <div className="space-y-3">
                {/* Categoría */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Categoría</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value as FarmCostCategory)}
                        className="w-full bg-[var(--background-primary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                    >
                        {COST_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Descripción (opcional)"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Ej: 1 bulto levante 40kg, Ivermectina..."
                />

                <div className="grid grid-cols-2 gap-3">
                    <NumericInput
                        label="Monto Total"
                        value={amount}
                        onValueChange={setAmount}
                        currency={currency}
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-[var(--background-primary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                        />
                    </div>
                </div>

                {category.startsWith('feed_') || category === 'medicine' || category === 'bedding' ? (
                    <div className="w-1/2 pr-1.5">
                        <NumericInput
                            label={category.startsWith('feed_') ? 'Cantidad Múltiplo (kg)' : 'Cantidad / Dosis'}
                            value={quantity}
                            onValueChange={setQuantity}
                        />
                    </div>
                ) : null}

                <button
                    onClick={handleSave}
                    disabled={!amount || Number(amount) <= 0}
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                >
                    <FilePlus size={14} /> Registrar Costo
                </button>
            </div>

            {/* Lista de costos del proyecto */}
            {project.costs.length > 0 && (
                <div className="mt-5 space-y-1.5 border-t border-[var(--background-modifier-border)] pt-4">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2">Costos registrados</p>
                    {project.costs.map(cost => (
                        <div key={cost.id} className="flex justify-between items-center text-xs py-1.5 border-b border-[var(--background-modifier-border)]/50">
                            <div>
                                <span className="font-bold text-[var(--text-normal)]">{cost.description}</span>
                                <span className="ml-2 text-[9px] uppercase bg-[var(--background-secondary)] px-1 py-0.5 rounded border border-[var(--background-modifier-border)] text-[var(--text-muted)]">
                                    {COST_CATEGORIES.find(c => c.value === cost.category)?.label}
                                </span>
                                {cost.quantity && (
                                    <span className="ml-1 text-[9px] font-bold text-[var(--text-muted)]">
                                        ({cost.quantity} {cost.category.startsWith('feed_') ? 'kg' : 'uds'})
                                    </span>
                                )}
                            </div>
                            <span className="font-mono font-bold text-rose-400">{fmt(cost.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
