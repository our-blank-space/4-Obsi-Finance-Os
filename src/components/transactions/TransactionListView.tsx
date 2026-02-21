import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, FinanceAccount, FinanceCategory } from '../../types';
import { TransactionFiltersSection } from './TransactionFiltersSection';
import { TransactionChartSection } from './TransactionChartSection';
import { TransactionListSection } from './TransactionListSection';
import { TransactionFormModal } from '../modals/TransactionFormModal';
import { HeaderSection } from './HeaderSection';
import { X, Calendar } from 'lucide-react';
import { useTransactionAnalytics } from '../../hooks/ui/useTransactionAnalytics';
import { useTranslation } from '../../hooks/useTranslation';
import { YearSelector } from '../common/YearSelector';

import { ConfirmationModal } from '../modals/ConfirmationModal';

interface TransactionListViewProps {
  analytics: ReturnType<typeof useTransactionAnalytics>;
  accounts: FinanceAccount[];
  areas: FinanceCategory[];
  className?: string;
  onAddTransaction: (tx: Transaction) => Promise<void>;
  onUpdateTransaction: (tx: Transaction) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}


export const TransactionListView: React.FC<TransactionListViewProps> = ({
  analytics,
  accounts,
  areas,
  className,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { filters, setFilters, filtered, stats, chartData, feedback } = analytics;

  // Detectar filtro de fecha activo
  const isDateFilterActive = useMemo(() => {
    return !!filters.search && filters.search.trim().length > 0;
  }, [filters.search]);

  // Formateador de fecha seguro y localizado
  const { language } = useTranslation();
  const formatDateForDisplay = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T12:00:00`);
    const locale = language === 'es' ? 'es-CO' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short', day: 'numeric', month: 'short'
    }).format(date);
  }, [language]);

  const handleClearDateFilter = useCallback(() => {
    const currentYear = new Date().getFullYear().toString();
    setFilters({
      ...filters,
      search: '',
      time: 'thisMonth',
      // Resetear al año actual si estaba filtrando por otro año/fecha
      // Esto asume que el filtro de año usa 'search' o un mecanismo similar
    });
  }, [filters, setFilters]);

  // Manejador Robusto de Guardado (Create)
  const handleAddTransaction = useCallback(async (newTransaction: Transaction) => {
    try {
      setIsSubmitting(true);
      await onAddTransaction(newTransaction);
      setIsFormOpen(false);
    } catch (error) {
      console.error('[FinanceOS] Failed to add transaction:', error);
      // Modal permanece abierto para reintentar
    } finally {
      setIsSubmitting(false);
    }
  }, [onAddTransaction]);

  // Manejador Robusto de Actualización (Update)
  const handleUpdateTransaction = useCallback(async (updatedTransaction: Transaction) => {
    try {
      setIsSubmitting(true);
      await onUpdateTransaction(updatedTransaction);
      setEditingTransaction(null);
    } catch (error) {
      console.error('[FinanceOS] Failed to update transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onUpdateTransaction]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteCandidate) {
      try {
        await onDeleteTransaction(deleteCandidate);
        setDeleteCandidate(null);
      } catch (error) {
        console.error('[FinanceOS] Failed to delete transaction:', error);
      }
    }
  }, [deleteCandidate, onDeleteTransaction]);

  const handleCloseModal = useCallback(() => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingTransaction(null);
    }
  }, [isSubmitting]);

  return (
    <div className={`flex flex-col h-full space-y-4 p-4 sm:p-0 font-sans ${className || ''}`}>

      {/* 1. Header con Resumen y Selector de Año */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <HeaderSection
            feedback={feedback}
            onAddClick={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
          />
        </div>
        <div className="hidden sm:block pt-1">
          <YearSelector onYearSelected={(year) => {
            const isCurrentYear = year === new Date().getFullYear().toString();
            setFilters({
              ...filters,
              time: isCurrentYear ? 'thisMonth' : 'all',
              search: isCurrentYear ? '' : year
            });
          }} />
        </div>
      </div>

      {/* 2. Gráfico */}
      <TransactionChartSection data={chartData} />

      {/* 2.5 Indicador de filtro por fecha activo (Internacionalizado) */}
      {isDateFilterActive && (
        <div className="flex items-center justify-between bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-sky-400">
            <Calendar size={14} />
            <span className="text-xs font-bold">
              {/^\d{4}-\d{2}-\d{2}$/.test(filters.search)
                ? t('filters.showing_date').replace('{date}', formatDateForDisplay(filters.search))
                : t('filters.showing_text').replace('{text}', filters.search)
              }
            </span>
            <span className="text-xs text-sky-400/70 hidden sm:inline">
              {t('filters.count').replace('{n}', String(filtered.length))}
            </span>
          </div>
          <button
            onClick={handleClearDateFilter}
            className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-xs font-bold transition-all"
          >
            <X size={12} />
            {t('filters.view_all')}
          </button>
        </div>
      )}

      {/* 3. Filtros */}
      <TransactionFiltersSection
        filters={filters}
        setFilters={setFilters}
        accounts={accounts}
        areas={areas}
        isFiltersVisible={isFiltersVisible}
        setIsFiltersVisible={setIsFiltersVisible}
      />

      {/* 4. Lista Principal */}
      <TransactionListSection
        transactions={filtered}
        stats={stats}
        onEdit={(transaction) => setEditingTransaction(transaction)}
        onDelete={(id) => setDeleteCandidate(id)}
        onClearFilters={() =>
          setFilters({
            search: '',
            type: 'all',
            time: 'thisMonth',
            area: 'all',
            account: 'all',
          })
        }
      />

      {/* 5. Modal de Edición/Creación */}
      <TransactionFormModal
        isOpen={isFormOpen || !!editingTransaction}
        onClose={handleCloseModal}
        transaction={editingTransaction}
        accounts={accounts}
        areas={areas}
        onSave={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
      />

      {/* 6. Modal de Confirmación de Borrado */}
      <ConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDelete}
        title={t('logs.delete_confirm.title')}
        message={
          deleteCandidate ? (
            <>
              {t('logs.delete_confirm.message')}<br />
              <span className="font-bold block mt-2 p-2 bg-[var(--background-secondary)] rounded-md border border-[var(--background-modifier-border)]">
                {(() => {
                  const tx = filtered.find(t => t.id === deleteCandidate);
                  return tx ? `${tx.note || t('logs.no_desc')} - ${new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}` : '...';
                })()}
              </span>
            </>
          ) : ""
        }
        confirmText={t('btn.delete')}
        isDangerous={true}
      />
    </div>
  );
};