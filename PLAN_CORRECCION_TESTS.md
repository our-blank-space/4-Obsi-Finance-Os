# 🔍 Plan de Corrección de Tests

## Problemas Identificados

### 1. **Tipos Incompatibles en BackupService.test.ts**
El test usa una interfaz `PluginData` antigua que no coincide con la actual.

**Problemas:**
- Usa `language: 'es'` directamente en PluginData (ya no existe)
- Usa `accounts: string[]` (ahora es `accountRegistry: FinanceAccount[]`)
- Usa `areas: string[]` (ahora es `categoryRegistry: FinanceCategory[]`)
- Falta `exchangeRate: number` (deprecated pero requerido)
- Falta muchos campos requeridos

### 2. **Mock de Obsidian**
Falta `TFolder` en el mock que es usado por PersistenceService

### 3. **Importaciones Incorrectas**
Varios tests importan tipos que ya no existen o han cambiado de namespace

---

## Soluciones

### Fix 1: Actualizar BackupService.test.ts
