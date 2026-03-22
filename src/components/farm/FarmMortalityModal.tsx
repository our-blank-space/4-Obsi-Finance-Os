// src/components/farm/FarmMortalityModal.tsx
import React, { useState } from 'react';
import { X, Skull } from 'lucide-react';
import { NumericInput } from '../ui/NumericInput';

interface FarmMortalityModalProps {
    projectName: string;
    onSave: (count: number, reason: string) => void;
    onClose: () => void;
}

export const FarmMortalityModal: React.FC<FarmMortalityModalProps> = ({ projectName, onSave, onClose }) => {
    const [count, setCount] = useState('');
    const [reason, setReason] = useState('');

    const handleSave = () => {
        if (!count || Number(count) <= 0) return;
        onSave(Number(count), reason);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[var(--background-modifier-border)]">
                    <div className="flex items-center gap-2">
                        <Skull size={18} className="text-rose-500" />
                        <h2 className="font-black text-sm uppercase tracking-wider text-rose-500">Registrar Baja</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background-secondary)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Lote: {projectName}</p>
                    
                    <NumericInput
                        label="Cantidad de Bajas"
                        value={count}
                        onValueChange={setCount}
                        placeholder="0"
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Causa / Razón (opcional)</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Ej: Enfermedad respiratoria, Aplastamiento..."
                            rows={2}
                            className="w-full bg-[var(--background-secondary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-rose-500/50 transition-colors resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!count || Number(count) <= 0}
                        className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-lg shadow-rose-500/20"
                    >
                        Confirmar Baja
                    </button>
                </div>
            </div>
        </div>
    );
};
