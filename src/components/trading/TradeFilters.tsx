import React from 'react';
import { Search, Filter, Calendar, BarChart3 } from 'lucide-react';
import { TradeOutcome } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { SelectStyled } from '../ui/SelectStyled';

export interface FilterState {
    search: string;
    strategy: string;
    outcome: 'ALL' | TradeOutcome;
    dateRange: 'ALL' | '30D' | '90D' | 'YTD';
}

interface Props {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    strategies: string[];
}

export const TradeFilters: React.FC<Props> = ({ filters, onFilterChange, strategies }) => {
    const { t } = useTranslation();

    const handleChange = (key: keyof FilterState, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    return (
        <div className="bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] p-4 rounded-2xl flex flex-wrap gap-4 items-center">

            {/* SEARCH */}
            <div className="relative min-w-[200px] flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder={t('trade.filter.search')}
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                    className="w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl py-2 pl-10 pr-4 text-sm font-bold placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--interactive-accent)] transition-colors"
                />
            </div>

            {/* FILTERS GROUP */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">

                {/* STRATEGY SELECTOR */}
                <div className="relative min-w-[200px]">
                    <SelectStyled
                        value={filters.strategy}
                        onChange={(v) => handleChange('strategy', v)}
                        options={[
                            { value: 'ALL', label: t('trade.filter.all_strategies') },
                            ...strategies.map(s => ({ value: s, label: s }))
                        ]}
                    />
                </div>

                {/* OUTCOME TOGGLE */}
                <div className="flex bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-xl p-1 shrink-0">
                    {['ALL', 'win', 'loss'].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleChange('outcome', opt)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filters.outcome === opt
                                ? 'bg-[var(--interactive-accent)] text-[var(--text-on-accent)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'
                                }`}
                        >
                            {opt === 'ALL' ? t('trade.filter.outcome.all') : opt}
                        </button>
                    ))}
                </div>

                {/* DATE SELECTOR (Simple) */}
                <div className="relative min-w-[160px]">
                    <SelectStyled
                        value={filters.dateRange}
                        onChange={(v) => handleChange('dateRange', v)}
                        options={[
                            { value: 'ALL', label: t('trade.filter.date.all') },
                            { value: '30D', label: t('trade.filter.date.30d') },
                            { value: '90D', label: t('trade.filter.date.90d') },
                            { value: 'YTD', label: t('trade.filter.date.ytd') }
                        ]}
                    />
                </div>

            </div>
        </div>
    );
};
