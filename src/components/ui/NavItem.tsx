// src/components/ui/NavItem.tsx
import React from 'react';
import { NavItemProps } from '../../types/ui';

export const NavItem: React.FC<NavItemProps> = ({ 
  active, 
  onClick, 
  icon, 
  label, 
  badge = 0, 
  hidden = false 
}) => {
  if (hidden) return null;
  
  return (
    <button
      onClick={onClick}
      className={`
          flex items-center justify-between w-full p-3 rounded-xl border transition-all duration-200
          ${ active 
              ? 'bg-[var(--background-secondary)] text-[var(--interactive-accent)] border-[var(--interactive-accent)]/30 shadow-sm' 
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-normal)] hover:bg-[var(--background-secondary)]/50' 
          }
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </div>
      {badge > 0 && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${active ? 'bg-[var(--interactive-accent)] text-white' : 'bg-[var(--background-secondary)] text-[var(--text-muted)]'}`}>
              {badge}
          </span>
      )}
    </button>
  );
}; 