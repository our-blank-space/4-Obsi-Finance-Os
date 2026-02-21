import { useMemo } from 'react';
import { AssetProject, Currency } from '../types';
import { useCurrency } from './useCurrency';

export interface IncomeEvent {
    id: string;
    assetId: string;
    assetName: string;
    date: Date;
    amount: number;
    currency: Currency;
    frequency: string;
    status: 'projected' | 'paid'; // Future: check against actual transactions?
}

export const useProjectedIncome = (assets: AssetProject[]) => {
    const { toBase, baseCurrency } = useCurrency();

    return useMemo(() => {
        const events: IncomeEvent[] = [];
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        assets.forEach(asset => {
            const profile = asset.yieldProfile;
            if (!profile || !profile.expectedAmount) return;

            // Determine Start Date (nextPaymentDate or today)
            let currentDate = profile.nextPaymentDate ? new Date(profile.nextPaymentDate) : new Date();
            if (currentDate < today) currentDate = today; // Don't project past

            const amountBase = toBase(profile.expectedAmount, asset.currency);

            while (currentDate <= nextYear) {
                // Add Event
                events.push({
                    id: `${asset.id}-${currentDate.getTime()}`,
                    assetId: asset.id,
                    assetName: asset.name,
                    date: new Date(currentDate),
                    amount: amountBase, // In Base Currency
                    currency: baseCurrency,
                    frequency: profile.frequency,
                    status: 'projected'
                });

                // Advance Date
                if (profile.frequency === 'monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else if (profile.frequency === 'quarterly') {
                    currentDate.setMonth(currentDate.getMonth() + 3);
                } else if (profile.frequency === 'annually') {
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                } else {
                    break; // Irregular, only one prediction if date provided? Or none.
                }
            }
        });

        const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());

        const totalAnnualProjected = sortedEvents.reduce((sum, e) => sum + e.amount, 0);
        const monthlyAverage = totalAnnualProjected / 12;

        return {
            events: sortedEvents,
            totalAnnualProjected,
            monthlyAverage
        };
    }, [assets, toBase, baseCurrency]);
};
