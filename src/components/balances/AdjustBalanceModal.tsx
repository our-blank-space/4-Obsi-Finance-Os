import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NumericInput } from '../ui/NumericInput';
import { useTranslation } from '../../hooks/useTranslation';
import { Calculator, AlertCircle, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
    accountName: string;
    currentBalance: number;
    baseCurrency: string;
    onConfirm: (difference: number, newBalance: number) => void;
}

export const AdjustBalanceModal: React.FC<Props> = ({
    isOpen, onClose, accountId, accountName, currentBalance, baseCurrency, onConfirm
}) => {
    const { t } = useTranslation();
    const { format } = useCurrency();
    const [realBalance, setRealBalance] = useState<string>('');
    const [difference, setDifference] = useState<number>(0);

    // Resetear form al abrir
    useEffect(() => {
        if (isOpen) {
            setRealBalance(currentBalance.toString());
            setDifference(0);
        }
    }, [isOpen, currentBalance]);

    // Calcular diferencia en tiempo real
    useEffect(() => {
        const rb = parseFloat(realBalance);
        if (!isNaN(rb)) {
            setDifference(rb - currentBalance);
        } else {
            setDifference(0);
        }
    }, [realBalance, currentBalance]);

    const handleSave = () => {
        const rb = parseFloat(realBalance);
        if (!isNaN(rb) && difference !== 0) {
            onConfirm(difference, rb);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('bal.adjust.title') || "Ajuste de Saldo"} size="sm" icon={<Calculator size={20} />}>
            <div className="space-y-6">
                <div className="bg-[var(--background-secondary)] p-4 rounded-xl border border-[var(--background-modifier-border)] text-center">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">{t('bal.adjust.account') || "Cuenta a Ajustar"}</div>
                    <div className="text-lg font-black text-[var(--text-normal)]">{accountName}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2">{t('bal.adjust.sys_balance') || "Saldo Actual (Sistema)"}</div>
                        <div className="text-xl font-mono font-bold text-[var(--text-normal)] opacity-70">
                            {format(currentBalance, baseCurrency as any)}
                        </div>
                    </div>
                    <div className="flex justify-center text-[var(--text-muted)]">
                        <ArrowRight size={20} />
                    </div>
                </div>

                <div>
                    <NumericInput
                        label={t('bal.adjust.real_balance') || "Saldo Real"}
                        value={realBalance}
                        onValueChange={v => setRealBalance(v)}
                        currency={baseCurrency}
                        autoFocus
                    />
                </div>

                {difference !== 0 && (
                    <div className={`p-4 rounded-xl border flex gap-3 text-sm ${difference > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                        <div className="shrink-0 mt-0.5"><AlertCircle size={16} /></div>
                        <div>
                            <span className="font-bold block mb-1">
                                {difference > 0 ? (t('bal.adjust.diff_pos') || "Diferencia Positiva (Ingreso):") : (t('bal.adjust.diff_neg') || "Diferencia Negativa (Gasto):")}
                            </span>
                            <span className="font-mono font-black text-lg">
                                {difference > 0 ? '+' : ''}{format(difference, baseCurrency as any)}
                            </span>
                            <div className="text-xs opacity-80 mt-1">
                                {t('bal.adjust.explain') || "Se registrará una transacción en el Diario como 'Ajuste de Saldo' para cuadrar tus cuentas."}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose}>{t('btn.cancel')}</Button>
                <Button onClick={handleSave} disabled={difference === 0 || isNaN(parseFloat(realBalance))}>
                    {t('btn.confirm') || "Aplicar Ajuste"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
