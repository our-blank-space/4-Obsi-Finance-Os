import React, { useState } from 'react';
import { AssetProject } from '../../types';
import { useAI } from '../../hooks/useAI';
import { usePortfolioMath } from '../../hooks/usePortfolioMath';
import { useFinancialHealth } from '../../hooks/useFinancialHealth';
import { Sparkles, BrainCircuit, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { RichText } from '../ui/RichText';

interface Props {
    assets: AssetProject[];
}

export const CeoBriefing: React.FC<Props> = ({ assets }) => {
    const { generateExecutiveBriefing, isProcessing } = useAI();
    const stats = usePortfolioMath(assets);
    const health = useFinancialHealth(assets);

    const [briefing, setBriefing] = useState<string | null>(null);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);

    const handleGenerate = async () => {
        try {
            const result = await generateExecutiveBriefing(stats, assets, health);
            if (result) {
                setBriefing(result);
                setLastGenerated(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error("Briefing error:", error);
        }
    };

    return (
        <div className="bg-[var(--background-secondary)] p-8 rounded-[2.5rem] border border-[var(--background-modifier-border)] h-full overflow-hidden relative group">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--interactive-accent)]/5 blur-[80px] rounded-full group-hover:bg-[var(--interactive-accent)]/10 transition-all duration-1000" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                            <BrainCircuit size={16} className="text-[var(--interactive-accent)]" />
                            Executive AI Briefing
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium opacity-60">Análisis estratégico por Gemini 2.0</p>
                    </div>
                    {lastGenerated && (
                        <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--background-primary)] px-2 py-1 rounded border border-[var(--background-modifier-border)]">
                            Actualizado: {lastGenerated}
                        </span>
                    )}
                </div>

                {!briefing && !isProcessing && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[var(--background-primary)] rounded-full flex items-center justify-center mb-4 border border-[var(--background-modifier-border)] shadow-inner">
                            <Sparkles size={24} className="text-[var(--interactive-accent)] opacity-40" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-normal)] mb-2">Generar Análisis Estratégico</h4>
                        <p className="text-xs text-[var(--text-muted)] max-w-[250px] mb-6">
                            Analizaré tu diversificación, rendimiento y liquidez para darte 4 puntos de acción institucional.
                        </p>
                        <Button
                            onClick={handleGenerate}
                            intent="create"
                            icon={<Sparkles size={16} />}
                            className="shadow-xl shadow-[var(--interactive-accent)]/20 px-8"
                        >
                            Generar Briefing
                        </Button>
                    </div>
                )}

                {isProcessing && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <RefreshCw size={32} className="text-[var(--interactive-accent)] animate-spin-slow" />
                            <div className="absolute inset-0 bg-[var(--interactive-accent)] blur-xl opacity-20 animate-pulse" />
                        </div>
                        <div className="space-y-2 text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--text-normal)] animate-pulse">Consultando Comité IA...</p>
                            <div className="flex gap-1 justify-center">
                                <div className="w-1.5 h-1.5 bg-[var(--interactive-accent)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-[var(--interactive-accent)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-[var(--interactive-accent)] rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}

                {briefing && !isProcessing && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="prose prose-invert max-w-none text-sm text-[var(--text-normal)] leading-relaxed space-y-4">
                            <RichText text={briefing} />
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--background-modifier-border)] border-dashed flex justify-between items-center">
                            <p className="text-[10px] text-[var(--text-muted)] italic max-w-[200px]">
                                * Basado en datos actuales. Consulta con un asesor financiero humano para decisiones críticas.
                            </p>
                            <button
                                onClick={handleGenerate}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--interactive-accent)] transition-colors"
                            >
                                <RefreshCw size={12} /> Regenerar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
