// src/components/ui/QuickEntry.tsx
import React, { useState, useEffect } from 'react';
import { Terminal, ArrowRight, ShoppingCart, Banknote, Wallet, Tag, Repeat, ChevronDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { parseQuickEntry, parseAmountAndDescription } from '../../logic/quickEntryParser';
import { useTranslation } from '../../hooks/useTranslation';
import { useBalances } from '../../hooks/useBalances';
import { useCurrency } from '../../hooks/useCurrency';
import { Ledger } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { Notice } from 'obsidian';
import { SelectStyled } from './SelectStyled';

export const QuickEntry: React.FC = () => {
    const { state, dispatch, saveDataNow } = useFinance();
    const { t } = useTranslation();
    const { balances } = useBalances();
    const { convert } = useCurrency();
    const { categoryRegistry, accountRegistry, baseCurrency } = state;

    const [input, setInput] = useState('');
    const [type, setType] = useState<Ledger.TransactionType>(Ledger.TransactionType.EXPENSE);
    const [fromId, setFromId] = useState(accountRegistry[0]?.id || '');
    const [toId, setToId] = useState('');
    const [categoryId, setCategoryId] = useState<'auto' | string>('auto');

    // Sync default account
    useEffect(() => {
        if (!fromId && accountRegistry.length > 0) setFromId(accountRegistry[0].id);
    }, [accountRegistry]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processEntry();
        }
    };

    const toggleType = () => {
        const sequence = [Ledger.TransactionType.EXPENSE, Ledger.TransactionType.INCOME, Ledger.TransactionType.TRANSFER];
        const nextIndex = (sequence.indexOf(type) + 1) % sequence.length;
        setType(sequence[nextIndex]);
    };

    const processEntry = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        let finalAmount = 0;
        let finalDescription = '';
        let finalCategoryId = '';
        let finalCategoryName = '';

        if (categoryId === 'auto' && type !== Ledger.TransactionType.TRANSFER) {
            const parseResult = parseQuickEntry(trimmedInput, categoryRegistry);
            if (!parseResult) {
                new Notice("⚠️ FORMATO: [VALOR] [CATEGORIA] [DETALLE]");
                return;
            }
            finalAmount = parseResult.amount;
            finalDescription = parseResult.description;
            finalCategoryId = parseResult.categoryId || '';
            finalCategoryName = parseResult.categoryName || '';
        } else {
            const parseAmountResult = parseAmountAndDescription(trimmedInput);
            if (!parseAmountResult) {
                new Notice("⚠️ FORMATO: [VALOR] [DETALLE]");
                return;
            }
            finalAmount = parseAmountResult.amount;
            finalDescription = parseAmountResult.description;
            
            if (type === Ledger.TransactionType.TRANSFER) {
                finalCategoryId = 'System';
                finalCategoryName = 'Traslado';
            } else {
                finalCategoryId = categoryId;
                finalCategoryName = categoryRegistry.find(c => c.id === categoryId)?.name || 'General';
            }
        }

        if (!finalCategoryId) {
            new Notice("❌ Categoría no encontrada");
            return;
        }

        const fromAccount = accountRegistry.find(a => a.id === fromId);
        const toAccount = type === Ledger.TransactionType.TRANSFER ? accountRegistry.find(a => a.id === toId) : null;

        if (!fromAccount) {
            new Notice("❌ Selecciona cuenta origen");
            return;
        }
        if (type === Ledger.TransactionType.TRANSFER && !toAccount) {
            new Notice("❌ Selecciona cuenta destino");
            return;
        }

        // ============================================
        // 👉 PROTECCIÓN CONTRA SALDOS NEGATIVOS 👈
        // ============================================
        if (type === Ledger.TransactionType.EXPENSE || type === Ledger.TransactionType.TRANSFER) {
            const accountBalanceObj = balances[fromId] as any;
            
            // Convertir cada divisa a base y sumar para saldo real disponible
            let currentBalanceBase = 0;
            if (accountBalanceObj) {
                Object.entries(accountBalanceObj).forEach(([curr, amt]: any) => {
                    currentBalanceBase += convert(Number(amt) || 0, curr, baseCurrency);
                });
            }
            
            // Bloquear si: ya tiene saldo negativo, O si el monto supera el disponible
            if (currentBalanceBase <= 0 || finalAmount > currentBalanceBase) {
                const disponible = Math.max(0, currentBalanceBase);
                const faltante = (finalAmount - disponible).toLocaleString('es-CO', { maximumFractionDigits: 0 });
                new Notice(`⚠️ Saldo insuficiente en "${fromAccount.name}". Faltan $${faltante} ${baseCurrency}.`);
                return; // ⛔ Abortar registro
            }
        }
        // ============================================

        const newTransaction: Ledger.Transaction = {
            id: generateUUID(),
            date: new Date().toISOString().slice(0, 10),
            type: type,
            amount: finalAmount,
            currency: fromAccount.currency || baseCurrency,
            areaId: finalCategoryId,
            area: finalCategoryName,
            fromId: fromAccount.id,
            from: fromAccount.name,
            toId: toAccount?.id || '',
            to: toAccount?.name || '',
            note: finalDescription,
            amountBase: finalAmount,
            exchangeRateSnapshot: 1,
            status: 'cleared'
        };

        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        await saveDataNow();
        
        new Notice(`✅ ${finalAmount} registrado`);
        setInput('');
    };

    const typeThemes: Record<string, { bg: string, text: string, icon: any, label: string }> = {
        [Ledger.TransactionType.EXPENSE]: { bg: 'bg-rose-500', text: 'text-white', icon: <ShoppingCart size={12} strokeWidth={3} />, label: 'Gasto' },
        [Ledger.TransactionType.INCOME]: { bg: 'bg-emerald-500', text: 'text-white', icon: <Banknote size={12} strokeWidth={3} />, label: 'Ingreso' },
        [Ledger.TransactionType.TRANSFER]: { bg: 'bg-amber-500', text: 'text-white', icon: <Repeat size={12} strokeWidth={3} />, label: 'Traslado' }
    };

    const theme = typeThemes[type] || typeThemes[Ledger.TransactionType.EXPENSE];

    return (
        <div className="flex items-center gap-2 p-1 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-full shadow-lg backdrop-blur-md w-full focus-within:border-[var(--interactive-accent)] transition-all max-w-2xl mx-auto">
            
            {/* 1. PILL DE TIPO */}
            <button 
                onClick={toggleType}
                className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-full transition-all shrink-0 hover:brightness-110 active:scale-95 shadow-md ${theme.bg} ${theme.text}`}
            >
                {theme.icon}
                <span className="text-[10px] font-black uppercase tracking-[0.1em] hidden md:block">
                    {theme.label}
                </span>
            </button>

            {/* 2. SELECTOR DE CUENTA */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--background-secondary)]/50 rounded-lg border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)]/50 transition-colors shrink-0">
                <Wallet size={12} className="text-[var(--text-muted)]" />
                <SelectStyled 
                    variant="compact"
                    value={fromId} 
                    onChange={(val) => setFromId(val)}
                    options={accountRegistry.map(acc => ({ value: acc.id, label: acc.name }))}
                    className="bg-transparent border-none p-0 text-[10px] font-bold tracking-tight text-[var(--text-normal)] outline-none min-w-[70px] cursor-pointer"
                />
            </div>

            {/* SI ES TRASLADO: SELECTOR DESTINO */}
            {type === Ledger.TransactionType.TRANSFER && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/5 rounded-lg border border-amber-500/20 hover:border-amber-500/50 transition-colors shrink-0 animate-in slide-in-from-left-2 shadow-sm">
                    <ArrowRight size={12} className="text-amber-500" />
                    <SelectStyled 
                        variant="compact"
                        value={toId} 
                        onChange={(val) => setToId(val)}
                        options={[
                            { value: '', label: 'Destino' },
                            ...accountRegistry.filter(a => a.id !== fromId).map(acc => ({ value: acc.id, label: acc.name }))
                        ]}
                        className="bg-transparent border-none p-0 text-[10px] font-bold tracking-tight text-[var(--text-normal)] outline-none min-w-[70px] cursor-pointer"
                    />
                </div>
            )}

            {/* 3. SELECTOR DE CATEGORIA (OCULTO EN TRASLADOS) */}
            {type !== Ledger.TransactionType.TRANSFER && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--background-secondary)]/50 rounded-lg border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)]/50 transition-colors shrink-0">
                    <Tag size={12} className="text-[var(--text-muted)]" />
                    <SelectStyled 
                        variant="compact"
                        value={categoryId} 
                        onChange={(val) => {
                            setCategoryId(val);
                            if (val !== 'auto') {
                                const selectedCat = categoryRegistry.find(c => c.id === val);
                                if (selectedCat && selectedCat.type && selectedCat.type !== 'mixed') {
                                    setType(selectedCat.type as Ledger.TransactionType);
                                }
                            }
                        }}
                        options={[
                            { value: 'auto', label: 'AUTO' },
                            ...categoryRegistry.map(cat => ({ value: cat.id, label: cat.name }))
                        ]}
                        className="bg-transparent border-none p-0 text-[10px] font-bold tracking-tight text-[var(--text-normal)] outline-none min-w-[80px] cursor-pointer"
                    />
                </div>
            )}

            {/* 4. SEPARADOR VISUAL SUTIL */}
            <div className="h-4 w-[1px] bg-[var(--background-modifier-border)] opacity-50 shrink-0" />

            {/* 5. INPUT DE CONSOLA */}
            <div className="flex-1 flex items-center gap-2 px-2 overflow-hidden">
                <Terminal size={12} className="text-[var(--text-faint)] shrink-0" />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        const val = e.target.value;
                        setInput(val);
                        // Auto-detect type if typing category
                        if (categoryId === 'auto' && type !== Ledger.TransactionType.TRANSFER) {
                             const parseResult = parseQuickEntry(val, categoryRegistry);
                             if (parseResult && parseResult.categoryId) {
                                  const c = categoryRegistry.find(cat => cat.id === parseResult.categoryId);
                                  if (c && c.type && c.type !== 'mixed') {
                                       setType(c.type as Ledger.TransactionType);
                                  }
                             }
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={categoryId === 'auto' ? "Monto Categoría Nota" : "Monto y Nota..."}
                    className="bg-transparent border-none outline-none w-full text-xs font-black text-[var(--text-normal)] placeholder:text-[var(--text-faint)] focus:ring-0 placeholder:font-normal placeholder:italic truncate"
                    autoComplete="off"
                />
            </div>

            {/* 6. ACCION: ENTER / REGISTRAR */}
            <button 
                onClick={processEntry}
                className="w-8 h-8 flex items-center justify-center bg-[var(--interactive-accent)] text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 mr-1"
                title="Registrar (Enter)"
            >
                <ArrowRight size={16} strokeWidth={3} />
            </button>
        </div>
    );
};
