// src/components/balances/AccountManager.tsx
//
// Componente CRUD para gestión de cuentas financieras.
// Soporta: Crear, Renombrar (Inline Editing), Archivar/Eliminar.
// Patrón optimista: el estado se actualiza en el reducer del Context antes
// de la persistencia, garantizando feedback inmediato (<16ms).

import React, { useState, useRef, useCallback, useTransition } from 'react';
import {
    Plus, Trash2, Edit2, Save, X, Landmark,
    ChevronDown, ChevronUp, Archive, ArchiveRestore
} from 'lucide-react';
import { useFinanceData, useFinanceDispatch } from '../../context/FinanceContext';
import { useTaxonomy } from '../../hooks/useTaxonomy';
import { useTranslation } from '../../hooks/useTranslation';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { FinanceAccount } from '../../types/core';

// ─────────────────────────────────────────────
// 1. TIPOS
// ─────────────────────────────────────────────

interface DeleteCandidate {
    id: string;
    name: string;
    txCount: number;
}

// ─────────────────────────────────────────────
// 2. HOOK: useAccountActions
// Encapsula la lógica de mutación — separada de la vista
// ─────────────────────────────────────────────

function useAccountActions() {
    const { accountRegistry, baseCurrency } = useFinanceData();
    const dispatch = useFinanceDispatch();
    const { renameEntity, checkDependencies } = useTaxonomy();

    /** CREATE — valida trim y unicidad */
    const createAccount = useCallback((name: string): string | null => {
        const trimmed = name.trim();
        if (!trimmed) return 'El nombre no puede estar vacío.';
        if (accountRegistry.some(a => a.name.toLowerCase() === trimmed.toLowerCase() && !a.isArchived)) {
            return 'Ya existe una cuenta con ese nombre.';
        }

        const newAccount: FinanceAccount = {
            id: crypto.randomUUID(),
            name: trimmed,
            currency: baseCurrency,
            isArchived: false,
        };

        // Optimistic dispatch — el reducer es síncrono, UI se actualiza en el mismo frame
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: { accountRegistry: [...accountRegistry, newAccount] },
        });

        return null; // null = sin errores
    }, [accountRegistry, baseCurrency, dispatch]);

    /** RENAME — usa renameEntity del useTaxonomy para migrar transacciones */
    const renameAccount = useCallback((oldName: string, newName: string): string | null => {
        const trimmed = newName.trim();
        if (!trimmed) return 'El nombre no puede estar vacío.';
        if (trimmed === oldName) return null; // Sin cambio, no error
        if (accountRegistry.some(a => a.name.toLowerCase() === trimmed.toLowerCase() && !a.isArchived)) {
            return 'Ya existe una cuenta con ese nombre.';
        }
        renameEntity('account', oldName, trimmed);
        return null;
    }, [accountRegistry, renameEntity]);

    /** ARCHIVE — soft delete (preserva historial) */
    const archiveAccount = useCallback((id: string) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                accountRegistry: accountRegistry.map(a =>
                    a.id === id ? { ...a, isArchived: true } : a
                ),
            },
        });
    }, [accountRegistry, dispatch]);

    /** RESTORE — desarchiva una cuenta */
    const restoreAccount = useCallback((id: string) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                accountRegistry: accountRegistry.map(a =>
                    a.id === id ? { ...a, isArchived: false } : a
                ),
            },
        });
    }, [accountRegistry, dispatch]);

    /** DELETE — eliminación permanente del registro */
    const deleteAccount = useCallback((id: string) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                accountRegistry: accountRegistry.filter(a => a.id !== id),
            },
        });
    }, [accountRegistry, dispatch]);

    /** Cuenta dependencias de transacciones (para advertencia de borrado) */
    const getDependencies = useCallback((name: string) => {
        return checkDependencies('account', name);
    }, [checkDependencies]);

    return { createAccount, renameAccount, archiveAccount, restoreAccount, deleteAccount, getDependencies };
}

// ─────────────────────────────────────────────
// 3. SUB-COMPONENTE: AccountRow
// ─────────────────────────────────────────────

interface AccountRowProps {
    account: FinanceAccount;
    onRename: (oldName: string, newName: string) => string | null;
    onArchive: (id: string) => void;
    onDelete: (candidate: DeleteCandidate) => void;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, onRename, onArchive, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(account.name);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [, startTransition] = useTransition();

