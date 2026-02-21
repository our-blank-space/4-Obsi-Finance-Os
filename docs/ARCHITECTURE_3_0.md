# Roadmap de Arquitectura: FinanceOS v3.0 (Long-Term Viability)

Este documento detalla la estrategia de refactorización para transformar FinanceOS de un plugin personal a un sistema financiero de grado "Enterprise" capaz de operar durante décadas.

Basado en la **Auditoría de Longevidad** realizada el 05-Feb-2026.

---

## 🛑 Estado Crítico y Riesgos
| Riesgo | Probabilidad (3 años) | Impacto | Descripción |
| :--- | :---: | :---: | :--- |
| **Colapso de Rendimiento** | 100% | Alto | `JSON.parse` de >5MB congelará Obsidian. Bloqueo de UI. |
| **Deterioro de Datos** | Alta | Crítico | Renombrar categorías rompe históricos. Strings mutables vs IDs estables. |
| **Pérdida de Integridad** | Media | Crítico | Edición retroactiva altera patrimonio histórico. Falta de bloqueos de periodo. |
| **Dependencia de Vendor** | Baja | Medio | Lógica acoplada a `obsidian.TFile`. Dificulta migración a Web/Mobile. |

---

## 🚀 Plan de Acción Inmediato (Semana 1)

### Prioridad 1: Normalización de Entidades (Data Hardening)
*Objetivo:* Eliminar la dependencia de strings mutables (`"Food"`) y migrar a IDs inmutables (`uuid`).

**Tareas:**
1.  **Diseño de Esquema Normalizado:**
    *   Crear interfaces `CategoryRegistry` y `AccountRegistry`.
    *   Definir estructura: `{ id: string, name: string, isArchived: boolean, ... }`.
2.  **Servicio de Migración (Script):**
    *   Escanear todas las transacciones existentes.
    *   Extraer valores únicos de `area` y `account`.
    *   Generar el registro maestro de IDs.
    *   Actualizar todas las transacciones reemplazando strings por IDs.
3.  **Refactor UI:**
    *   Adaptar `CategorySelector`, `AccountSelector` y gráficos para resolver IDs a nombres.

### Prioridad 2: Estrategia de Particionamiento (Sharding)
*Objetivo:* O(1) en tiempo de carga inicial, independientemente de los años de historia.

**Tareas:**
1.  **Arquitectura de Archivos:**
    *   `finance-core.json`: Configuración, catálogos (Categorías/Cuentas), Balances Actuales.
    *   `finance-2026.json`: Transacciones del año en curso.
    *   `finance-archive-YYYY.json`: Años cerrados.
2.  **Refactor `PersistenceService`:**
    *   Implementar carga "Lazy" de años anteriores.
    *   Implementar "Cierre de Año" que mueve datos de `current` a `archive`.

### Prioridad 3: Virtualización de UI (`react-window`)
*Objetivo:* Renderizado fluido con 10,000+ transacciones.

**Tareas:**
1.  **Integración:**
    *   Añadir `react-window` y `react-virtualized-auto-sizer`.
2.  **Componente `VirtualTransactionList`:**
    *   Reemplazar el `.map` en `DailyTransactions` por `FixedSizeList` o `VariableSizeList`.
    *   Gestionar alturas dinámicas para transacciones con notas largas (o truncar).

---

## 🔮 Roadmap a Largo Plazo (Fase 4+)

### 4. Integridad Contable (Ledger)
*   Implementar `PeriodLock` (Bloqueo de meses cerrados).
*   Sistema de "Contra-asientos" para correcciones históricas.
*   Checksums para validar consistencia de datos (Snapshot vs Suma de Transacciones).

### 5. Arquitectura Hexagonal
*   Abstraer `FileSystem` detrás de una interfaz `IDataProvider`.
*   Implementar `MockDataProvider` para tests unitarios ultrarrápidos.

### 6. Higiene Automatizada
*   Herramienta de "Health Check" en Ajustes.
*   Deduplicación automática.

---

## Estandarización de Código
Para soportar esta complejidad, el código debe seguir reglas estrictas:
*   **No Magic Strings:** Todo en constantes/enums.
*   **Clean Architecture:** Hooks de UI nunca tocan directamente `PersistenceService`. Usar Controladores.
*   **Testing:** Tests de migración obligatorios antes de cada release crítica.
