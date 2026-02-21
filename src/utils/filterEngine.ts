import { Transaction } from '../types';
import { FilterCondition } from '../types/filters';

export const FilterEngine = {
  checkCondition: (tx: Transaction, condition: FilterCondition): boolean => {
    if (!condition.isActive) return true;

    const val = tx[condition.field as keyof Transaction];
    
    switch (condition.operator) {
      case 'equals': return val === condition.value;
      case 'contains': 
        return String(val || '').toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than': return Number(val) > Number(condition.value);
      case 'less_than': return Number(val) < Number(condition.value);
      default: return true;
    }
  },

  applyFilters: (transactions: Transaction[], conditions: FilterCondition[]): Transaction[] => {
    if (!conditions.length) return transactions;
    
    // Lógica AND: Todas las condiciones deben cumplirse
    return transactions.filter(tx => {
      return conditions.every(cond => FilterEngine.checkCondition(tx, cond));
    });
  }
};