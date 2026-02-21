import React, { forwardRef, useId, useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertCircle, Check } from 'lucide-react';

/* =========================================================
   SHARED HELPERS
========================================================= */
const FieldWrapper = ({ label, error, helperText, id, children }: any) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label
        htmlFor={id}
        className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 block cursor-pointer"
      >
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p id={`${id}-error`} className="text-[10px] text-[var(--text-error)] font-bold flex items-center gap-1 pl-1 animate-in slide-in-from-top-1">
        <AlertCircle size={10} /> {error}
      </p>
    ) : helperText ? (
      <p id={`${id}-desc`} className="text-[10px] text-[var(--text-muted)] pl-1 opacity-80">{helperText}</p>
    ) : null}
  </div>
);

/* =========================================================
   INPUT
========================================================= */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <FieldWrapper label={label} error={error} helperText={helperText} id={inputId}>
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] group-focus-within:text-[var(--interactive-accent)] transition-colors pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
            className={`
              w-full
              bg-[var(--background-modifier-form-field)]
              border border-[var(--background-modifier-border)]
              text-[var(--text-normal)]
              placeholder:text-[var(--text-faint)]
              rounded-2xl h-10 px-4 text-sm font-medium outline-none transition-all duration-200
              focus:border-[var(--interactive-accent)] focus:ring-1 focus:ring-[var(--interactive-accent)]/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : 'pl-3'}
              ${rightElement ? 'pr-12' : 'pr-3'}
              ${error ? 'border-[var(--text-error)] focus:border-[var(--text-error)] focus:ring-[var(--text-error)]/50' : ''}
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-bold pointer-events-none">
              {rightElement}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);
Input.displayName = 'Input';

/* =========================================================
   SELECT (CUSTOM DROPDOWN TO MATCH DAILY STYLE)
========================================================= */


export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options?: { value: string; label: string }[] | string[] | readonly string[];
  onChange?: (e: { target: { value: string; name?: string } }) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options = [], helperText, value, onChange, placeholder, className = '', id, name, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Normalize options to object format
    const normalizedOptions = React.useMemo(() => {
      return (options as any[]).map((opt: any) => {
        if (typeof opt === 'string') return { value: opt, label: opt };
        return opt;
      });
    }, [options]);

    const selectedLabel = normalizedOptions.find(opt => opt.value == value)?.label || 'Seleccionar...';

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);

    const handleSelect = (val: string) => {
      setIsOpen(false);
      if (onChange) {
        // Create synthetic event for compatibility
        onChange({ target: { value: val, name } });
      }
    };

    return (
      <FieldWrapper label={label} error={error} helperText={helperText} id={selectId}>
        <div ref={containerRef} className="relative group">
          {/* TRIGGER */}
          <div
            onClick={() => !props.disabled && setIsOpen(!isOpen)}
            className={`
                  w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)]
                  text-[var(--text-normal)] rounded-2xl h-10 pl-4 pr-10 py-0 text-sm font-bold 
                  flex items-center outline-none transition-all duration-200 cursor-pointer select-none
                  ${isOpen ? 'border-[var(--interactive-accent)] ring-1 ring-[var(--interactive-accent)]/50' : ''}
                  ${error ? 'border-[var(--text-error)]' : ''}
                  ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--interactive-accent)]'}
                  ${className}
                `}
          >
            <span className="truncate">{selectedLabel}</span>
          </div>

          <div className="absolute right-3 top-0 bottom-0 pointer-events-none text-[var(--text-muted)] group-hover:text-[var(--interactive-accent)] transition-colors flex items-center justify-center">
            <ChevronDown size={16} strokeWidth={3} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* DROPDOWN MENU */}
          {isOpen && !props.disabled && (
            <div className="absolute z-50 mt-1 w-full bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
              {normalizedOptions.length > 0 ? (
                normalizedOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                                   px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer 
                                   transition-colors border-b border-[var(--background-modifier-border)] last:border-0
                                   ${opt.value == value
                        ? 'bg-[var(--interactive-accent)]/10 text-[var(--interactive-accent)] font-bold'
                        : 'text-[var(--text-normal)] hover:bg-[var(--background-modifier-hover)]'
                      }
                               `}
                  >
                    <span>{opt.label}</span>
                    {opt.value == value && <Check size={14} className="text-[var(--interactive-accent)]" />}
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-center text-[var(--text-muted)] opacity-70">No hay opciones</div>
              )}
            </div>
          )}

          {/* HIDDEN NATIVE SELECT FOR REFS (Optional, mostly for form libraries if needed, though synthetic event usually suffices) */}
          <select
            id={selectId}
            name={name}
            value={value}
            onChange={() => { }}
            ref={ref}
            className="sr-only"
            tabIndex={-1}
            {...props}
          >
            {normalizedOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </FieldWrapper>
    );
  }
);
Select.displayName = 'Select'; 