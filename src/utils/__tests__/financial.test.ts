import { calculateXIRR } from '../financial';

describe('Financial Utils - XIRR', () => {
    test('Should calculate 10% annual return correctly', () => {
        // Invest 1000, 1 year later get 1100
        const values = [-1000, 1100];
        const dates = [new Date('2023-01-01'), new Date('2024-01-01')];

        const irr = calculateXIRR(values, dates);
        expect(irr).toBeCloseTo(0.10, 2); // 10%
    });

    test('Should calculate ~100% return (Doubling in 1 year)', () => {
        const values = [-1000, 2000];
        const dates = [new Date('2023-01-01'), new Date('2024-01-01')];

        const irr = calculateXIRR(values, dates);
        expect(irr).toBeCloseTo(1.0, 2); // 100%
    });

    test('Should handle complex cash flows (DCA)', () => {
        // Buy 1000 jan 1
        // Buy 1000 july 1
        // Value 2200 jan 1 next year (~10% gain total invested 2000)
        const values = [-1000, -1000, 2200];
        const dates = [
            new Date('2023-01-01'),
            new Date('2023-07-01'),
            new Date('2024-01-01')
        ];

        // Exact math: 
        // -1000(1+r)^1 - 1000(1+r)^0.5 + 2200 = 0
        // r should be roughly 0.09...0.10 range
        const irr = calculateXIRR(values, dates);
        expect(irr).toBeGreaterThan(0.08);
        expect(irr).toBeLessThan(0.12);
    });

    test('Should match Excel XIRR example', () => {
        // Excel Example:
        // -10,000  1-Jan-08
        // 2,750    1-Mar-08
        // 4,250    30-Oct-08
        // 3,250    15-Feb-09
        // 2,750    1-Apr-09
        // Result: 0.3734 (37.34%)

        const values = [-10000, 2750, 4250, 3250, 2750];
        const dates = [
            new Date('2008-01-01'),
            new Date('2008-03-01'),
            new Date('2008-10-30'),
            new Date('2009-02-15'),
            new Date('2009-04-01')
        ];

        const irr = calculateXIRR(values, dates);
        expect(irr).toBeCloseTo(0.3734, 3);
    });

    test('Should return 0 for empty or invalid data', () => {
        expect(calculateXIRR([], [])).toBe(0);
        expect(calculateXIRR([-100], [new Date()])).toBeNaN(); // Need at least one positive
        // Implementation returns last rate, which might be guess or garbage if no convergence.
        // Let's check single value behavior:
        // Single value equation: -100 / (1+r)^0 = 0 => -100 = 0 (Impossible)
        // Our simplified loop might just return NaN or guess.
    });
});
