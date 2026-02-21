// src/hooks/useObsidian.ts
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

export const useObsidianLink = () => {
  const { state, api } = useFinance();

  /**
   * Abre un enlace de Obsidian (WikiLink)
   */
  const openLink = (linkText: string) => {
    if (!linkText) return;
    const cleanLink = linkText.replace(/\[\[|\]\]/g, '');
    api.openLink(cleanLink);
  };

  /**
   * Orquesta la creación de notas físicas basado en la estrategia del usuario.
   * - 'dailyNote': Una nota por día (escalable, recomendado)
   * - 'singleFile': Una nota por transacción (legacy)
   */
  const createTransactionNote = async (t: Transaction) => {
    // Si se llama explícitamente, se procede. El control está en el UI (TransactionForm)
    // Se elimina el chequeo global redundante que bloqueaba la creación manual.

    try {
      if (state.settings.loggingStrategy === 'dailyNote') {
        await appendToDailyNote(t);
      } else {
        await createIndividualNote(t);
      }
    } catch (e) {
      console.error("FinanceOS: Error creando nota física:", e);
    }
  };

  /**
   * ESTRATEGIA RECOMENDADA: Añade la transacción a una nota diaria.
   * Si la nota del día no existe, la crea. Si existe, añade al final.
   * Reduce drásticamente el número de archivos en el vault.
   */
  const appendToDailyNote = async (t: Transaction) => {
    const folder = state.settings.transactionsFolder || 'Finance/Journal';
    const dailyNotePath = `${folder}/${t.date}`;

    // Determinar el ícono según el tipo
    const typeIcon = t.type === 'income' ? '💰' : t.type === 'expense' ? '💸' : '🔄';
    const typeLabel = t.type === 'income' ? 'Ingreso' : t.type === 'expense' ? 'Gasto' : 'Traslado';

    // Formato de entrada para añadir a la nota diaria
    const transactionEntry = `
---

### ${typeIcon} ${typeLabel}: ${t.note || 'Sin Detalle'}
- **ID:** \`${t.id}\`
- **Monto:** ${t.amount.toLocaleString()} ${t.currency}
- **Categoría:** ${t.area}
- **Cuenta:** ${t.from}${t.type === 'transfer' && t.to ? ` → ${t.to}` : ''}
`;

    // Usar la nueva API para verificar si existe y añadir
    const wasAppended = await api.appendToNote(dailyNotePath, transactionEntry);

    if (wasAppended) {
      // No log
    } else {
      // El archivo no existe: crear con frontmatter inicial
      const initialContent = `---
type: finance-daily-log
date: ${t.date}
---

# 📊 Diario Financiero - ${t.date}

> Registro automático de movimientos del día.

${transactionEntry}
`;
      await api.createNote(dailyNotePath, initialContent);
      // No log
    }
  };

  /**
   * ESTRATEGIA LEGACY: Crea un archivo individual por cada transacción.
   * No recomendado para uso intensivo por el impacto en el vault.
   */
  const createIndividualNote = async (t: Transaction) => {
    const folder = state.settings.transactionsFolder || 'Finance/Transactions';

    // Limpiar el nombre del archivo de caracteres no permitidos
    const safeNote = (t.note || 'Sin Detalle').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 50);
    const fileName = `${t.date} - ${safeNote}`;
    const fullPath = `${folder}/${fileName}`;

    const content = `---
type: finance-transaction
id: ${t.id}
transactionType: ${t.type}
---

# 💸 Detalle de Transacción

- **Tipo:** [type:: ${t.type}]
- **Monto:** [amount:: ${t.amount}] [currency:: ${t.currency}]
- **Fecha:** [date:: ${t.date}]
- **Categoría:** [category:: ${t.area}]
- **Desde:** [from:: ${t.from}]
${t.to && t.to !== 'none' ? `- **Hacia:** [to:: ${t.to}]` : ''}

## 📝 Notas
${t.note || 'Sin observaciones.'}

---
*Generado automáticamente por Finance OS*
`;

    await api.createNote(fullPath, content);
  };

  return { openLink, createTransactionNote };
};