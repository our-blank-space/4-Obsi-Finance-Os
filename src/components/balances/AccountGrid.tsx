import React from 'react';
import { Landmark, Wallet, Banknote, TrendingUp, TrendingDown, Settings2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useFinanceData } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';

export const AccountGrid = ({ balances, onAccountClick, onAdjustBalance, isTransferMode, transferSource, smartROI }: any) => {
  const { format, baseCurrency, convert } = useCurrency();
  const { accountRegistry } = useFinanceData();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(balances).map(([accId, currMap]: any) => {
        const isSelected = transferSource === accId;

        // BUSCAR EL NOMBRE REAL USANDO EL ID
        const accountInfo = accountRegistry.find(a => a.id === accId);
        const displayName = accountInfo ? accountInfo.name : accId; // Fallback al ID si no existe

        if (accountInfo?.isArchived) return null;

        // Sumar todo en moneda base para el card
        const totalAccBase = Object.entries(currMap).reduce((sum, [curr, amt]: any) =>
          sum + convert(amt, curr, baseCurrency), 0);

        const roi = smartROI(accId, totalAccBase);

        return (
          <div
            key={accId}
            onClick={() => onAccountClick(accId)}
            className={`group bg-[var(--background-secondary)] border p-6 rounded-[2rem] transition-all relative overflow-hidden cursor-pointer
              ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : 'border-[var(--background-modifier-border)] hover:border-[var(--text-normal)]'}`}
          >
            {/* Botón Flotante para Ajuste de Saldo */}
            {!isTransferMode && onAdjustBalance && (
              <button
                onClick={(e) => { e.stopPropagation(); onAdjustBalance(accId, displayName, totalAccBase); }}
                className="absolute top-4 right-4 p-2 bg-[var(--background-modifier-form-field)] hover:bg-[var(--interactive-accent)] text-[var(--text-muted)] hover:text-[var(--text-on-accent)] rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                title={t('bal.adjust.btn_title') || "Ajustar Saldo Real"}
              >
                <Settings2 size={16} />
              </button>
            )}

            <div className="flex items-center gap-4 mb-6 relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-[var(--background-modifier-border)] ${isSelected ? 'bg-amber-500 text-white' : 'bg-[var(--background-primary)] text-[var(--text-muted)]'}`}>
                {displayName.toLowerCase().includes('cash') || displayName.toLowerCase().includes('efectivo') ? <Banknote size={20} /> : <Landmark size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-[var(--text-normal)] text-lg uppercase truncate">{displayName}</h3>

                {/* Visual Indicator for Liquidity Status */}
                {(() => {
                  const isLocked = /invest|inversión|cdt|stock|crypto|real_estate|propiedad/i.test(displayName);
                  return (
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)] mt-1">
                      {isLocked ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          <span>{t('bal.grid.type.invest')}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{t('bal.grid.type.liquid')}</span>
                        </>
                      )}
                    </div>
                  );
                })()}
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
          </div>
        );
      })}
    </div>
  );
};