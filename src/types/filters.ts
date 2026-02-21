import { Transaction } from './ledger';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in_list';

export interface FilterCondition {
  id: string;
  field: keyof Transaction | 'month' | 'year'; // Campos virtuales soportados
  operator: FilterOperator;
  value: any;
  isActive: boolean;
}

// Estado compatible con la UI legacy
export interface LegacyFilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  time: 'all' | 'today' | '7d' | 'thisMonth' | 'lastMonth'; // Tipado estricto
  area: string;
  account: string;
  onlyRecurrents?: boolean; // ✅ Filtro para mostrar solo generadas por recurrencia
}

export interface AdvancedFilterState {
  mode: 'simple' | 'advanced';
  legacy: LegacyFilterState;
  conditions: FilterCondition[];
}