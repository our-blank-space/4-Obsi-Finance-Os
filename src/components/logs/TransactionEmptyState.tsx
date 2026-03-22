import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';

export const TransactionEmptyState = ({ onClear }: { onClear: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="py-20 text-center opacity-40 flex flex-col items-center">
      <Search size={48} className="mb-4 text-[var(--text-muted)]" />
      <p className="text-sm font-bold uppercase tracking-widest mb-4 text-[var(--text-normal)]">
        {t('logs.empty.title')}
      </p>
      <Button variant="outline" size="sm" onClick={onClear}>
        {t('logs.empty.clear')}
      </Button>
    </div>
  );
};