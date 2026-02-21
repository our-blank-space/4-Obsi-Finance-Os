/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- BASE (Obsidian Theme Variables) ---
        primary: "var(--background-primary)",
        secondary: "var(--background-secondary)",
        "secondary-alt": "var(--background-secondary-alt)",
        
        // --- BORDES Y SEPARADORES ---
        border: "var(--background-modifier-border)",
        "border-hover": "var(--background-modifier-border-hover)",
        
        // --- TEXTO ---
        normal: "var(--text-normal)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        "on-accent": "var(--text-on-accent)",
        
        // --- INTERACCIÓN ---
        accent: "var(--interactive-accent)",
        "accent-hover": "var(--interactive-accent-hover)",
        
        // --- FORMULARIOS ---
        "form-bg": "var(--background-modifier-form-field)",
        
        // --- ESTADOS (Mapeo semántico sugerido) ---
        error: "var(--text-error)",
        success: "var(--text-success)",
        selection: "var(--text-selection)",
      },
      fontFamily: {
        sans: ["var(--font-interface)"],
        mono: ["var(--font-monospace)"],
      },
      boxShadow: {
        'obsidian': '0 4px 12px var(--background-modifier-box-shadow)',
        'obsidian-lg': '0 10px 30px var(--background-modifier-box-shadow)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'zoom-in': 'zoomIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // CRÍTICO: Evita conflictos con CSS base de Obsidian
  }
} 