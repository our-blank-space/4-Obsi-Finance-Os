// src/services/LedgerService.ts
import { App, TFile, normalizePath } from 'obsidian';
import { Transaction } from '../types';

type LedgerIndex = {
    version: number;
    knownIds: Record<string, true>;
};

export class LedgerService {
    private app: App;
    private ledgerPath: string;
    private indexPath: string;

    constructor(app: App, basePath: string = 'Finance/Ledger') {
        this.app = app;
        this.ledgerPath = normalizePath(`${basePath}/ledger.jsonl`);
        this.indexPath = normalizePath(`${basePath}/index.json`);
    }

    /**
     * Sincroniza múltiples transacciones con el archivo Ledger.
     * CLAVE: Este es el método que resuelve el error TS2339.
     */
    async sync(events: Transaction[]): Promise<void> {
        if (!events || events.length === 0) return;

        // Ordenar por fecha para mantener el archivo organizado
        const sorted = [...events].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (const event of sorted) {
            try {
                await this.append(event);
            } catch (e) {
                console.error(`FinanceOS: Failed to sync event ${event.id}`, e);
            }
        }
    }

    /**
     * Añade una única transacción si no existe previamente (Idempotencia).
     */
    async append(event: Transaction): Promise<void> {
        this.validateEvent(event);

        const index = await this.loadIndex();
        if (index.knownIds[event.id]) {
            return; // Ya registrada, ignorar.
        }

        const file = await this.ensureLedgerFile();

        const record = {
            ledgerVersion: 1,
            ...event,
            recordedAt: new Date().toISOString()
        };

        const line = JSON.stringify(record);
        const current = await this.app.vault.read(file);
        const next = current ? current + '\n' + line : line;

        await this.app.vault.modify(file, next);

        index.knownIds[event.id] = true;
        await this.saveIndex(index);
    }

    private validateEvent(event: Transaction) {
        if (!event.id) throw new Error('Ledger: event.id is required');
        if (!event.date) throw new Error(`Ledger: invalid date for event ${event.id}`);
        if (!event.currency) throw new Error(`Ledger: currency missing for event ${event.id}`);
        if (typeof event.amount !== 'number') throw new Error(`Ledger: invalid amount for event ${event.id}`);
    }

    private async ensureLedgerFile(): Promise<TFile> {
        const folder = this.ledgerPath.split('/').slice(0, -1).join('/');
        if (folder && !this.app.vault.getAbstractFileByPath(folder)) {
            await this.app.vault.createFolder(folder);
        }

        const existing = this.app.vault.getAbstractFileByPath(this.ledgerPath);
        if (existing instanceof TFile) return existing;

        return await this.app.vault.create(this.ledgerPath, '');
    }

    private async loadIndex(): Promise<LedgerIndex> {
        const existing = this.app.vault.getAbstractFileByPath(this.indexPath);
        if (existing instanceof TFile) {
            const raw = await this.app.vault.read(existing);
            try {
                return JSON.parse(raw);
            } catch (e) {
                return { version: 1, knownIds: {} };
            }
        }

        const fresh: LedgerIndex = { version: 1, knownIds: {} };
        await this.saveIndex(fresh);
        return fresh;
    }

    private async saveIndex(index: LedgerIndex) {
        const content = JSON.stringify(index, null, 2);
        const existing = this.app.vault.getAbstractFileByPath(this.indexPath);

        if (existing instanceof TFile) {
            await this.app.vault.modify(existing, content);
        } else {
            // Asegurar que la carpeta existe antes de crear el archivo
            const folder = this.indexPath.split('/').slice(0, -1).join('/');
            if (folder && !this.app.vault.getAbstractFileByPath(folder)) {
                await this.app.vault.createFolder(folder);
            }
            await this.app.vault.create(this.indexPath, content);
        }
    }
    /**
     * NUEVO: Genera o actualiza una nota única por mes con todas las transacciones.
     * Ej: "Finance/Ledger/2026-02.md"
     */
    async updateMonthlyLedger(transactions: Transaction[], date: string) {
        const month = date.slice(0, 7); // "2026-02"
        const folderPath = 'Finance/Ledger';
        const filePath = normalizePath(`${folderPath}/${month}.md`);

        // 1. Filtrar transacciones de ese mes
        const monthlyTxs = transactions
            .filter(t => t.date.startsWith(month))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (monthlyTxs.length === 0) return;

        // 2. Calcular totales rápidos para el header
        const income = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        // 3. Construir contenido Markdown (Legible y limpio)
        const lines = [
            `---`,
            `type: finance-monthly-ledger`,
            `month: ${month}`,
            `updated: ${new Date().toISOString()}`,
            `---`,
            ``,
            `# 📒 Libro Mayor: ${month}`,
            ``,
            `**Resumen Rápido:**`,
            `- 💰 Ingresos: **${income.toLocaleString()}**`,
            `- 💸 Gastos: **${expense.toLocaleString()}**`,
            `- 📉 Balance: **${(income - expense).toLocaleString()}**`,
            ``,
            `## 📝 Detalle de Movimientos`,
            ``,
            `| Día | Categoría | Detalle | Cuenta | Monto | Tipo |`,
            `| :-- | :--- | :--- | :--- | :---: | :---: |`
        ];

        monthlyTxs.forEach(t => {
            const day = t.date.slice(8, 10);
            const icon = t.type === 'income' ? '🟢' : t.type === 'expense' ? '🔴' : '🔄';
            const link = t.wikilink ? `[[${t.wikilink}]]` : '';
            // Limpiamos la nota de caracteres que rompan la tabla
            const cleanNote = (t.note || '').replace(/\|/g, '-').replace(/\n/g, ' ');

            lines.push(`| ${day} | ${t.area} | ${cleanNote} ${link} | ${t.from} | ${t.amount.toLocaleString()} ${t.currency} | ${icon} |`);
        });

        lines.push(``, `---`, `*Generado automáticamente por FinanceOS*`);

        // 4. Escribir en disco (Crear carpeta si no existe)
        await this.ensureFolder(folderPath);
        const file = this.app.vault.getAbstractFileByPath(filePath);

        if (file instanceof TFile) {
            await this.app.vault.modify(file, lines.join('\n'));
        } else {
            await this.app.vault.create(filePath, lines.join('\n'));
        }
    }

    private async ensureFolder(path: string) {
        if (!this.app.vault.getAbstractFileByPath(path)) {
            try {
                await this.app.vault.createFolder(path);
            } catch (e) { /* Ignore if exists */ }
        }
    }
}