import React, { useState, useEffect } from 'react';
import { Landmark, Wallet, Banknote, TrendingUp, TrendingDown, Settings2, Edit2, Trash2, X } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useFinanceData } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAccountActions } from '../../hooks/useAccountActions';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export const AccountGrid = ({ balances, onAccountClick, onAdjustBalance, isTransferMode, transferSource, smartROI }: any) => {
  const { format, baseCurrency, convert } = useCurrency();
  const { accountRegistry } = useFinanceData();
  const { t } = useTranslation();
  
  const { updateAccountDetails, deleteAccount, getDependencies } = useAccountActions();

  // --- Context Menu & Editing State ---
  // Only track WHICH card has the menu open
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  
  // Edit Overlay State
  const [editData, setEditData] = useState<{ id: string, name: string, currency: string, type: 'liquid' | 'invest' } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete State
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string, name: string, txCount: number } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, accId: string, _accInfo: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuId(accId);
  };

  const handleEditStart = (accId: string, accInfo: any) => {
    const isLockedRegex = /invest|inversión|cdt|stock|crypto|real_estate|propiedad/i.test(accInfo.name);
    setEditData({
      id: accId,
      name: accInfo.name,
      currency: accInfo.currency || baseCurrency,
      type: accInfo.type || (isLockedRegex ? 'invest' : 'liquid')
    });
    setEditError(null);
  };

  const handleEditSave = () => {
    if (!editData) return;
    const err = updateAccountDetails(editData.id, editData.name, editData.currency, editData.type);
    if (err) {
      setEditError(err);
      return;
    }
    setEditData(null);
    setEditError(null);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    const deps = getDependencies(name);
    setDeleteCandidate({ id, name, txCount: deps.total });
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) return;
    deleteAccount(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {Object.entries(balances).map(([accId, currMap]: any) => {
          const isSelected = transferSource === accId;

          const rawAccountInfo = accountRegistry.find(a => a.id === accId);
          const displayName = rawAccountInfo ? rawAccountInfo.name : accId;

          if (rawAccountInfo?.isArchived) return null;

          const totalAccBase = Object.entries(currMap).reduce((sum, [curr, amt]: any) =>
            sum + convert(amt, curr, baseCurrency), 0);

          const roi = smartROI(accId, totalAccBase);
          
          // Virtual account info for editing actions
          const accInfo = rawAccountInfo || { id: accId, name: displayName };
          const isLockedRegex = /invest|inversión|cdt|stock|crypto|real_estate|propiedad/i.test(displayName);
          const isInvest = rawAccountInfo?.type === 'invest' || (rawAccountInfo?.type == undefined && isLockedRegex);

          return (
            <div
              key={accId}
              onClick={() => { if (!editData) onAccountClick(accId); }}
              onKeyDown={(e) => { if (!editData && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAccountClick(accId); } }}
            onContextMenu={(e) => handleContextMenu(e, accId, accInfo)}
              tabIndex={editData ? -1 : 0}
              className={`group bg-[var(--background-secondary)] border p-6 rounded-[2rem] transition-all relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50
                ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : 'border-[var(--background-modifier-border)] hover:border-[var(--text-normal)]'}`}
            >
              {/* === EDIT OVERLAY === */}
              {editData?.id === accId && (
                <div 
                  className="absolute inset-0 z-20 bg-[var(--background-secondary)] p-5 flex flex-col gap-3 border-2 border-[var(--interactive-accent)] rounded-[2rem]"
                  onClick={e => e.stopPropagation()}
                >
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex justify-between items-center">
                    Editar Cuenta
                    <button onClick={() => setEditData(null)} className="hover:text-[var(--text-normal)]"><X size={14}/></button>
                  </h4>
                  
                  <input 
                    autoFocus
                    value={editData.name}
                    onChange={e => { setEditData({...editData, name: e.target.value}); setEditError(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); }}
                    className="font-black bg-[var(--background-modifier-form-field)] text-[var(--text-normal)] text-sm uppercase w-full rounded-xl px-3 py-2 outline-none border border-transparent focus:border-[var(--interactive-accent)]"
                    placeholder="Nombre"
                  />
                  
                  <div className="flex gap-2">
                    <select 
                      value={editData.currency}
                      onChange={e => setEditData({...editData, currency: e.target.value})}
                      className="flex-1 bg-[var(--background-modifier-form-field)] text-[var(--text-normal)] text-sm font-bold uppercase rounded-xl px-3 py-2 outline-none border border-transparent focus:border-[var(--interactive-accent)] cursor-pointer"
                    >
                      <option value={baseCurrency as string}>({baseCurrency}) Base</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    
                    <select 
                      value={editData.type}
                      onChange={e => setEditData({...editData, type: e.target.value as any})}
                      className="flex-1 bg-[var(--background-modifier-form-field)] text-[var(--text-normal)] text-sm font-bold uppercase rounded-xl px-3 py-2 outline-none border border-transparent focus:border-[var(--interactive-accent)] cursor-pointer"
                    >
                      <option value="liquid">Líquido</option>
                      <option value="invest">Inversión</option>
                    </select>
                  </div>

                  {editError && <span className="text-[10px] text-rose-500 font-bold -mt-1">{editError}</span>}

                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => setEditData(null)}
                      className="flex-1 py-1.5 text-xs font-bold uppercase rounded-xl bg-[var(--background-modifier-form-field)] hover:bg-[var(--background-modifier-border)] text-[var(--text-muted)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleEditSave}
                      className="flex-1 py-1.5 text-xs font-bold uppercase rounded-xl bg-[var(--interactive-accent)] text-[var(--text-on-accent)] transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Botones Flotantes (Edit & Adjust) */}
              {!isTransferMode && !editData && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditStart(accId, accInfo); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleEditStart(accId, accInfo); } }}
                    className="p-2 bg-[var(--background-modifier-form-field)] hover:bg-[var(--interactive-accent)] focus:bg-[var(--interactive-accent)] text-[var(--text-muted)] hover:text-[var(--text-on-accent)] focus:text-[var(--text-on-accent)] focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
                    title="Editar Cuenta"
                    aria-label="Editar Cuenta"
                  >
                    <Edit2 size={16} />
                  </button>
                  {onAdjustBalance && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAdjustBalance(accId, displayName, totalAccBase); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onAdjustBalance(accId, displayName, totalAccBase); } }}
                      className="p-2 bg-[var(--background-modifier-form-field)] hover:bg-[var(--interactive-accent)] focus:bg-[var(--interactive-accent)] text-[var(--text-muted)] hover:text-[var(--text-on-accent)] focus:text-[var(--text-on-accent)] focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
                      title={t('bal.adjust.btn_title') || "Ajustar Saldo Real"}
                      aria-label="Ajustar Saldo Real"
                    >
                      <Settings2 size={16} />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6 relative">
                <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center border border-[var(--background-modifier-border)] ${isSelected ? 'bg-amber-500 text-white' : 'bg-[var(--background-primary)] text-[var(--text-muted)]'}`}>
                  {displayName.toLowerCase().includes('cash') || displayName.toLowerCase().includes('efectivo') ? <Banknote size={20} /> : <Landmark size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[var(--text-normal)] text-lg uppercase truncate">{displayName}</h3>

                  {/* Visual Indicator for Liquidity Status */}
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)] mt-1">
                    {isInvest ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span>{t('bal.grid.type.invest') || 'Inversión'}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{t('bal.grid.type.liquid') || 'Líquido'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-3xl font-mono font-black tracking-tighter">
                {format(totalAccBase, baseCurrency)}
              </div>

              {roi !== null && (
                <div className={`flex items-center gap-1 text-[10px] font-bold mt-2 ${roi >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {roi >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {t('bal.grid.real_roi', { val: roi.toFixed(1) })}
                </div>
              )}

              {/* Context Menu — rendered inside the card, anchored bottom-right */}
              {contextMenuId === accId && (
                <div
                  className="absolute bottom-4 right-4 z-30 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl py-1 w-36 shadow-2xl animate-in fade-in zoom-in-95"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="w-full text-left px-3 py-2 text-xs font-bold text-[var(--text-normal)] hover:bg-[var(--background-modifier-hover)] flex items-center gap-2 rounded-t-xl"
                    onClick={() => { handleEditStart(accId, accInfo); setContextMenuId(null); }}
                  >
                    <Edit2 size={13} className="text-[var(--text-muted)]" /> Editar
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 rounded-b-xl"
                    onClick={() => { handleDeleteRequest(accId, displayName); setContextMenuId(null); }}
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN ── */}
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
    </>
  );
};