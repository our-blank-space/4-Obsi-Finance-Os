import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/Button';

interface HeaderSectionProps {
  feedback: string;
  onAddClick: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  feedback,
  onAddClick,
}) => {
  const { t } = useTranslation();

  return (
    <header className="flex justify-between items-center px-1 shrink-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black italic flex items-center gap-2 text-[var(--text-normal)]">
          <FileText className="text-[var(--interactive-accent)]" size={20} />{' '}
          {t('logs.title')}
        </h1>
        <p className="text-[9px] sm:text-[10px] font-black text-[var(--interactive-accent)] uppercase tracking-widest">
          {feedback}
        </p>
      </div>
      <Button onClick={onAddClick} icon={<Plus size={18} />} size="sm">
        {t('btn.new')}
      </Button>
    </header>
  );
};