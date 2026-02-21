import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Link as LinkIcon, FilePlus, Search, Hash, Layers } from 'lucide-react';

interface SmartNoteInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    label?: string;
}

export const SmartNoteInput: React.FC<SmartNoteInputProps> = ({ value, onChange, placeholder, label }) => {
    const { api } = useFinance();
    const { t } = useTranslation();

    // ESTADOS (La memoria del componente)
    const [suggestions, setSuggestions] = useState<{ basename: string, path: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPos, setCursorPos] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0); // Para movernos con las flechas del teclado
    const [triggerType, setTriggerType] = useState<'link' | 'block' | 'header'>('link');

    const inputRef = useRef<HTMLInputElement>(null);

    // 1. REINICIAR SELECCIÓN: Cada vez que cambian las sugerencias, volvemos arriba
    useEffect(() => {
        setActiveIndex(0);
    }, [suggestions]);

    // 2. DETECTAR ESCRITURA
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart || 0;

        onChange(val);
        setCursorPos(pos);

        // Lógica de detección: ¿Qué está escribiendo el usuario?
        const lastOpenLink = val.lastIndexOf('[[', pos);
        const lastOpenBlock = val.lastIndexOf('[^', pos);

        // Prioridad: Si escribió [[ buscamos notas
        if (lastOpenLink !== -1 && lastOpenLink >= lastOpenBlock) {
            const query = val.slice(lastOpenLink + 2, pos);
            // Ignorar si ya hay un alias (simbolo |)
            if (!query.includes('|')) {
                const results = api.searchNotes(query);
                setSuggestions(results);
                setShowSuggestions(true);
                setTriggerType('link');
                return;
            }
        }
        // Si escribió [^ buscamos bloques (esto simula la búsqueda de Obsidian)
        else if (lastOpenBlock !== -1) {
            const query = val.slice(lastOpenBlock + 2, pos);
            const results = api.searchNotes(query); // Reutilizamos búsqueda para demo
            setSuggestions(results);
            setShowSuggestions(true);
            setTriggerType('block');
            return;
        }

        setShowSuggestions(false);
    };

    // 3. INSERTAR EL ENLACE
    const insertItem = (name: string) => {
        if (!inputRef.current) return;

        const val = value;
        const pos = cursorPos;

        // Identificar qué estamos cerrando
        const trigger = triggerType === 'link' ? '[[' : '[^';
        const closing = triggerType === 'link' ? ']]' : ']';
        const lastOpen = val.lastIndexOf(trigger, pos);

        if (lastOpen === -1) return;

        const before = val.slice(0, lastOpen);
        const after = val.slice(pos);

        // Construimos el link final: TextoAntes + [[Nota]] + TextoDespues
        const newValue = `${before}${trigger}${name}${closing}${after}`;

        onChange(newValue);
        setShowSuggestions(false);

        // Devolver el foco al input y poner el cursor al final
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = lastOpen + name.length + trigger.length + closing.length;
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    // 4. CONTROL POR TECLADO (↑ ↓ Enter)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % (suggestions.length + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + (suggestions.length + 1)) % (suggestions.length + 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Si el índice está en el rango de sugerencias, insertamos
            if (activeIndex < suggestions.length) {
                insertItem(suggestions[activeIndex].basename);
            } else {
                // Si el índice es el último, es "Crear nota"
                handleCreateNote();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // 5. CREAR NOTA FÍSICA
    const handleCreateNote = async () => {
        const val = value;
        const trigger = triggerType === 'link' ? '[[' : '[^';
        const lastOpen = val.lastIndexOf(trigger, cursorPos);
        const query = val.slice(lastOpen + 2, cursorPos);

        if (!query) return;

        await api.createNote(query, `# ${query}\n\nCreado automáticamente desde Finance OS.`);
        insertItem(query);
    };

    return (
        <div className="space-y-1.5 w-full relative">
            {label && (
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 block">
                    {label}
                </label>
            )}

            <div className="relative group">
                <input
                    ref={inputRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('input.smart_placeholder')}
                    className="w-full bg-[var(--background-modifier-form-field)] border border-[var(--background-modifier-border)] text-[var(--text-normal)] rounded-xl h-10 px-3 pl-10 text-sm font-medium outline-none focus:border-[var(--interactive-accent)] transition-all placeholder:text-[var(--text-faint)]"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] group-focus-within:text-[var(--interactive-accent)] transition-colors pointer-events-none">
                    {triggerType === 'block' ? <Layers size={16} /> : <LinkIcon size={16} />}
                </div>
            </div>

            {/* LISTA DE SUGERENCIAS */}
            {showSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                    {suggestions.map((file, index) => (
                        <button
                            key={file.path}
                            onClick={() => insertItem(file.basename)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between group transition-colors ${index === activeIndex ? 'bg-[var(--interactive-accent)] text-white' : 'text-[var(--text-normal)] hover:bg-[var(--background-modifier-hover)]'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Search size={12} className={index === activeIndex ? 'text-white' : 'opacity-50'} />
                                <span className="font-bold">{file.basename}</span>
                            </div>
                            {index === activeIndex && <span className="text-[10px] opacity-70 font-black tracking-widest">ENTER</span>}
                        </button>
                    ))}

                    {/* Botón de Acción Final: Crear nueva */}
                    <button
                        onClick={handleCreateNote}
                        onMouseEnter={() => setActiveIndex(suggestions.length)}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 font-bold border-t border-[var(--background-modifier-border)] transition-colors ${activeIndex === suggestions.length ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:bg-[var(--background-modifier-hover)]'
                            }`}
                    >
                        <FilePlus size={14} />
                        <span>{t('input.create_note')}</span>
                    </button>
                </div>
            )}
        </div>
    );
}; 