    const startEdit = () => {
        setEditValue(account.name);
        setError(null);
        setIsEditing(true);
        // focus en el siguiente tick tras mount del input
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const commitEdit = () => {
        const err = onRename(account.name, editValue);
        if (err) {
            setError(err);
            return;
        }
        startTransition(() => setIsEditing(false));
        setError(null);
    };

    const cancelEdit = () => {
        setEditValue(account.name);
        setError(null);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commitEdit();
        if (e.key === 'Escape') cancelEdit();
    };

    if (account.isArchived) {
        return (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl opacity-50 hover:opacity-75 transition-opacity group">
                <span className="flex-1 text-xs font-medium text-[var(--text-muted)] line-through truncate">
                    {account.name}
                </span>
                <button
                    onClick={() => onArchive(account.id)} // Use as restore toggle
                    className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Restaurar cuenta"
                >
                    <ArchiveRestore size={12} />
                </button>
            </div>
        );
    }

    return (
        <div className={`
            group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150
            ${isEditing
                ? 'border-[var(--interactive-accent)] bg-[var(--background-modifier-form-field)] ring-1 ring-[var(--interactive-accent)]/30'
                : 'border-transparent hover:border-[var(--background-modifier-border)] hover:bg-[var(--background-modifier-hover)]'
            }
        `}>
            {/* ICONO */}
            <Landmark size={12} className="text-[var(--text-muted)] flex-shrink-0" />

            {/* NOMBRE — clicable para editar */}
            {isEditing ? (
                <div className="flex-1 min-w-0">
                    <input
                        ref={inputRef}
                        value={editValue}
                        onChange={e => { setEditValue(e.target.value); setError(null); }}
                        onKeyDown={handleKeyDown}
                        onBlur={commitEdit}
                        autoFocus
                        className="w-full bg-transparent text-sm font-semibold text-[var(--text-normal)] outline-none"
                        aria-label={`Renombrar cuenta ${account.name}`}
                    />
                    {error && (
                        <p className="text-[10px] text-[var(--text-error)] font-bold mt-0.5 animate-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}
                </div>
            ) : (
                <button
                    onClick={startEdit}
                    className="flex-1 min-w-0 text-left text-sm font-semibold text-[var(--text-normal)] truncate hover:text-[var(--interactive-accent)] transition-colors"
                    title="Clic para renombrar"
                    aria-label={`Renombrar ${account.name}`}
                >
                    {account.name}
                </button>
            )}

            {/* ACCIONES */}
            <div className={`flex items-center gap-0.5 flex-shrink-0 transition-all ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isEditing ? (
                    <>
                        <button
                            onMouseDown={e => e.preventDefault()} // Evita blur antes del click
                            onClick={commitEdit}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Guardar (Enter)"
                        >
                            <Save size={12} />
                        </button>
                        <button
                            onMouseDown={e => e.preventDefault()}
                            onClick={cancelEdit}
                            className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--background-modifier-border)] rounded-lg transition-colors"
                            title="Cancelar (Escape)"
                        >
                            <X size={12} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={startEdit}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--interactive-accent)] rounded-lg transition-colors"
                            title="Renombrar"
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            onClick={() => onArchive(account.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-amber-500 rounded-lg transition-colors"
                            title="Archivar (ocultar del balance)"
                        >
                            <Archive size={12} />
                        </button>
                        <button
                            onClick={() => onDelete({ id: account.id, name: account.name, txCount: 0 })}
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors"
                            title="Eliminar permanentemente"
                        >
                            <Trash2 size={12} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// 4. COMPONENTE PRINCIPAL: AccountManager
// ─────────────────────────────────────────────

interface AccountManagerProps {
    /** Mostrar panel expandido por defecto */
    defaultOpen?: boolean;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ defaultOpen = false }) => {
    const { accountRegistry } = useFinanceData();
    const { t } = useTranslation();
    const {
        createAccount,
        renameAccount,
        archiveAccount,
        restoreAccount,
        deleteAccount,
        getDependencies,
    } = useAccountActions();

    // ── UI State ──
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [newAccountName, setNewAccountName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<DeleteCandidate | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const newInputRef = useRef<HTMLInputElement>(null);

    // Cuentas separadas por estado
    const activeAccounts = accountRegistry.filter(a => !a.isArchived);
    const archivedAccounts = accountRegistry.filter(a => a.isArchived);

    // ── Handlers ──
    const handleCreate = useCallback(() => {
        const err = createAccount(newAccountName);
        if (err) {
            setCreateError(err);
            return;
        }
        setNewAccountName('');
        setCreateError(null);
        newInputRef.current?.focus();
    }, [newAccountName, createAccount]);

    const handleNewKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') { setNewAccountName(''); setCreateError(null); }
    };

    const handleDeleteRequest = useCallback((candidate: DeleteCandidate) => {
        const deps = getDependencies(candidate.name);
        setDeleteCandidate({ ...candidate, txCount: deps.total });
    }, [getDependencies]);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteCandidate) return;
        deleteAccount(deleteCandidate.id);
        setDeleteCandidate(null);
    }, [deleteCandidate, deleteAccount]);

    // Toggle archive/restore by id
    const handleArchiveToggle = useCallback((id: string) => {
        const acc = accountRegistry.find(a => a.id === id);
        if (!acc) return;
        if (acc.isArchived) restoreAccount(id);
        else archiveAccount(id);
    }, [accountRegistry, archiveAccount, restoreAccount]);

    return (
        <div className="rounded-2xl border border-[var(--background-modifier-border)] bg-[var(--background-secondary)] overflow-hidden transition-all duration-300">

            {/* ── HEADER ── */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--background-modifier-hover)] transition-colors"
                aria-expanded={isOpen}
                aria-controls="account-manager-body"
            >
                <div className="flex items-center gap-2.5">
                    <Landmark size={14} className="text-[var(--interactive-accent)]" />
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-normal)]">
                        Gestionar Cuentas
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--background-modifier-border)] text-[var(--text-muted)]">
                        {activeAccounts.length}
                    </span>
                </div>
                <div className="text-[var(--text-muted)]">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </button>

            {/* ── BODY ── */}
            {isOpen && (
                <div id="account-manager-body" className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">

                    {/* INPUT DE CREACIÓN — siempre visible */}
                    <div className="flex gap-2 pt-1">
                        <div className="flex-1 relative">
                            <input
                                ref={newInputRef}
                                id="account-manager-new-input"
                                value={newAccountName}
                                onChange={e => { setNewAccountName(e.target.value); setCreateError(null); }}
                                onKeyDown={handleNewKeyDown}
                                placeholder="Nueva cuenta… (Enter para agregar)"
                                className={`
                                    w-full h-9 px-3 rounded-xl text-sm font-medium outline-none transition-all
                                    bg-[var(--background-modifier-form-field)] text-[var(--text-normal)]
                                    placeholder:text-[var(--text-faint)]
                                    border ${createError
                                        ? 'border-[var(--text-error)] ring-1 ring-[var(--text-error)]/30 focus:ring-[var(--text-error)]/50'
                                        : 'border-[var(--background-modifier-border)] focus:border-[var(--interactive-accent)] focus:ring-1 focus:ring-[var(--interactive-accent)]/30'
                                    }
                                `}
                                aria-label="Nombre de nueva cuenta"
                                aria-describedby={createError ? 'account-create-error' : undefined}
                                autoComplete="off"
                            />
                            {createError && (
                                <p
                                    id="account-create-error"
                                    className="absolute -bottom-4 left-1 text-[10px] text-[var(--text-error)] font-bold animate-in slide-in-from-top-1"
                                >
                                    {createError}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={!newAccountName.trim()}
                            className="
                                h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-widest
                                bg-[var(--interactive-accent)] text-[var(--text-on-accent)]
                                hover:opacity-90 active:scale-95 transition-all
                                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                            "
                            title="Agregar cuenta (Enter)"
                            aria-label="Agregar nueva cuenta"
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Agregar</span>
                        </button>
                    </div>

                    {/* LISTA DE CUENTAS ACTIVAS */}
                    {activeAccounts.length === 0 ? (
                        <div className="text-center py-4 text-xs text-[var(--text-faint)] opacity-70">
                            Sin cuentas activas. Crea una arriba.
                        </div>
                    ) : (
                        <div className="space-y-0.5 mt-4">
                            {activeAccounts.map(account => (
                                <AccountRow
                                    key={account.id}
                                    account={account}
                                    onRename={renameAccount}
                                    onArchive={handleArchiveToggle}
                                    onDelete={handleDeleteRequest}
                                />
                            ))}
                        </div>
                    )}

                    {/* SECCIÓN ARCHIVADAS (colapsable) */}
                    {archivedAccounts.length > 0 && (
                        <div className="pt-2 border-t border-[var(--background-modifier-border)]">
                            <button
                                onClick={() => setShowArchived(v => !v)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-normal)] transition-colors w-full"
                            >
                                <Archive size={10} />
                                Archivadas ({archivedAccounts.length})
                                {showArchived ? <ChevronUp size={10} className="ml-auto" /> : <ChevronDown size={10} className="ml-auto" />}
                            </button>

                            {showArchived && (
                                <div className="mt-2 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                                    {archivedAccounts.map(account => (
                                        <AccountRow
                                            key={account.id}
                                            account={account}
                                            onRename={renameAccount}
                                            onArchive={handleArchiveToggle}
                                            onDelete={handleDeleteRequest}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── CONFIRM DIALOG: ELIMINAR ── */}
            <ConfirmDialog
                isOpen={!!deleteCandidate}
                onClose={() => setDeleteCandidate(null)}
                onConfirm={handleDeleteConfirm}
                intent="delete_record"
                title="Eliminar Cuenta"
                description={
                    deleteCandidate?.txCount && deleteCandidate.txCount > 0
                        ? `"${deleteCandidate?.name}" tiene ${deleteCandidate?.txCount} transacciones vinculadas. Eliminarla del registro no borrará esas transacciones, pero quedarán sin cuenta asignada. ¿Continuar?`
                        : `¿Eliminar permanentemente la cuenta "${deleteCandidate?.name}"? Esta acción no se puede deshacer.`
                }
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default AccountManager;
