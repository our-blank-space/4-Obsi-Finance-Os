import { useEffect } from 'react';

// Tipos de acciones soportadas por el mapa de teclas
export type KeyMap = {
  submit?: () => void;   // Ctrl + Enter (Confirmar formularios)
  escape?: () => void;   // Esc (Cerrar modales/cancelar)
  newItem?: () => void;  // Ctrl + N (Nuevo registro)
  save?: () => void;     // Ctrl + S (Guardar forzoso)
};

/**
 * Hook para manejar atajos de teclado globales o locales.
 * Usa {capture: true} para interceptar eventos antes que Obsidian.
 */
export const useHotkeys = (keyMap: KeyMap, deps: any[] = []) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // 1. GUARDAR / ENVIAR (Ctrl + Enter)
      if (isCtrlOrCmd && event.key === 'Enter') {
        if (keyMap.submit) {
          event.preventDefault();
          event.stopPropagation();
          keyMap.submit();
        }
      }

      // 2. NUEVO ITEM (Ctrl + N)
      if (isCtrlOrCmd && event.key === 'n') {
        if (keyMap.newItem) {
          event.preventDefault();
          event.stopPropagation();
          keyMap.newItem();
        }
      }

      // 3. GUARDAR GLOBAL (Ctrl + S)
      if (isCtrlOrCmd && event.key === 's') {
        if (keyMap.save) {
          event.preventDefault();
          // No detenemos propagación aquí para permitir que Obsidian 
          // también guarde el archivo si es necesario.
          keyMap.save();
        }
      }

      // 4. CERRAR / CANCELAR (Escape)
      if (event.key === 'Escape') {
        if (keyMap.escape) {
          event.preventDefault();
          event.stopPropagation();
          keyMap.escape();
        }
      }
    };

    // 'true' habilita useCapture: el evento se dispara en la fase de bajada,
    // interceptándolo antes de que llegue a los elementos internos o burbujee.
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, deps);
}; 