// src/components/CSVImporter.tsx
import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  FileUp, Check, AlertCircle, ArrowRight,
  Table as TableIcon, Trash2, X
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, Currency } from '../types';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { Select } from './ui/Input';

interface CSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Transaction[]) => Promise<void>;
}

// Campos requeridos por nuestro sistema
const SYSTEM_FIELDS = [
  { id: 'date', label: 'Fecha (YYYY-MM-DD)' },
  { id: 'amount', label: 'Monto / Valor' },
  { id: 'note', label: 'Descripción / Nota' },
  { id: 'area', label: 'Categoría / Área' },
];

export const CSVImporter: React.FC<CSVImporterProps> = ({ isOpen, onClose, onImport }) => {
  const { state } = useFinance();
  const { accountRegistry, categoryRegistry, baseCurrency, transactions: existingTransactions } = state;

  // Backward compatibility for logic below
  const accounts = accountRegistry.map(a => a.name);
  const areas = categoryRegistry.map(c => c.name);

  // Estados del proceso
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importResults, setImportResults] = useState<Transaction[]>([]);

  // 1. Procesar archivo CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          setRawRows(results.data);
          setHeaders(Object.keys(results.data[0]));
          setStep('mapping');
        }
      },
      error: (err) => alert("Error al leer el CSV: " + err.message)
    });
  };

  // 2. Convertir filas de CSV a Transacciones reales
  const processMapping = () => {
    const newTransactions: Transaction[] = rawRows.map((row) => {
      const amountRaw = String(row[mapping['amount']] || '0').replace(/[^0-9.-]/g, '');
      const amount = Math.abs(parseFloat(amountRaw));

      // Intentar determinar si es ingreso o gasto por el signo
      const type = parseFloat(amountRaw) >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;

      return {
        id: crypto.randomUUID(),
        date: row[mapping['date']] || new Date().toISOString().split('T')[0],
        amount: amount || 0,
        note: row[mapping['note']] || 'Importado de CSV',
        area: areas.includes(row[mapping['area']]) ? row[mapping['area']] : areas[0],
        from: accounts.includes(row[mapping['from']]) ? row[mapping['from']] : accounts[0],
        to: 'none',
        type: type,
        currency: baseCurrency,
        wikilink: ''
      };
    });

    // Filtro de duplicados (Mismo monto, fecha y nota)
    const filtered = newTransactions.filter(newTx =>
      !existingTransactions.some(exTx =>
        exTx.date === newTx.date &&
        exTx.amount === newTx.amount &&
        exTx.note === newTx.note
      )
    );

    setImportResults(filtered);
    setStep('preview');
  };

  // 3. Confirmar importación
  const confirmImport = async () => {
    await onImport(importResults);
    reset();
    onClose();
  };

  const reset = () => {
    setStep('upload');
    setRawRows([]);
    setMapping({});
    setImportResults([]);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importador de Datos (CSV)" icon={<FileUp size={24} />} size="lg">

      {/* PASO 1: SUBIR ARCHIVO */}
      {step === 'upload' && (
        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-secondary/20">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
            <FileUp size={32} />
          </div>
          <h3 className="text-lg font-bold mb-1">Selecciona tu archivo .csv</h3>
          <p className="text-muted text-sm mb-6 text-center max-w-xs">Puedes exportar tus movimientos desde tu banco o Excel y cargarlos aquí.</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <button type="button" className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-500 text-white hover:bg-blue-600">Buscar Archivo</button>
          </label>
        </div>
      )}

      {/* PASO 2: MAPEO DE COLUMNAS */}
      {step === 'mapping' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <p className="text-xs text-amber-200/80 leading-relaxed">Indica qué columna de tu archivo corresponde a cada dato de Finance OS.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {SYSTEM_FIELDS.map(field => (
              <div key={field.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-black text-muted">
                    {field.label.charAt(0)}
                  </div>
                  <span className="text-sm font-bold">{field.label}</span>
                </div>
                <div className="w-48">
                  <Select
                    value={mapping[field.id] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field.id]: e.target.value })}
                    options={headers}
                  />
                </div>
              </div>
            ))}
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={reset}>Atrás</Button>
            <Button
              onClick={processMapping}
              disabled={Object.keys(mapping).length < SYSTEM_FIELDS.length}
              icon={<ArrowRight size={16} />}
            >
              Previsualizar
            </Button>
          </ModalFooter>
        </div>
      )}

      {/* PASO 3: PREVIEW */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="text-xs font-black uppercase text-muted tracking-widest">Se importarán {importResults.length} registros</div>
            <div className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Deduplicación activa</div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-border rounded-2xl bg-primary/50 custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-secondary border-b border-border z-10">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Detalle</th>
                  <th className="p-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importResults.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-secondary/50">
                    <td className="p-3 font-mono text-muted">{tx.date}</td>
                    <td className="p-3 font-bold truncate max-w-[150px]">{tx.note}</td>
                    <td className={`p-3 text-right font-black ${tx.type === TransactionType.EXPENSE ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setStep('mapping')}><X size={16} className="mr-2" /> Corregir</Button>
            <Button onClick={confirmImport} icon={<Check size={16} />}>Confirmar Importación</Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
};