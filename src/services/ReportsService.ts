// src/services/ReportsService.ts
import { App, TFile, normalizePath } from 'obsidian';
import { WeeklySnapshot, AssetProject, Loan, Debt, Trade } from '../types';

export class ReportsService {
    app: App;
    baseFolder: string;

    constructor(app: App, baseFolder: string = 'Finance/Records') {
        this.app = app;
        this.baseFolder = baseFolder;
    }

    // --- 1. PATRIMONIO (NET WORTH) ---
    async syncSnapshots(snapshots: WeeklySnapshot[]) {
        if (!snapshots.length) return;
        const filePath = normalizePath(`${this.baseFolder}/Net-Worth-History.md`);
        const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const lines = [
            `---`, `type: finance-net-worth`, `entries: ${sorted.length}`, `updated: ${new Date().toISOString()}`, `---`,
            ``, `# 📈 Historial de Patrimonio Neto`, ``,
            `| Fecha | Patrimonio Total | Moneda | Notas |`,
            `| :--- | :--- | :---: | :--- |`
        ];

        sorted.forEach(s => {
            const note = s.note ? s.note.replace(/\n/g, ' ') : '';
            lines.push(`| ${s.date} | **${s.patrimonio.toLocaleString()}** | ${s.currency} | ${note} |`);
        });

        await this.write(filePath, lines.join('\n'));
    }

    // --- 2. ACTIVOS (INVENTORY) ---
    async syncAssets(assets: AssetProject[]) {
        if (!assets.length) return;
        const filePath = normalizePath(`${this.baseFolder}/Assets-Inventory.md`);
        const activeCount = assets.filter(a => a.status === 'active').length;

        const lines = [
            `---`, `type: finance-assets`, `active: ${activeCount}`, `updated: ${new Date().toISOString()}`, `---`,
            ``, `# 📦 Inventario de Activos`, ``,
            `| Estado | Nombre | Tipo | Invertido | Retorno | PnL | ROI | Notas | Link |`,
            `| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |`
        ];

        assets.forEach(asset => {
            const costs = asset.entries.filter(e => e.type === 'cost').reduce((s, e) => s + e.amount, 0);
            const revenue = asset.entries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.amount, 0);
            const profit = revenue - costs;
            const roi = costs > 0 ? ((profit / costs) * 100).toFixed(1) + '%' : '∞';
            const statusIcon = asset.status === 'active' ? '🟢' : '📦';
            const link = asset.wikilink ? `[[${asset.wikilink}]]` : '';
            const note = (asset.notes || '').replace(/\n/g, ' ').slice(0, 30);

            lines.push(`| ${statusIcon} | **${asset.name}** | ${asset.type} | ${costs.toLocaleString()} | ${revenue.toLocaleString()} | ${profit.toLocaleString()} ${asset.currency} | ${roi} | ${note} | ${link} |`);
        });

        await this.write(filePath, lines.join('\n'));
    }

    // --- 3. DEUDAS Y PRÉSTAMOS ---
    async syncCredit(loans: Loan[], debts: Debt[]) {
        if (!loans.length && !debts.length) return;
        const filePath = normalizePath(`${this.baseFolder}/Debts-Loans.md`);
        
        const lines = [
            `---`, `type: finance-credit`, `updated: ${new Date().toISOString()}`, `---`,
            ``, `# ⚖️ Deudas y Préstamos`, ``,
            `## 🟢 Por Cobrar (Loans)`,
            `| Deudor | Principal | Cobrado | Pendiente | Estado |`, `| :--- | :--- | :--- | :--- | :--- |`
        ];

        loans.forEach(l => {
            const pending = l.principal - l.collected;
            lines.push(`| **${l.borrowerName}** | ${l.principal.toLocaleString()} | ${l.collected.toLocaleString()} | **${pending.toLocaleString()}** | ${pending <= 0 ? '✅' : '⏳'} |`);
        });

        lines.push(``, `## 🔴 Por Pagar (Debts)`, `| Acreedor | Principal | Pagado | Pendiente | Estado |`, `| :--- | :--- | :--- | :--- | :--- |`);

        debts.forEach(d => {
            const pending = d.principal - d.paid;
            lines.push(`| **${d.lenderName}** | ${d.principal.toLocaleString()} | ${d.paid.toLocaleString()} | **${pending.toLocaleString()}** | ${pending <= 0 ? '✅' : '⏳'} |`);
        });

        await this.write(filePath, lines.join('\n'));
    }

    // --- 4. TRADING ---
    async syncTrading(trades: Trade[]) {
        if (trades.length === 0) return;
        const filePath = normalizePath(`${this.baseFolder}/Trading-Journal.md`);
        const closed = trades.filter(t => t.status === 'closed').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalPnL = closed.reduce((acc, t) => acc + t.pnl, 0);

        const lines = [
            `---`, `type: finance-trading`, `updated: ${new Date().toISOString()}`, `---`,
            ``, `# 📊 Trading Journal`, `**Total PnL:** ${totalPnL.toLocaleString()}`, ``,
            `| Fecha | Symbol | L/S | PnL | % | Strategy |`, `| :--- | :--- | :---: | :--- | :--- | :--- |`
        ];

        closed.forEach(t => {
            const side = t.side === 'buy' ? 'LONG' : 'SHORT';
            const icon = t.pnl >= 0 ? '🟢' : '🔴';
            lines.push(`| ${t.date} | **${t.symbol}** | ${side} | ${icon} ${t.pnl} | ${t.pnlPercentage.toFixed(2)}% | ${t.strategy} |`);
        });

        await this.write(filePath, lines.join('\n'));
    }

    /**
     * Escribe en disco de forma inteligente (Dirty Check)
     */
    private async write(path: string, content: string) {
        try {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                const currentContent = await this.app.vault.read(file);
                
                // Comparamos sin tener en cuenta la fecha de actualización
                if (this.stripMetadata(currentContent) === this.stripMetadata(content)) {
                    return;
                }
                
                await this.app.vault.modify(file, content);
            } else {
                // Crear carpetas si no existen
                const folderPath = path.substring(0, path.lastIndexOf('/'));
                if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
                    await this.app.vault.createFolder(folderPath);
                }
                await this.app.vault.create(path, content);
            }
        } catch (error) {
            console.error(`Error writing report to ${path}`, error);
        }
    }

    /**
     * Remueve la marca de tiempo para comparar solo los datos financieros reales
     */
    private stripMetadata(c: string): string {
        return c.replace(/updated: .*\n/, "");
    }
} 