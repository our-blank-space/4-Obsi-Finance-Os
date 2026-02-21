export const FinanceMath = {
  // Calcula la cuota mensual fija (Sistema Francés)
  calculateFrenchCuota: (principal: number, annualRate: number, months: number) => {
    const monthlyRate = (annualRate / 100) / 12;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  }
};
 