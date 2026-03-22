// src/components/farm/FarmWeightModal.tsx
import React, { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { NumericInput } from '../ui/NumericInput';

interface FarmWeightModalProps {
    projectName: string;
    onSave: (weightKg: number, note: string) => void;
    onClose: () => void;
}

export const FarmWeightModal: React.FC<FarmWeightModalProps> = ({ projectName, onSave, onClose }) => {
    const [weight, setWeight] = useState('');
    const [note, setNote] = useState('');

    const handleSave = () => {
        if (!weight || Number(weight) <= 0) return;
        onSave(Number(weight), note);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[var(--background-modifier-border)]">
                    <div className="flex items-center gap-2">
                        <Scale size={18} className="text-sky-400" />
                        <h2 className="font-black text-sm uppercase tracking-wider">Registrar Pesaje</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background-secondary)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Lote: {projectName}</p>
                    
                    <NumericInput
                        label="Peso Promedio (kg)"
                        value={weight}
                        onValueChange={setWeight}
                        placeholder="0.00"
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Nota (opcional)</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Ej: Pesaje de control mes 3..."
                            rows={2}
                            className="w-full bg-[var(--background-secondary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!weight || Number(weight) <= 0}
                        className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50"
                    >
                        Guardar Pesaje
                    </button>
                </div>
            </div>
        </div>
    );
};
