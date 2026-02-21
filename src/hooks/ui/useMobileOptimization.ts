import { useState, useEffect, useRef } from 'react';

interface MobileState {
  isMobile: boolean;
  isKeyboardOpen: boolean;
  viewportHeight: number;
  orientation: 'portrait' | 'landscape';
}

const MOBILE_BREAKPOINT = 768; 
const KEYBOARD_THRESHOLD = 150; 

export const useMobileOptimization = (): MobileState => {
  const [state, setState] = useState<MobileState>({
    isMobile: typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
    isKeyboardOpen: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation: typeof window !== 'undefined' && window.innerHeight < window.innerWidth ? 'landscape' : 'portrait'
  });

  // Referencia para altura base del layout
  const baseHeightRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      window.requestAnimationFrame(() => {
        const width = window.innerWidth;
        const visualHeight = window.visualViewport?.height || window.innerHeight;
        const layoutHeight = window.innerHeight;

        const isMobile = width < MOBILE_BREAKPOINT;
        const isLandscape = width > layoutHeight;
        
        // Detectar teclado: Si la altura visual es mucho menor que la del layout
        const heightDiff = layoutHeight - visualHeight;
        const isKeyboardOpen = isMobile && heightDiff > KEYBOARD_THRESHOLD;

        setState({
          isMobile,
          isKeyboardOpen,
          viewportHeight: visualHeight,
          orientation: isLandscape ? 'landscape' : 'portrait'
        });

        if (!isKeyboardOpen) {
          baseHeightRef.current = layoutHeight;
        }
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    
    const handleOrientation = () => setTimeout(handleResize, 150);
    window.addEventListener('orientationchange', handleOrientation);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return state;
};