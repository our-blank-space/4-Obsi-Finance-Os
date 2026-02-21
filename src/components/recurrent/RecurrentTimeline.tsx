import React from 'react';
import { RecurrentItemWithAnalysis } from '../../core/analytics/RecurrentEngine';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
    items: RecurrentItemWithAnalysis[]; // Usamos el tipo enriquecido
    t: (k: string, p?: any) => string;
    onExecute: (item: any) => void;
}

export const RecurrentTimeline: React.FC<Props> = ({ items, t, onExecute }) => {
    // Filtramos solo los próximos 5 eventos para no saturar
    const upcoming = items.slice(0, 5);

    return (
        <aside className="bg-[var(--background-primary)] border rounded-3xl p-6 h-fit sticky top-4">
            <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14} /> {t('rec.timeline')}
            </h3>

            <div className="relative pl-4 space-y-6 border-l border-[var(--background-modifier-border)]">
                {upcoming.map((item) => {
                    const { analysis } = item;

                    return (
                        <div key={item.id} className="relative group">
                            {/* Dot Indicator */}
                            <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--background-primary)] 
                                ${analysis.isOverdue ? 'bg-rose-500' : analysis.isToday ? 'bg-amber-500' : 'bg-[var(--interactive-accent)]'}
                            `}></div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold opacity-60 uppercase">{analysis.displayDate}</div>
                                    <h4 className="font-bold text-sm">{item.name}</h4>

                                    {analysis.isOverdue && (
                                        <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                                            <AlertCircle size={10} /> {t('rec.overdue', { n: Math.abs(analysis.daysRemaining) })}
                                        </div>
                                    )}
                                    {analysis.isToday && (
                                        <div className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mt-1">
                                            <Clock size={10} /> {t('rec.expires_today')}
                                        </div>
                                    )}
                                </div>

                                {(analysis.isOverdue || analysis.isToday) && (
                                    <Button size="sm" variant="ghost" onClick={() => onExecute(item)} icon={<CheckCircle2 size={12} />} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('rec.pay')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {upcoming.length === 0 && (
                    <div className="text-sm text-[var(--text-muted)] italic">
                        {t('rec.done')}
                    </div>
                )}
            </div>
        </aside>
    );
};