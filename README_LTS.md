# FinanceOS - Protocolo de Estabilidad (LTS)

## Principios de Arquitectura
1. **La UI es efímera, los Datos son eternos.** Nunca mezclar estado de sesión (modales) con estado de dominio (dinero) en el mismo Context Provider.
2. **Escritura Asíncrona Serializada.** La persistencia ocurre en una cola (`PersistenceService`). Nunca escribir directamente al disco desde un componente React.
3. **Inmutabilidad Histórica.** El valor de una transacción pasada no cambia si cambia la tasa de cambio hoy. Usar `exchangeRateSnapshot` o mecanismos similares.

## Puntos de Mantenimiento (Si algo falla)
- **Performance:** Si el input se siente lento, verificar que `DailyTransactions` esté recibiendo solo el slice de datos necesario, no todo el array histórico.
- **Sync:** Si hay conflictos con Obsidian Sync, desactivar `atomicWrite` y usar escritura directa (`safeWrite: false`), confiando en los backups rotativos de FinanceOS.
- **Cálculos:** Todo cálculo monetario debe usar `CurrencyMath`. Prohibido usar `+` o `*` directamente con floats.
- **Integridad:** `MigrationManager` protege contra downgrades. Nunca forzar la carga de datos de una versión `data.version` mayor a la soportada por el plugin.

## Procedimiento de Emergencia
Si los datos no cargan:
1. Activar "Safe Mode" en `main.ts` (modificando `FinanceProvider` para ignorar la carga inicial si es necesario o usando los flags de debug).
2. Revisar `data.json` manualmente en la carpeta del plugin.
3. Restaurar desde `.finance-db/backups/` (o la nueva ruta `Finance/Backups`).
4. Usar el comando "Factory Reset" solo como último recurso despues de hacer backup manual.
