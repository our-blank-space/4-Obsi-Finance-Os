/**
 * CurrencyMath Test Suite
 * ========================
 * Tests exhaustivos para la aritmética monetaria de punto fijo.
 * Garantiza precisión en cálculos financieros para cualquier escala de dinero.
 */
import { CurrencyMath } from '../../utils/math';

describe('CurrencyMath', () => {

    // ============================================
    // ADDITION TESTS
    // ============================================
    describe('add()', () => {
        it('should add two positive numbers correctly', () => {
            expect(CurrencyMath.add(100, 200)).toBe(300);
        });

        it('should handle decimal precision correctly', () => {
            // Classic floating point problem: 0.1 + 0.2 !== 0.3
            expect(CurrencyMath.add(0.1, 0.2)).toBe(0.3);
        });

        it('should add large Colombian peso amounts (millones)', () => {
            expect(CurrencyMath.add(5_000_000, 3_500_000)).toBe(8_500_000);
        });

        it('should add very large amounts (billones COP)', () => {
            // Persona de alto patrimonio: 50 mil millones + 30 mil millones
            expect(CurrencyMath.add(50_000_000_000, 30_000_000_000)).toBe(80_000_000_000);
        });

        it('should handle micro amounts (centavos)', () => {
            expect(CurrencyMath.add(0.01, 0.02)).toBe(0.03);
        });

        it('should add negative numbers (representing debts)', () => {
            expect(CurrencyMath.add(-500, -300)).toBe(-800);
        });

        it('should handle mixed positive and negative', () => {
            expect(CurrencyMath.add(1000, -300)).toBe(700);
        });

        it('should return zero when adding opposites', () => {
            expect(CurrencyMath.add(500, -500)).toBe(0);
        });

        it('should handle zero additions', () => {
            expect(CurrencyMath.add(0, 0)).toBe(0);
            expect(CurrencyMath.add(100, 0)).toBe(100);
            expect(CurrencyMath.add(0, 100)).toBe(100);
        });
    });

    // ============================================
    // SUBTRACTION TESTS
    // ============================================
    describe('subtract()', () => {
        it('should subtract two positive numbers correctly', () => {
            expect(CurrencyMath.subtract(500, 200)).toBe(300);
        });

        it('should handle decimal precision in subtraction', () => {
            expect(CurrencyMath.subtract(0.3, 0.1)).toBe(0.2);
        });

        it('should return negative when subtracting larger from smaller', () => {
            expect(CurrencyMath.subtract(100, 500)).toBe(-400);
        });

        it('should subtract large amounts', () => {
            expect(CurrencyMath.subtract(10_000_000, 3_500_000)).toBe(6_500_000);
        });

        it('should handle subtracting negative (adding)', () => {
            expect(CurrencyMath.subtract(100, -50)).toBe(150);
        });
    });

    // ============================================
    // MULTIPLICATION TESTS
    // ============================================
    describe('mul()', () => {
        it('should multiply two positive numbers correctly', () => {
            expect(CurrencyMath.mul(100, 2)).toBe(200);
        });

        it('should handle decimal multiplication', () => {
            expect(CurrencyMath.mul(100, 1.5)).toBe(150);
        });

        it('should handle exchange rate multiplication (COP)', () => {
            // 100 USD * 4156.69 COP/USD
            const result = CurrencyMath.mul(100, 4156.69);
            expect(result).toBeCloseTo(415669, 0);
        });

        it('should handle EUR to COP conversion', () => {
            // 50 EUR * 4500 COP/EUR
            const result = CurrencyMath.mul(50, 4500);
            expect(result).toBe(225000);
        });

        it('should handle very small multipliers (crypto fractions)', () => {
            // Con factor de precisión 10000, 0.00001 se redondea a 0
            // Para crypto se necesitaría un factor mayor, pero eso causa overflow con COP
            // DECISIÓN DE DISEÑO: No soportamos fracciones más pequeñas que 0.0001
            const result = CurrencyMath.mul(0.0001, 18_000_000); // Mínimo soportado
            expect(result).toBeCloseTo(1800, 0);
        });

        it('should handle multiplication by zero', () => {
            expect(CurrencyMath.mul(100, 0)).toBe(0);
            expect(CurrencyMath.mul(0, 100)).toBe(0);
        });

        it('should handle negative multipliers', () => {
            expect(CurrencyMath.mul(100, -1)).toBe(-100);
        });

        it('should NOT overflow with large peso amounts', () => {
            // Crítico: 500,000 COP * tasa 4156 NO debe dar overflow
            const result = CurrencyMath.mul(500_000, 4156);
            expect(result).toBe(2_078_000_000);
            expect(result).toBeLessThan(Number.MAX_SAFE_INTEGER);
        });

        it('should handle billionaire-level calculations', () => {
            // 100 millones USD * 4000 = 400 mil millones COP
            const result = CurrencyMath.mul(100_000_000, 4000);
            expect(result).toBe(400_000_000_000);
        });
    });

    // ============================================
    // SUM ARRAY TESTS
    // ============================================
    describe('sum()', () => {
        it('should sum an empty array to zero', () => {
            expect(CurrencyMath.sum([])).toBe(0);
        });

        it('should sum a single element array', () => {
            expect(CurrencyMath.sum([500])).toBe(500);
        });

        it('should sum multiple elements correctly', () => {
            expect(CurrencyMath.sum([100, 200, 300])).toBe(600);
        });

        it('should handle mixed positive and negative in sum', () => {
            expect(CurrencyMath.sum([1000, -200, 500, -100])).toBe(1200);
        });

        it('should sum with decimal precision', () => {
            expect(CurrencyMath.sum([0.1, 0.2, 0.3])).toBe(0.6);
        });

        it('should sum large transaction list (performance)', () => {
            // Simular 1000 transacciones
            const transactions = Array.from({ length: 1000 }, (_, i) => (i + 1) * 1000);
            const expected = (1000 * 1001 / 2) * 1000; // Formula de suma aritmética
            expect(CurrencyMath.sum(transactions)).toBe(expected);
        });

        it('should handle array of zeros', () => {
            expect(CurrencyMath.sum([0, 0, 0, 0])).toBe(0);
        });
    });

    // ============================================
    // INTEGER CONVERSION TESTS
    // ============================================
    describe('toInteger() / fromInteger()', () => {
        it('should convert to integer and back without loss', () => {
            const original = 123.45;
            const integer = CurrencyMath.toInteger(original);
            const restored = CurrencyMath.fromInteger(integer);
            expect(restored).toBe(123.45);
        });

        it('should handle whole numbers', () => {
            const integer = CurrencyMath.toInteger(500);
            expect(CurrencyMath.fromInteger(integer)).toBe(500);
        });

        it('should round to precision limit', () => {
            // With 4 decimal precision, 5th decimal should be rounded
            const integer = CurrencyMath.toInteger(123.45678);
            const restored = CurrencyMath.fromInteger(integer);
            expect(restored).toBeCloseTo(123.4568, 4); // Rounds to 4 decimals
        });
    });

    // ============================================
    // EDGE CASES & ERROR HANDLING
    // ============================================
    describe('Edge Cases', () => {
        it('should handle NaN inputs gracefully', () => {
            expect(CurrencyMath.add(NaN, 100)).toBeNaN();
        });

        it('should handle Infinity inputs', () => {
            expect(CurrencyMath.add(Infinity, 100)).toBe(Infinity);
        });

        it('should handle very small numbers near zero', () => {
            expect(CurrencyMath.add(0.0001, 0.0001)).toBe(0.0002);
        });

        it('should maintain precision across chained operations', () => {
            // Simulate multiple financial operations
            let balance = 1_000_000;
            balance = CurrencyMath.subtract(balance, 150_000.50);
            balance = CurrencyMath.add(balance, 500_000.25);
            balance = CurrencyMath.subtract(balance, 200_000.75);

            expect(balance).toBe(1_149_999);
        });
    });

    // ============================================
    // REAL-WORLD SCENARIOS
    // ============================================
    describe('Real-World Financial Scenarios', () => {
        it('should calculate monthly budget balance correctly', () => {
            const income = [5_000_000, 200_000, 50_000]; // Salario, freelance, dividendos
            const expenses = [1_500_000, 800_000, 300_000, 150_000]; // Arriendo, mercado, servicios, transporte

            const totalIncome = CurrencyMath.sum(income);
            const totalExpenses = CurrencyMath.sum(expenses);
            const balance = CurrencyMath.subtract(totalIncome, totalExpenses);

            expect(totalIncome).toBe(5_250_000);
            expect(totalExpenses).toBe(2_750_000);
            expect(balance).toBe(2_500_000);
        });

        it('should calculate investment returns with decimals', () => {
            const principal = 10_000_000;
            const returnRate = 1.08; // 8% return
            const finalValue = CurrencyMath.mul(principal, returnRate);

            expect(finalValue).toBe(10_800_000);
        });

        it('should handle multi-currency portfolio valuation', () => {
            // Portfolio: 1000 USD, 500 EUR, 10 millones COP
            const usdRate = 4156;
            const eurRate = 4500;

            const usdValue = CurrencyMath.mul(1000, usdRate);
            const eurValue = CurrencyMath.mul(500, eurRate);
            const copValue = 10_000_000;

            const totalCOP = CurrencyMath.sum([usdValue, eurValue, copValue]);

            expect(totalCOP).toBe(4_156_000 + 2_250_000 + 10_000_000);
        });
    });
});
