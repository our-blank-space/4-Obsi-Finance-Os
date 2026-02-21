import { useMemo } from 'react';
import { Asset, Currency } from '../../types';
import { useCurrency } from '../useCurrency';
import { CurrencyMath } from '../../utils/math';

export const usePortfolioMath = (assets: Asset[]) => {
    const { toBase, baseCurrency } = useCurrency();

    return useMemo(() => {
        let totalInvested = 0;
        let totalValuation = 0;

        assets.forEach(asset => {
            // Sum all "outflows" as invested for now
            const investedRaw = (asset.transactions || [])
                .filter(e => ['cost', 'maintenance', 'improvement', 'tax'].includes(e.type))
                .reduce((sum, e) => CurrencyMath.add(sum, e.amount), 0) + (asset.purchasePrice || 0);

            const invested = toBase(investedRaw, asset.currency);

            // Valor actual o inversión si no se ha definido
            const valuationRaw = asset.currentValue || (asset.purchasePrice || 0);
            const valuation = toBase(valuationRaw, asset.currency);

            totalInvested = CurrencyMath.add(totalInvested, invested);
            totalValuation = CurrencyMath.add(totalValuation, valuation);
        });

        const totalPnL = CurrencyMath.subtract(totalValuation, totalInvested);
        const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        return {
            totalInvested,
            totalValuation,
            totalPnL,
            roi,
            currency: baseCurrency
        };
    }, [assets, toBase, baseCurrency]);
};
