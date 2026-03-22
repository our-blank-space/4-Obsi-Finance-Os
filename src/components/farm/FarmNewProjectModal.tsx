// src/components/farm/FarmNewProjectModal.tsx
import React, { useState } from 'react';
import { FarmProject, FarmProjectType } from '../../types/business';
import { PiggyBank, Bird, Sprout, Heart, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { NumericInput } from '../ui/NumericInput';

interface FarmNewProjectModalProps {
    currency: string;
    onSave: (project: FarmProject) => void;
    onClose: () => void;
}

const PROJECT_TYPES: { 
    type: FarmProjectType; 
    label: string; 
    desc: string; 
    Icon: any; 
    borderHover: string; 
    bgHover: string; 
    iconColor: string;
}[] = [
    { 
        type: 'pig_fattening', label: 'Cerdo Engorde', desc: 'Compra, cuido y venta al final', Icon: PiggyBank,
        borderHover: 'hover:border-rose-500', bgHover: 'hover:bg-rose-500/10', iconColor: 'text-rose-500' 
    },
    { 
        type: 'sow', label: 'Cerda de Cría', desc: 'Gestión de partos y lechones', Icon: Heart,
        borderHover: 'hover:border-pink-500', bgHover: 'hover:bg-pink-500/10', iconColor: 'text-pink-500' 
    },
    { 
        type: 'poultry', label: 'Aves / Pollos', desc: 'Pollos de engorde por libra', Icon: Bird,
        borderHover: 'hover:border-amber-500', bgHover: 'hover:bg-amber-500/10', iconColor: 'text-amber-500' 
    },
    { 
        type: 'crop', label: 'Cultivo / Planta', desc: 'Abono, semilla, cosecha', Icon: Sprout,
        borderHover: 'hover:border-emerald-500', bgHover: 'hover:bg-emerald-500/10', iconColor: 'text-emerald-500' 
    },
];

export const FarmNewProjectModal: React.FC<FarmNewProjectModalProps> = ({ currency, onSave, onClose }) => {
    const [step, setStep] = useState<'type' | 'details'>('type');
    const [selectedType, setSelectedType] = useState<FarmProjectType | null>(null);
    const [name, setName] = useState('');
    const [count, setCount] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [refPricePerLb, setRefPricePerLb] = useState('');
    const [refEntable, setRefEntable] = useState('');
    const [cropType, setCropType] = useState('');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (!selectedType || !name) return;
        const project: FarmProject = {
            id: crypto.randomUUID(),
            type: selectedType,
            name,
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
            costs: [],
            initialCount: count ? Number(count) : undefined,
            entryWeightKg: weightKg ? Number(weightKg) : undefined,
            isSow: selectedType === 'sow',
            refPricePerLb: refPricePerLb ? Number(refPricePerLb) : undefined,
            refEntablePrice: refEntable ? Number(refEntable) : undefined,
            cropType: cropType || undefined,
            breed: breed || undefined,
            birthDate: birthDate || undefined,
            notes: notes || undefined,
        };
        onSave(project);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--background-modifier-border)]">
                    <h2 className="font-black text-lg">Nuevo Lote</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background-secondary)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {step === 'type' ? (
                        <>
                            <p className="text-sm text-[var(--text-muted)]">¿Qué tipo de lote vas a abrir?</p>
                            <div className="grid grid-cols-2 gap-5">
                                {PROJECT_TYPES.map(({ type, label, desc, Icon, borderHover, bgHover, iconColor }) => (
                                    <button
                                        key={type}
                                        onClick={() => { setSelectedType(type); setStep('details'); }}
                                        className={`p-6 rounded-2xl border text-left transition-all duration-300 group ${borderHover} ${bgHover} bg-[var(--background-secondary)] border-[var(--background-modifier-border)] hover:scale-[1.02] hover:shadow-xl hover:shadow-${iconColor.split('-')[1]}-500/10`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${iconColor} bg-white/5 border border-white/5 shadow-inner`}>
                                            <Icon size={32} className="transition-transform group-hover:scale-110" />
                                        </div>
                                        <div className="font-black text-base text-[var(--text-normal)] leading-tight">{label}</div>
                                        <div className="text-xs text-[var(--text-muted)] mt-1.5 leading-snug">{desc}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep('type')} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-normal)] flex items-center gap-1 transition-colors">
                                ← Cambiar tipo
                            </button>

                            <Input
                                label="Nombre del lote"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej: Cerdos Marzo #1, Pollos Andres Tanda 2"
                            />

                            {(selectedType === 'pig_fattening' || selectedType === 'sow') && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Raza (Duroc, Pietrain...)"
                                            value={breed}
                                            onChange={e => setBreed(e.target.value)}
                                            placeholder="Ej: Pietrain x Duroc"
                                        />
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Fecha Nac.</label>
                                            <input
                                                type="date"
                                                value={birthDate}
                                                onChange={e => setBirthDate(e.target.value)}
                                                className="w-full bg-[var(--background-secondary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <NumericInput
                                            label="Cant. animales inicial"
                                            value={count}
                                            onValueChange={setCount}
                                        />
                                        <NumericInput
                                            label="Peso entrada (kg) promedio"
                                            value={weightKg}
                                            onValueChange={setWeightKg}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedType === 'poultry' && (
                                <>
                                    <NumericInput
                                        label="Cantidad de aves"
                                        value={count}
                                        onValueChange={setCount}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <NumericInput
                                            label="Precio/libra referencia"
                                            value={refPricePerLb}
                                            onValueChange={setRefPricePerLb}
                                            currency={currency}
                                        />
                                        <NumericInput
                                            label="Precio entable (ave)"
                                            value={refEntable}
                                            onValueChange={setRefEntable}
                                            currency={currency}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedType === 'crop' && (
                                <Input
                                    label="Tipo de cultivo / planta"
                                    value={cropType}
                                    onChange={e => setCropType(e.target.value)}
                                    placeholder="Ej: Maíz, Yuca, Plátano, Abono orgánico"
                                />
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Notas (opcional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Observaciones, condiciones iniciales..."
                                    className="w-full bg-[var(--background-secondary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!name}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                Abrir Lote
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
