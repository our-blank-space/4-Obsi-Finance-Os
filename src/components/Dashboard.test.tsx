import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { FinanceProvider } from '../context/FinanceContext';
import { DEFAULT_DATA } from '../data/defaults';
import { createMockApi } from '../test/utils/mockApi';



// Mock hooks that might be troublesome
jest.mock('../hooks/useCurrency', () => ({
    useCurrency: () => ({
        toBase: (amt: number) => amt,
        format: (amt: number) => `$ ${amt}`,
        formatCompact: (amt: number) => `$ ${amt}`,
        baseCurrency: 'COP',
        exchangeRate: 4000
    })
}));

const mockApi = createMockApi();

describe('Dashboard Component', () => {
    test('renders key metrics and charts', async () => {
        render(
            <FinanceProvider initialData={DEFAULT_DATA} api={mockApi}>
                <Dashboard />
            </FinanceProvider>
        );

        // Check for KPI Titles
        expect(screen.getByText(/Cash Flow/i)).toBeInTheDocument();
        expect(screen.getByText(/Runway/i)).toBeInTheDocument();

        // Check for Charts sections
        // Note: We check specifically for the text inside headers or chart legends
        const headings = screen.getAllByText(/Evolución Patrimonial/i);
        expect(headings.length).toBeGreaterThan(0);
    });
});
