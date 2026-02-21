// src/services/VaultParserService.ts
import { App, TFile } from 'obsidian';
import { Transaction, TransactionType, Currency } from '../types';

export class VaultParserService {
    app: App;
    defaultCurrency: Currency;

    constructor(app: App, defaultCurrency: Currency = 'USD') {
        this.app = app;
        this.defaultCurrency = defaultCurrency;
    }

    /**
     * Lee un archivo Markdown del Vault y lo convierte en un objeto Transaction.
     * CORRECCIÓN: Ahora prioriza el tipo de transacción guardado en metadatos
     * para evitar que los gastos se conviertan en ingresos.
     */
    async parseTransactionFile(file: TFile): Promise<Transaction | null> {
        try {
            const content = await this.app.vault.read(file);
            const cache = this.app.metadataCache.getFileCache(file);
            const frontmatter = cache?.frontmatter;

            // 1. Validar que sea un archivo generado por nuestro plugin
            if (frontmatter?.type !== 'finance-transaction') return null;

            // 2. Extraer ID (Vital para evitar duplicidad)
            const id = frontmatter.id;
            if (!id) return null;

            // 3. Helper para extraer campos Dataview: [key:: value]
            const extractField = (field: string) => {
                const regex = new RegExp(`\\[${field}::\\s*(.*?)\\]`, 'i');
                const match = content.match(regex);
                return match ? match[1].trim() : null;
            };

            // 4. DETERMINAR EL TIPO (Lógica Blindada)
            // Prioridad 1: frontmatter (YAML)
            // Prioridad 2: campo inline [type:: ...]
            // Prioridad 3: Heurística por monto (Fallback para notas viejas)
            const rawType = frontmatter.transactionType || extractField('type');
            const toField = extractField('to') || 'none';
            const rawAmount = parseFloat(extractField('amount') || '0');

            let type: TransactionType;

            if (rawType) {
                // Si existe el dato explícito, lo usamos directamente
                type = rawType as TransactionType;
            } else {
                // Compatibilidad con notas antiguas que no tenían el campo 'type'
                if (toField !== 'none' && toField !== '') {
                    type = TransactionType.TRANSFER;
                } else {
                    // Si el monto era negativo en el texto o positivo, intentamos deducir
                    // Pero con la nueva actualización, esto casi no se usará.
                    type = rawAmount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
                }
            }

            // 5. Extraer y limpiar datos numéricos
            // Siempre guardamos el monto absoluto, el 'type' define el impacto contable
            const amount = Math.abs(rawAmount);
            const currency = (extractField('currency') || this.defaultCurrency) as Currency;
            const date = extractField('date') || file.basename.substring(0, 10);
            const from = extractField('from') || 'unknown';
            const area = extractField('category') || 'other';

            // 6. Extraer IDs normalizados (V3 Hardening)
            const fromId = frontmatter.fromId || extractField('fromId');
            const toId = frontmatter.toId || extractField('toId');
            const areaId = frontmatter.areaId || extractField('areaId');

            // 7. Extraer la nota (todo lo que esté después de ## 📝 Notas)
            const noteMatch = content.split('## 📝 Notas');
            let note = '';
            if (noteMatch.length > 1) {
                // Quitamos posibles metadatos de cierre o espacios
                note = noteMatch[1].split('---')[0].trim();
            }

            return {
                id,
                date,
                type,
                amount,
                from,
                to: toField,
                area,
                fromId,
                toId,
                areaId,
                note,
                currency,
                wikilink: '' // Se reconstruye en la UI si es necesario
            };
        } catch (e) {
            console.error("FinanceOS: Error parseando archivo:", file.path, e);
            return null;
        }
    }
}