import React from 'react';
import { TransactionChart } from '../logs/TransactionChart';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface TransactionChartSectionProps {
  data: any[];
}

export const TransactionChartSection: React.FC<TransactionChartSectionProps> = ({
  data,
}) => {
  const { t } = useTranslation();
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <section className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 h-40 sm:h-48 min-h-[160px] shrink-0">
      {hasData ? (
        <TransactionChart data={data} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center opacity-40 text-[var(--text-muted)]">
          <BarChart3 size={24} className="mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            {t('chart.no_activity')}
          </p>
        </div>
      )}
    </section>
  );
};