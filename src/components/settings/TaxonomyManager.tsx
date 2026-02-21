import React, { useState } from 'react';
import {
    Edit2, Trash2, AlertTriangle, Save, X,
    GitMerge, CheckCircle2, FolderCog
} from 'lucide-react';
import { useTaxonomy } from '../../hooks/useTaxonomy';
import { useTranslation } from '../../hooks/useTranslation';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Props {
    title: string;
    items: string[];
    type: 'account' | 'area';
    onAdd: (val: string) => void;
    onRemove?: (val: string) => void;
}

export const TaxonomyManager: React.FC<Props> = ({ title, items, type, onAdd, onRemove }) => {
    const { renameEntity, deleteEntity, checkDependencies } = useTaxonomy();
    const { t } = useTranslation();

    // Estados UI
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deleteCandidate, setDeleteCandidate] = useState<{ name: string, count: number } | null>(null);
    const [mergeCandidate, setMergeCandidate] = useState<{ source: string, target: string } | null>(null);

    const handleStartEdit = (item: string) => {
        setEditingItem(item);
        setRenameValue(item);
    };

    const handleConfirmRename = () => {
        if (editingItem && renameValue && renameValue !== editingItem) {
            // Si el nombre nuevo ya existe, es una FUSIÓN (Merge)
            const isMerge = items.includes(renameValue);
            if (isMerge) {
                setMergeCandidate({ source: editingItem, target: renameValue });
                return;
            } else {
                renameEntity(type, editingItem, renameValue);
            }
        }
        setEditingItem(null);
    };

    const executeMerge = () => {
        if (mergeCandidate) {
            renameEntity(type, mergeCandidate.source, mergeCandidate.target);
            deleteEntity(type, mergeCandidate.source);
            setMergeCandidate(null);
            setEditingItem(null);
        }
    };

    const handleRequestDelete = (item: string) => {
        // Always use ConfirmDialog for consistent UI
        if (onAdd && onRemove) { // Custom logic mode (for Asset Types)
            setDeleteCandidate({ name: item, count: 0 }); // count: 0 = simple deletion
            return;
        }

        const deps = checkDependencies(type, item);
        setDeleteCandidate({ name: item, count: deps.total });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--background-modifier-border)] text-[var(--interactive-accent)]">
                <FolderCog size={16} />
                <span className="text-sm font-bold text-[var(--text-normal)]">{title}</span>
            </div>

            {/* Input de Agregar */}
            <div className="flex gap-2">
                <Input
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    placeholder={type === 'account' ? t('taxonomy.new_account') : t('taxonomy.new_category')}
                    className="h-9 text-xs"
                />
                <Button
                    onClick={() => { if (newItem) { onAdd(newItem); setNewItem(''); } }}
                    disabled={!newItem}
                    size="sm"
                >
                    {t('btn.add_caps')}
                </Button>
            </div>

            {/* Lista Inteligente */}
            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map(item => {
                    const isEditing = editingItem === item;

                    if (isEditing) {
                        return (
                            <div key={item} className="flex items-center gap-1 bg-[var(--background-primary)] border border-[var(--interactive-accent)] rounded-lg p-1 animate-in zoom-in-95">
                                <input
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    className="bg-transparent text-xs font-bold outline-none w-32 px-2"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleConfirmRename();
                                        if (e.key === 'Escape') setEditingItem(null);
                                    }}
                                />
                                <button onClick={handleConfirmRename} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"><Save size={12} /></button>
                                <button onClick={() => setEditingItem(null)} className="p-1 text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10 rounded"><X size={12} /></button>
                            </div>
                        );
                    }

                    return (
                        <div key={item} className="group flex items-center gap-2 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:border-[var(--text-normal)] transition-all">
                            {item}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-l border-[var(--background-modifier-border)] pl-2 ml-1">
                                <button
                                    onClick={() => handleStartEdit(item)}
                                    className="text-[var(--text-muted)] hover:text-[var(--interactive-accent)] transition-colors"
                                    title={t('taxonomy.rename_merge')}
                                >
                                    <Edit2 size={10} />
                                </button>
                                <button
                                    onClick={() => handleRequestDelete(item)}
                                    className="text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                                    title={t('taxonomy.delete_btn')}
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Diálogo de Fusión */}
            <ConfirmDialog
                isOpen={!!mergeCandidate}
                onClose={() => setMergeCandidate(null)}
                onConfirm={executeMerge}
                title={t('taxonomy.confirm_merge')}
                description={t('taxonomy.merge_desc')
                    .replace('{target}', mergeCandidate?.target || '')
                    .replace('{source}', mergeCandidate?.source || '')
                    .replace('{target}', mergeCandidate?.target || '')} // Replace twice if needed? No, logic is fine.
                confirmText={t('taxonomy.merge_btn')}
                intent="execute_trade"
            />

            {/* Diálogo de Eliminación */}
            <ConfirmDialog
                isOpen={!!deleteCandidate}
                onClose={() => setDeleteCandidate(null)}
                onConfirm={() => {
                    if (!deleteCandidate) return;

                    // Check if simple deletion or with dependencies
                    if (deleteCandidate.count === 0) {
                        // Simple deletion
                        if (onRemove) {
                            onRemove(deleteCandidate.name);
                        } else {
                            deleteEntity(type, deleteCandidate.name);
                        }
                    } else {
                        // Forced deletion
                        deleteEntity(type, deleteCandidate.name);
                    }
                    setDeleteCandidate(null);
                }}
                title={deleteCandidate?.count === 0 ? t('taxonomy.confirm_delete') : t('taxonomy.delete_warn')}
                description={
                    deleteCandidate?.count === 0
                        ? t('taxonomy.delete_simple_desc').replace('{name}', deleteCandidate?.name || '')
                        : t('taxonomy.delete_complex_desc')
                            .replace('{name}', deleteCandidate?.name || '')
                            .replace('{count}', deleteCandidate?.count.toString() || '0')
                }
                confirmText={deleteCandidate?.count === 0 ? t('taxonomy.delete_btn') : t('taxonomy.confirm_delete_btn')}
                cancelText={deleteCandidate?.count === 0 ? t('btn.cancel') : t('btn.cancel')}
                variant="danger"
            />
        </div>
    );
};
