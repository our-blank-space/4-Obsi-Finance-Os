import { usePortfolioMath } from '../../../hooks/usePortfolioMath';
import { AssetProject } from '../../../types';
import { renderHook } from '@testing-library/react';

// Mock useCurrency
jest.mock('../../../hooks/useCurrency', () => ({
    useCurrency: () => ({
        toBase: (amount: number, currency: string) => {
            if (currency === 'USD') return amount * 4000; // Mock Rate 1 USD = 4000 COP
            return amount; // COP to COP
        },
        baseCurrency: 'COP',
        format: (val: number) => `$${val}`
    })
}));

describe('Portfolio Logic', () => {
    const mockAssets: AssetProject[] = [
        {
            id: '1',
            name: 'Apartment',
            type: 'real_estate',
            currency: 'COP',
            status: 'active',
            entries: [
                { id: 'e1', type: 'investment', amount: 100000000, date: '2023-01-01', description: 'Buy' }
            ],
            currentValue: 120000000, // +20M Profit
            updatedAt: '2023-01-01',
            liquidity: 'illiquid'
        },
        {
            id: '2',
            name: 'Tech Stock',
            type: 'tech',
            currency: 'USD',
            status: 'active',
            entries: [
                { id: 'e2', type: 'investment', amount: 1000, date: '2023-01-01', description: 'Buy' } // 4M COP
            ],
            currentValue: 1500, // 1500 USD = 6M COP (+2M COP Profit)
            updatedAt: '2023-01-01',
            liquidity: 'liquid'
        }
    ];

    test('Should calculate Total Invested correctly with currency conversion', () => {
        const { result } = renderHook(() => usePortfolioMath(mockAssets));

        // Asset 1: 100M COP
        // Asset 2: 1000 USD * 4000 = 4M COP
        // Total: 104M COP
        expect(result.current.totalInvested).toBe(104000000);
    });

    test('Should calculate Total Valuation correctly', () => {
        const { result } = renderHook(() => usePortfolioMath(mockAssets));

        // Asset 1: 120M COP
        // Asset 2: 1500 USD * 4000 = 6M COP
        // Total: 126M COP
        expect(result.current.totalValuation).toBe(126000000);
    });

    test('Should calculate ROI correctly', () => {
        const { result } = renderHook(() => usePortfolioMath(mockAssets));

        // Invested: 104M
        // Val: 126M
        // PnL: 22M
        // ROI: 22 / 104 = 0.2115... (21.15%)
        const expectedRoi = (22000000 / 104000000) * 100;
        expect(result.current.roi).toBeCloseTo(expectedRoi, 2);
    });

    test('Should calculate Allocation percentages', () => {
        const { result } = renderHook(() => usePortfolioMath(mockAssets));

        // Total Val: 126M
        // Real Estate: 120M -> 95.2%
        // Tech: 6M -> 4.7%

        const realEstate = result.current.allocation.find(a => a.name === 'real_estate');
        const tech = result.current.allocation.find(a => a.name === 'tech');

        expect(realEstate).toBeDefined();
        expect(tech).toBeDefined();
        expect(realEstate!.percentage + tech!.percentage).toBeCloseTo(100, 1);
        expect(realEstate!.value).toBe(120000000);
    });
});
