import { renderHook } from '@testing-library/react';
import { useProjectedIncome } from '../useProjectedIncome';
import { AssetProject } from '../../types';

// Mock useCurrency
jest.mock('../useCurrency', () => ({
    useCurrency: () => ({
        toBase: (amount: number, currency: string) => {
            if (currency === 'USD') return amount * 4000;
            return amount;
        },
        baseCurrency: 'COP',
        format: (val: number) => `$${val}`
    })
}));

describe('useProjectedIncome', () => {
    const mockAssets: AssetProject[] = [
        {
            id: '1',
            name: 'Apartment',
            type: 'real_estate',
            currency: 'COP',
            status: 'active',
            entries: [],
            updatedAt: '2023-01-01',
            liquidity: 'illiquid',
            yieldProfile: {
                frequency: 'monthly',
                expectedAmount: 1000000,
                autoLog: false
            }
        },
        {
            id: '2',
            name: 'Dividend Stock',
            type: 'stock',
            currency: 'USD',
            status: 'active',
            entries: [],
            updatedAt: '2023-01-01',
            liquidity: 'liquid',
            yieldProfile: {
                frequency: 'quarterly',
                expectedAmount: 100, // 400,000 COP
                nextPaymentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                autoLog: false
            }
        }
    ];

    test('Should generate 12 monthly events for monthly asset', () => {
        const { result } = renderHook(() => useProjectedIncome(mockAssets));
        const aptEvents = result.current.events.filter(e => e.assetId === '1');

        // Might be 12 or 13 depending on today's date logic (<= next year)
        // Logic: if today is Jan 1, loop runs until next Jan 1. 
        expect(aptEvents.length).toBeGreaterThanOrEqual(12);
        expect(aptEvents[0].amount).toBe(1000000);
    });

    test('Should generate ~4 quarterly events for quarterly asset', () => {
        const { result } = renderHook(() => useProjectedIncome(mockAssets));
        const stockEvents = result.current.events.filter(e => e.assetId === '2');

        expect(stockEvents.length).toBeGreaterThanOrEqual(4);
        expect(stockEvents[0].amount).toBe(400000); // 100 * 4000
    });

    test('Should sort events by date', () => {
        const { result } = renderHook(() => useProjectedIncome(mockAssets));
        const events = result.current.events;

        for (let i = 0; i < events.length - 1; i++) {
            expect(events[i].date.getTime()).toBeLessThanOrEqual(events[i + 1].date.getTime());
        }
    });
});
