import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Input, InputProps } from './Input';
import { useFinanceData } from '../../context/FinanceContext';

interface NumericInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: string | number;
  onValueChange: (val: string) => void;
  currency?: string;
  placeholder?: string;
  allowNegatives?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  currency,
  allowNegatives = true,
  ...props
}) => {
  const { settings } = useFinanceData();
  const locale = settings?.language === 'es' ? 'es-CO' : undefined;

  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);
  const isEditing = useRef(false);

  // --- FORMATTER ---
  const formatNumber = (val: string | number) => {
    if (val === '' || val === undefined || val === null) return '';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '';

    // Usar el locale detectado para formatear
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 // Opcional: configurar según moneda
    }).format(num);
  };

  // --- SYNC EXTERNAL STATE ---
  useEffect(() => {
    if (!isEditing.current) {
      setLocalValue(formatNumber(value));
    }
  }, [value, locale]);

  // --- CURSOR MANAGEMENT ---
  useLayoutEffect(() => {
    if (inputRef.current && cursorRef.current !== null) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isEditing.current = true;
    const input = e.target;
    const rawInput = input.value;
    const oldCaret = input.selectionStart || 0;

    // 1. Limpiar input: dejar solo números, coma y punto (y menos)
    let clean = rawInput;
    if (allowNegatives) {
      clean = clean.replace(/[^0-9.,-]/g, '');
    } else {
      clean = clean.replace(/[^0-9.,]/g, '');
    }

    // 2. Normalizar a número para JS (1.000,50 -> 1000.50)
    // Estrategia robusta: eliminar separadores de miles, punto por coma decimal
    // Asumimos que si hay coma y punto, punto es mil, coma es decimal (ES-CO)
    // O si solo hay punto y es locale ES, es mil.
    // Para simplificar y ser "neutral":
    // Eliminamos todo menos dígitos y el ACEPTADO decimal separator.
    // Pero como Intl formatea, debemos saber qué separador usa Intl.

    // HACK: Determinamos separador decimal del locale actual
    const parts = new Intl.NumberFormat(locale).formatToParts(1111.1);
    const decimalPart = parts.find(p => p.type === 'decimal');
    const decimalChar = decimalPart ? decimalPart.value : '.';
    const groupPart = parts.find(p => p.type === 'group');
    const groupChar = groupPart ? groupPart.value : ',';

    // Contamos dígitos antes del cursor para restaurar posición visual
    let digitsBeforeCaret = 0;
    for (let i = 0; i < oldCaret; i++) {
      if (/[0-9]/.test(rawInput[i])) digitsBeforeCaret++;
    }

    // 3. Parsear valor crudo a número real
    // Reemplazamos el groupChar por nada
    let parseable = clean.split(groupChar).join('');
    // Reemplazamos el decimalChar por punto estándar
    parseable = parseable.replace(decimalChar, '.');
    // Also replace comma with dot if it wasn't the decimalChar (handling the cross-case)
    if (decimalChar !== ',') parseable = parseable.replace(',', '.');

    // Casos borde de tipeo (ej: usuario escribe la coma decimal)
    // Si el usuario acaba de escribir el decimalChar, no queremos re-formatear violentamente
    // Si el input termina en decimalChar, mantenemos el string tal cual visualmente
    // para permitir escribir los decimales.

    const isTypingDecimal = rawInput.endsWith(decimalChar) || rawInput.endsWith('.') || rawInput.endsWith(',');

    if (clean === '' || clean === '-') {
      setLocalValue(clean);
      onValueChange(''); // O 0
      return;
    }

    // Si termina en decimal, actualizamos localValue pero no onValueChange (o sí, pero parcial)
    if (isTypingDecimal) {
      setLocalValue(clean); // Dejar que escriba la coma
      // No formateamos todavía para no borrar la coma
      // Pero intentamos parsear lo que lleva
      const num = parseFloat(parseable);
      if (!isNaN(num)) onValueChange(parseable); // Guardar valor numérico parcial

      // Mantener cursor donde está
      cursorRef.current = oldCaret;
      return;
    }

    const num = parseFloat(parseable);

    if (isNaN(num)) {
      // Fallback
      setLocalValue(clean);
      return;
    }

    // 4. Formatear
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 20 // Permitir ver todos los decimales mientras edita?
    }).format(num);

    // Ajuste de cursor inteligente
    // Recorrer el nuevo string y parar cuando hayamos visto 'digitsBeforeCaret' dígitos.
    let newCaret = 0;
    let digitsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (digitsSeen >= digitsBeforeCaret) break;
      if (/[0-9]/.test(formatted[i])) digitsSeen++;
      newCaret++;
    }

    // Si el usuario borró un separador, el cursor podría quedar mal.
    // Pero esta lógica de "dígitos vistos" suele ser muy sólida.

    setLocalValue(formatted);
    cursorRef.current = newCaret;

    // Notificar al padre el valor numérico estándar (1000.50)
    onValueChange(parseable);
  };

  const handleBlur = () => {
    isEditing.current = false;
    // Re-formatear final (standardize decimals)
    setLocalValue(formatNumber(value));
  };

  const handleFocus = () => {
    isEditing.current = true;
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      inputMode="decimal"
      rightElement={
        currency ? (
          <span className="text-xs font-bold text-muted pointer-events-none select-none">
            {currency}
          </span>
        ) : undefined
      }
    />
  );
};