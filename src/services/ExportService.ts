// src/services/ExportService.ts
import { Ledger } from "../types";

export class ExportService {
    static exportToCSV(transactions: Ledger.Transaction[], filename: string = 'finance_os_report.csv') {
        const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Status', 'Description'];
        
        const rows = transactions.map(tx => [
            tx.id,
            tx.date,
            tx.type,
            tx.amount.toString(),
            tx.currency,
            tx.area || '',
            tx.from || '',
            tx.status || 'cleared',
            `"${(tx.note || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static exportToPDF(transactions: Ledger.Transaction[], windowTitle: string = 'Financial Report') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            console.error("Popup blocker prevented printing.");
            return;
        }

        const recentTxs = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const rowsHtml = recentTxs.map(tx => `
            <tr>
                <td>${tx.date}</td>
                <td><span style="text-transform: capitalize;">${tx.type}</span></td>
                <td>${tx.area}</td>
                <td>${tx.from}</td>
                <td style="text-align: right; font-family: monospace;">${tx.amount.toLocaleString()} ${tx.currency}</td>
                <td>${tx.status || 'cleared'}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${windowTitle}</title>
                <style>
                    body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #333; }
                    h1 { text-align: center; color: #111; margin-bottom: 10px; }
                    .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 40px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border-bottom: 1px solid #ddd; padding: 12px 8px; text-align: left; }
                    th { font-weight: bold; background-color: #f9f9f9; text-transform: uppercase; font-size: 10px; color: #555; }
                    .footer { text-align: center; margin-top: 60px; font-size: 10px; color: #999; }
                </style>
            </head>
            <body>
                <h1>Control Financiero</h1>
                <div class="subtitle">Reporte Contable - Generado el ${new Date().toLocaleDateString()}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Categoría</th>
                            <th>Cuenta Corigen</th>
                            <th style="text-align: right;">Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="footer">FinanceOS - Generado Automáticamente</div>
                <script>
                    window.onload = function() { 
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
}
