import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { useMobileOptimization } from '../../hooks/ui/useMobileOptimization';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[95%]'
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: ModalSize;
  preventCloseOnOutsideClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, children, icon, size = 'md', preventCloseOnOutsideClick = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { isMobile, isKeyboardOpen, viewportHeight } = useMobileOptimization();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventCloseOnOutsideClick) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, preventCloseOnOutsideClick]);

  if (!isOpen) return null;

  // Use fixed layout ONLY for mobile keyboard to prevent viewport jumping
  const isFixedMode = isMobile && isKeyboardOpen;
  const shouldHideHeader = isFixedMode && viewportHeight < 450;

  return (
    <div
      className={`
        fixed inset-0 z-[150] 
        bg-black/60 backdrop-blur-sm 
        transition-all duration-200
        /* LAYOUT MODE: Scrollable Backdrop vs Fixed Container */
        ${isFixedMode
          ? 'flex flex-col justify-end' // Keyboard open: Push to top/bottom
          : 'overflow-y-auto py-10 px-4 flex items-center justify-center' // Desktop/Normal: Scrollable page
        }
      `}
      onClick={(e) => {
        // Handle clicking background
        if (!preventCloseOnOutsideClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={isFixedMode ? { height: `${viewportHeight}px` } : {}}
        className={`
            relative w-full flex flex-col 
            bg-[var(--background-primary)] 
            text-[var(--text-normal)]
            shadow-2xl
            border border-[var(--background-modifier-border)]
            
            ${!isKeyboardOpen ? 'animate-in zoom-in-95 duration-200' : ''}
            ${sizeClasses[size]} 
            
            /* CARD STYLING */
            ${isFixedMode
            ? 'rounded-none border-x-0' // Full screen on mobile typing
            : 'rounded-2xl sm:rounded-[2rem] h-auto my-auto' // Floating card on desktop
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        {!shouldHideHeader && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--background-modifier-border)] bg-[var(--background-secondary)] shrink-0 rounded-t-[inherit]">
            <div className="flex gap-3 items-center min-w-0">
              {icon && (
                <div className="text-[var(--interactive-accent)] p-2 bg-[var(--background-primary)] rounded-xl border border-[var(--background-modifier-border)] shrink-0">
                  {icon}
                </div>
              )}
              <h3 id={titleId} className="text-lg font-black tracking-tighter uppercase italic truncate">
                {title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--background-modifier-hover)] rounded-full transition-all text-[var(--text-muted)] active:scale-90"
              type="button"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* CONTENT */}
        {/* 
            CRITICAL: On Desktop/Normal mode, we DO NOT use overflow-y-auto here. 
            We let the card grow (h-auto) and the Backdrop handles scrolling.
            This ensures dropdowns/popups can overflow the card and appear on top.
            On Mobile Keyboard mode, we use strict overflow to keep the input in view.
        */}
        <div className={`
            flex-1 
            ${isFixedMode ? 'overflow-y-auto p-4' : 'p-6 sm:p-8'}
        `}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`
      flex flex-col sm:flex-row justify-end gap-3 
      pt-6 border-t border-[var(--background-modifier-border)] 
      mt-auto bg-[var(--background-primary)]
      /* Sticky footer behavior depends on parent scroll context */
      sticky bottom-0 z-10 
      ${className}
    `}>
    {children}
  </div>
);