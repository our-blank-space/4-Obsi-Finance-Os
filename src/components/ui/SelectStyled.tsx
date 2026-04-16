// src/components/ui/SelectStyled.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { InputProps } from './Input'; // Reusamos el tipo de Input

interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SelectStyledProps extends Omit<InputProps, 'onChange' | 'value'> {
    label?: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    variant?: 'default' | 'compact';
    className?: string;
}

export const SelectStyled: React.FC<SelectStyledProps> = ({ 
    label, value, options, onChange, variant = 'default', className = '', ...props 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(opt => opt.value === value)?.label || 'Seleccionar...';

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);
    
    // El estilo que queremos darle al dropdown
    const dropdownStyle = `absolute z-50 mt-1 ${variant === 'default' ? 'w-full' : 'min-w-[150px] whitespace-nowrap'} bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2`;

    return (
        <div ref={containerRef} className={`relative ${variant === 'default' ? 'space-y-1.5 w-full' : ''}`}>
            {label && variant === 'default' && (
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 block">
                    {label}
                </label>
            )}

            {/* El campo visible */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={
                    variant === 'compact'
                        ? `flex items-center gap-1 cursor-pointer outline-none ${className}`
                        : `w-full bg-[var(--background-primary)] border border-[var(--background-modifier-border)] text-[var(--text-normal)] rounded-xl h-10 px-3 py-2 text-sm font-bold outline-none cursor-pointer flex items-center justify-between transition-all hover:border-[var(--interactive-accent)] ${className}`
                }
                tabIndex={0}
            >
                <span className="truncate">{selectedLabel}</span>
                {variant === 'default' && (
                    <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                )}
            </div>

            {/* El Desplegable (Totalmente Estilizado) */}
            {isOpen && (
                <div className={dropdownStyle}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-[var(--interactive-accent)]/10 transition-colors ${option.value === value ? 'bg-[var(--interactive-accent)]/20 text-[var(--interactive-accent)] font-bold' : 'text-[var(--text-normal)]'}`}
                        >
                            <span className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                            </span>
                            {option.value === value && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};