import React from 'react';
import { useObsidianLink } from '../../hooks/useObsidian';

interface RichTextProps {
  text: string;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ text, className = '' }) => {
  // Ahora este hook es seguro y usa Contexto
  const { openLink } = useObsidianLink();

  if (!text) return null;

  // Cambiar el regex para capturar [[links]] y #tags
  const parts = text.split(/(\[\[.*?\]\]|#\w+)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Lógica para links [[nota]]
        if (part.startsWith('[[') && part.endsWith(']]')) {
          const content = part.slice(2, -2);
          const [file, alias] = content.split('|');
          
          return (
            <span 
              key={index} 
              onClick={(e) => { 
                e.stopPropagation(); 
                openLink(file); 
              }}
              className="text-[var(--interactive-accent)] cursor-pointer hover:underline font-bold decoration-[var(--interactive-accent)] underline-offset-2 transition-colors hover:text-[var(--text-accent-hover)]"
              title={`Abrir nota: ${file}`}
            >
              {alias || file}
            </span>
          );
        }

        // Lógica para tags #tag (Nueva mejora integrada)
        if (part.startsWith('#')) {
          return (
            <span 
              key={index} 
              className="text-emerald-500 font-bold cursor-pointer hover:underline"
            >
              {part}
            </span>
          );
        }

        // Texto normal
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}; 