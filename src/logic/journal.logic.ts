import { Trade } from '../types';
import { FilterState } from '../components/trading/TradeFilters';

export const JournalLogic = {
    filterTrades: (trades: Trade[], filters: FilterState): Trade[] => {
        return trades.filter(t => {
            // 1. Search (Symbol)
            if (filters.search && !t.symbol.includes(filters.search.toUpperCase())) {
                return false;
            }

            // 2. Strategy
            if (filters.strategy !== 'ALL' && t.strategy !== filters.strategy) {
                return false;
            }

            // 3. Outcome
            if (filters.outcome !== 'ALL' && t.outcome !== filters.outcome) {
                return false;
            }

            // 4. Date Range
            if (filters.dateRange !== 'ALL') {
                // Use exitDate if available, otherwise date (entry)
                const tradeDateStr = t.exitDate || t.date;
                const tradeDate = new Date(tradeDateStr);
                const now = new Date();

                // Reset time portion for accurate day comparisons if needed, 
                // but usually raw diff is fine for "last X days"
                const diffTime = now.getTime() - tradeDate.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24);

                if (filters.dateRange === '30D') {
                    if (diffDays > 30) return false;
                } else if (filters.dateRange === '90D') {
                    if (diffDays > 90) return false;
                } else if (filters.dateRange === 'YTD') {
                    if (tradeDate.getFullYear() !== now.getFullYear()) return false;
                }
            }

            return true;
        });
    },

    getStrategies: (trades: Trade[]): string[] => {
        return Array.from(new Set(trades.map(t => t.strategy))).sort();
    },

    paginateTrades: (trades: Trade[], page: number, itemsPerPage: number): { data: Trade[], totalPages: number } => {
        const totalPages = Math.ceil(trades.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const data = trades.slice(startIndex, startIndex + itemsPerPage);
        return { data, totalPages };
    }
};
