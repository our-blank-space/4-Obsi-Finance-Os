# Reparación de Configuraciones Completada

He analizado a fondo el sistema y he solucionado los problemas con las configuraciones que no funcionaban adecuadamente.

## El Problema
La interfaz de "Configuraciones" (Settings) enviaba las órdenes para cambiar el idioma, la moneda, activar módulos o importar datos, pero el "cerebro" del sistema (`dataReducer.ts`) no tenía las instrucciones para procesar estas órdenes. Por lo tanto, los cambios se ignoraban.

## La Solución
He actualizado el archivo `src/context/reducers/dataReducer.ts` agregando las siguientes capacidades:

1.  **Guardar Preferencias (`UPDATE_SETTINGS`)**: Ahora se guardan correctamente los cambios de moneda base, idioma y carpetas.
2.  **Activar Funciones (`UPDATE_FEATURE_FLAGS`)**: Ahora funciona el interruptor de Inteligencia Artificial y otros flags.
3.  **Carga de Datos (`LOAD_DATA`)**: La importación de Backups (JSON) ahora funciona.
4.  **Simulaciones (`LOAD_DEMO_DATA`)**: El modo simulación ahora carga los datos correctamente.
5.  **Módulos Adicionales**: He activado la persistencia para Custodia, Negocios, Escenarios y más.

## Verificación
Por favor, **recarga el plugin** (o cierra y abre Obsidian) y prueba cambiar cualquier configuración. Debería persistir correctamente.
