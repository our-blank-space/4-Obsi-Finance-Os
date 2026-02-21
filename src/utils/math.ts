/**
 * Utility for Safe Floating Point Arithmetic (Currency).
 * Soluciona problemas de precisión IEEE 754 sin requerir migración completa a enteros en BD.
 * 
 * NOTA: 4 decimales (10000) es suficiente para la mayoría de monedas.
 * 8 decimales (100000000) causa overflow con montos grandes en COP (millones).
 */

// Factor de precisión: 4 decimales (suficiente para centavos y la mayoría de casos)
const PRECISION_FACTOR = 10000;

export const CurrencyMath = {
    toInteger: (amount: number): number => Math.round(amount * PRECISION_FACTOR),

    fromInteger: (int: number): number => int / PRECISION_FACTOR,

    add: (a: number, b: number): number => {
        return (Math.round(a * PRECISION_FACTOR) + Math.round(b * PRECISION_FACTOR)) / PRECISION_FACTOR;
    },

    subtract: (a: number, b: number): number => {
        return (Math.round(a * PRECISION_FACTOR) - Math.round(b * PRECISION_FACTOR)) / PRECISION_FACTOR;
    },

    mul: (a: number, b: number): number => {
        // La multiplicación requiere dividir una vez por el factor para corregir la escala doble
        return (Math.round(a * PRECISION_FACTOR) * Math.round(b * PRECISION_FACTOR)) / (PRECISION_FACTOR * PRECISION_FACTOR);
    },

    sum: (numbers: number[]): number => {
        const totalInt = numbers.reduce((acc, curr) => acc + Math.round(curr * PRECISION_FACTOR), 0);
        return totalInt / PRECISION_FACTOR;
    }
};