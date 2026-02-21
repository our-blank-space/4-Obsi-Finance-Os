
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Download } from "lucide-react";

interface Props { children: ReactNode; onExport: () => void; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("FinanceOS Crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-rose-50/10">
                    <AlertTriangle size={48} className="text-rose-500 mb-4" />
                    <h2 className="text-xl font-black text-[var(--text-normal)]">Algo salió mal</h2>
                    <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
                        El sistema ha encontrado un error crítico en la interfaz. Tus datos están seguros en el disco.
                    </p>
                    <div className="p-4 bg-[var(--background-primary)] rounded-xl border border-rose-500/20 mb-6 text-left w-full max-w-md overflow-auto max-h-32">
                        <code className="text-xs text-rose-400 font-mono">{this.state.error?.message}</code>
                    </div>
                    <button
                        onClick={this.props.onExport}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--interactive-accent)] text-white rounded-xl font-bold uppercase text-xs"
                    >
                        <Download size={16} /> Descargar Backup de Emergencia
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
