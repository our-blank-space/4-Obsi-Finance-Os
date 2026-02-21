import '@testing-library/jest-dom'; // Importante: Esto añade los matchers como 'toBeInTheDocument'
import { cleanup } from '@testing-library/react';

// Mock de LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de VisualViewport para evitar errores en tests de móvil
Object.defineProperty(window, 'visualViewport', {
  value: {
    height: 800,
    width: 400,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  configurable: true
});

// Mock global de Obsidian Notice
(global as any).Notice = jest.fn((message: string) => {
  // Silently mock Notice to avoid console spam
});

// Mock global de crypto para UUID
if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };
}


// Limpiar el DOM después de cada test para evitar contaminación entre pruebas
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});