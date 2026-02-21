import React from 'react';
import { Loader2 } from 'lucide-react';

/* =========================================================
   1. SYSTEM DEFINITIONS
========================================================= */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
export type ButtonIntent = 'save' | 'destructive' | 'create' | 'navigation' | 'neutral';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: ButtonIntent;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

/* =========================================================
   2. STYLES & CONFIG
========================================================= */

const baseStyles = "relative inline-flex items-center justify-center font-black uppercase tracking-widest transition-all rounded-2xl border focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden";

const intentToVariant: Record<ButtonIntent, ButtonVariant> = {
  save: 'success',
  destructive: 'danger',
  create: 'primary',
  navigation: 'ghost',
  neutral: 'secondary'
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--interactive-accent)] hover:opacity-90 text-[var(--text-on-accent)] border-transparent shadow-lg shadow-[var(--interactive-accent)]/20 focus:ring-[var(--interactive-accent)]",
  secondary: "bg-[var(--background-secondary)] hover:bg-[var(--background-modifier-hover)] text-[var(--text-muted)] hover:text-[var(--text-normal)] border-[var(--background-modifier-border)] focus:ring-[var(--text-muted)]",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 focus:ring-emerald-500",
  danger: "bg-rose-600 hover:bg-rose-500 text-white border-transparent shadow-lg shadow-rose-900/20 hover:shadow-rose-900/40 focus:ring-rose-500",
  outline: "bg-transparent border-[var(--background-modifier-border)] text-[var(--text-muted)] hover:text-[var(--text-normal)] hover:border-[var(--text-normal)] focus:ring-[var(--text-muted)]",
  ghost: "bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--text-normal)] hover:bg-[var(--background-modifier-hover)] focus:ring-[var(--text-muted)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[10px] h-7",
  md: "px-5 py-2.5 text-xs h-10",
  lg: "px-8 py-3.5 text-sm h-12",
  icon: "p-2 h-10 w-10 justify-center",
};

/* =========================================================
   3. COMPONENT
========================================================= */

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = "",
  intent,
  variant,
  size = "md",
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  type = "button",
  ...props
}, ref) => {

  const finalVariant: ButtonVariant = variant || (intent ? intentToVariant[intent] : 'primary');

  return (
    <button
      ref={ref}
      type={type}
      data-intent={intent || 'none'}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variants[finalVariant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {/* 
         LAYOUT STABILITY TRICK:
         1. Render content invisible to maintain width.
         2. Render absolute loader on top.
      */}
      <span className={`flex items-center gap-2 ${isLoading ? 'invisible' : 'visible'}`}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>

      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="animate-spin h-4 w-4" />
          <span className="sr-only">Loading...</span>
        </span>
      )}
    </button>
  );
});

Button.displayName = "Button"; 