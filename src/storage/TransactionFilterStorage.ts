import { LegacyFilterState } from '../types/filters';

// Valores por defecto
export const DEFAULT_FILTERS: LegacyFilterState = {
  search: '',
  type: 'all',
  time: 'thisMonth',
  area: 'all',
  account: 'all',
};

export interface FilterStorage {
  save(filters: LegacyFilterState): void;
  load(): LegacyFilterState | null;
  clear(): void;
}

export class LocalStorageFilterStorage implements FilterStorage {
  private readonly key = 'f-os-log-filters';

  save(filters: LegacyFilterState): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(filters));
    } catch (error) {
      console.error('FinanceOS: Failed to save filters:', error);
    }
  }

  load(): LegacyFilterState | null {
    try {
      const saved = localStorage.getItem(this.key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('FinanceOS: Failed to load filters:', error);
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}