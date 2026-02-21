import { CurrencyMath } from './math';

/**
 * Calculates the Internal Rate of Return (IRR) for a series of cash flows
 * using the Newton-Raphson method (XIRR equivalent).
 * 
 * @param values Array of cash flow amounts (negative for outflows, positive for inflows)
 * @param dates Array of dates corresponding to the cash flows
 * @param guess Initial guess for the rate (default 0.1)
 * @returns The annualized returns (0.1 = 10%)
 */
export const calculateXIRR = (values: number[], dates: Date[], guess = 0.1): number => {
    // Limits
    const MAX_ITERATIONS = 100;
    const TOLERANCE = 1e-6;

    if (values.length !== dates.length || values.length === 0) return 0;

    // Normalize dates to days from start
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const days = dates.map(d => (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    let rate = guess;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = xirrValue(values, days, rate);
        const derivative = xirrDerivative(values, days, rate);

        if (Math.abs(derivative) < TOLERANCE) break; // Avoid division by zero

        const newRate = rate - result / derivative;

        if (Math.abs(newRate - rate) < TOLERANCE) {
            return newRate;
        }

        rate = newRate;
    }

    // If no convergence, return simplified ROI or 0? 
    // For now, return the best guess or NaN if it failed significantly.
    // Ideally we might fallback to ROI if XIRR creates complex numbers (not possible here) or diverges.
    return rate;
};

// Net Present Value function for XIRR
const xirrValue = (values: number[], days: number[], rate: number): number => {
    return values.reduce((acc, val, i) => {
        // PV = FV / (1 + r)^(t/365)
        return acc + val / Math.pow(1 + rate, days[i] / 365);
    }, 0);
};

// Derivative of the NPV function
const xirrDerivative = (values: number[], days: number[], rate: number): number => {
    return values.reduce((acc, val, i) => {
        // d/dr [ v * (1+r)^-(t/365) ] = v * -(t/365) * (1+r)^-(t/365 + 1)
        const item = -(days[i] / 365) * val / Math.pow(1 + rate, (days[i] / 365) + 1);
        return acc + item;
    }, 0);
};
