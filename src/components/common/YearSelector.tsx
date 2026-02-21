import React, { useState, useEffect } from 'react';
import { SelectStyled } from '../ui/SelectStyled';
import { useFinance } from '../../context/FinanceContext';
import { Notice } from 'obsidian';
import { StorageService } from '../../services/StorageService';
import { useTranslation } from '../../hooks/useTranslation';

interface YearSelectorProps {
    onYearSelected?: (year: string) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ onYearSelected }) => {
    const { state, dispatch, api } = useFinance();
    const { t } = useTranslation();
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load of available years (this is tricky in Obsidian without proper FS API exposure)
    // For V1, we will generate a range based on current year and maybe some logic,
    // or we assume user only has last 5 years.
    // IMPROVEMENT: Add listFiles to API to scan archives.
    useEffect(() => {
        const loadYears = async () => {
            try {
                const basePath = api.getBasePath();
                const storage = new StorageService(api, basePath);
                const years = await storage.getAvailableYears();

                // Fallback: Si no hay archivos, o para completar el rango, mostrar desde fiscalYearStart hasta el actual
                const fiscalYearStart = state.settings?.fiscalYearStart || 2020;
                const currentYear = new Date().getFullYear();

                for (let y = currentYear; y >= fiscalYearStart; y--) {
                    const yearStr = y.toString();
                    if (!years.includes(yearStr)) {
                        years.push(yearStr);
                    }
                }

                years.sort((a, b) => b.localeCompare(a));
                setAvailableYears(years);
            } catch (e) {
                console.error("[YearSelector] Failed to load years:", e);
                // Fallback estático en caso de error crítico
                const fiscalYearStart = state.settings?.fiscalYearStart || 2020;
                const currentYear = new Date().getFullYear();
                const fallbackYears = [];
                for (let y = currentYear; y >= fiscalYearStart; y--) {
                    fallbackYears.push(y.toString());
                }
                setAvailableYears(fallbackYears.length > 0 ? fallbackYears : [currentYear.toString()]);
            }
        };

        loadYears();
    }, [api, state.settings?.fiscalYearStart]);

    const handleYearChange = async (year: string) => {
        if (year === selectedYear) return;

        setSelectedYear(year);
        if (onYearSelected) onYearSelected(year);

        const currentYear = new Date().getFullYear().toString();

        if (year !== currentYear) {
            setIsLoading(true);
            try {
                // Load archived data
                const basePath = api.getBasePath();
                const storage = new StorageService(api, basePath);
                const txs = await storage.loadArchiveYear(parseInt(year));

                if (txs && txs.length > 0) {
                    dispatch({ type: 'LOAD_YEAR_HISTORY', payload: txs });
                    new Notice(t('logs.msg.loading_history', { year, count: txs.length }));
                } else {
                    new Notice(t('logs.msg.no_history', { year }));
                }
            } catch (e) {
                console.error(e);
                new Notice(t('logs.msg.error_history'));
            } finally {
                setIsLoading(false);
            }
        } else {
            new Notice(t('logs.msg.current_year'));
        }
    };

    const options = availableYears.map(y => ({ value: y, label: y }));

    return (
        <div className="w-32">
            <SelectStyled
                label={t('logs.fiscal_year')}
                value={selectedYear}
                onChange={handleYearChange}
                options={options}
                disabled={isLoading}
            />
        </div>
    );
};
