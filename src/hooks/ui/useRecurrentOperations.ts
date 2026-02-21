import { useState, useCallback } from 'react';
import { RecurrentTransaction, Transaction } from '../../types';
import { useCurrency } from '../useCurrency';
import { DateUtils } from '../../utils/date';

interface UseRecurrentOperationsProps {
    onUpdate: (items: RecurrentTransaction[]) => void;
    onExecuteTransaction: (t: RecurrentTransaction, amount?: number) => void;
    recurrents: RecurrentTransaction[];
}

export const useRecurrentOperations = ({
    onUpdate,
    onExecuteTransaction,
    recurrents
}: UseRecurrentOperationsProps) => {

    // --- STATE: Modales ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurrentTransaction | null>(null);

    // --- STATE: Ejecución Variable ---
    const [variableExecItem, setVariableExecItem] = useState<RecurrentTransaction | null>(null);

    // --- HANDLERS: CRUD ---
    const openNew = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const openEdit = (item: RecurrentTransaction) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        const filtered = recurrents.filter(r => r.id !== id);
        onUpdate(filtered);
    };

    const handleSave = (item: RecurrentTransaction) => {
        if (editingItem) {
            // Update existing
            onUpdate(recurrents.map(r => r.id === item.id ? item : r));
        } else {
            // Create new
            onUpdate([...recurrents, item]);
        }
        setIsFormOpen(false);
        setEditingItem(null);
    };

    const toggleStatus = (id: string) => {
        onUpdate(recurrents.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    };

    // --- HANDLERS: EXECUTION ---

    // El punto de entrada principal para ejecutar una suscripción
    const requestExecution = useCallback((rec: RecurrentTransaction) => {
        if (rec.isVariable) {
            // Si es variable (ej: Luz), abrimos modal para pedir monto exacto
            setVariableExecItem(rec);
        } else {
            // Si es fija (ej: Netflix), ejecutamos directo
            confirmExecution(rec, rec.amount);
        }
    }, [recurrents]);

    // Simplified execution delegates to parent/Factory
    const confirmExecution = (rec: RecurrentTransaction, finalAmount?: number) => {
        onExecuteTransaction(rec, finalAmount);
        setVariableExecItem(null);
    };

    return {
        // State
        isFormOpen,
        editingItem,
        variableExecItem,

        // Actions UI
        closeForm: () => setIsFormOpen(false),
        closeVariableExec: () => setVariableExecItem(null),

        // Operations
        openNew,
        openEdit,
        handleDelete,
        handleSave,
        toggleStatus,
        requestExecution,
        confirmExecution
    };
};