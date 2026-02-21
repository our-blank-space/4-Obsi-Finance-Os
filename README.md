# Finance OS - Plugin para Obsidian

**Versión:** 2.1.5  
**Autor:** Andres Vega  
**Estado:** ✅ Listo para Producción

## 📋 Descripción

Finance OS es un sistema operativo financiero completo integrado en Obsidian. Gestiona tus finanzas personales con módulos avanzados para presupuestos, inversiones, trading, activos, créditos y mucho más.

## ✨ Características Principales

### � Gestión Financiera Core
- **Dashboard Interactivo**: Vista general con gráficos de net worth, proyecciones y análisis AI
- **Cuentas Bancarias**: Gestión multi-cuenta y multi-divisa con conversión automática
- **Transacciones Diarias**: Registro rápido con categorización inteligente
- **Presupuestos**: Control mensual con alertas de sobre-gasto
- **Transacciones Recurrentes**: Automatización de gastos fijos

### 📊 Módulos Avanzados
- **Trading Journal**: Registro completo de operaciones con análisis de performance
- **Portfolio de Inversiones**: Seguimiento de activos (acciones, crypto, inmuebles)
- **Préstamos y Créditos**: Gestión de deudas con calculadora de amortización
- **Negocios y Proyectos**: Tracking de flujos de caja por proyecto
- **Ventas (RUVI)**: Registro universal de ventas con cálculo automático de ganancias
- **Snapshots Semanales**: Capturas de patrimonio neto para análisis histórico

### 🤖 Inteligencia Artificial
- **Análisis Predictivo**: Proyecciones basadas en tus patrones de gasto
- **Categorización Automática**: ML sugiere categorías para transacciones
- **CEO Briefing**: Resúmenes ejecutivos generados por AI
- **OCR de Recibos**: Extracción de datos de imágenes de facturas

### 🔧 Características Técnicas
- **Multi-idioma**: Español e Inglés completos
- **Modo Privacidad**: Oculta cantidades con un clic
- **Backup Automático**: Respaldo incremental de datos
- **Smart Ledger**: Generación automática de notas Markdown por mes
- **Export/Import**: CSV para integración con otros sistemas
- **Offline First**: Funciona 100% local sin internet

## 🚀 Instalación

1. Descarga los archivos `main.js`, `styles.css` y `manifest.json`
2. Crea la carpeta `.obsidian/plugins/finance-os-plugin2` en tu vault
3. Copia los archivos descargados a esa carpeta
4. Reinicia Obsidian
5. Habilita el plugin en Configuración → Plugins de comunidad

## 💻 Desarrollo

### Requisitos
- Node.js 16+
- npm

### Scripts Disponibles
```bash
npm install           # Instalar dependencias
npm run dev          # Modo desarrollo (watch)
npm run build        # Build de producción optimizado
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
```

### Estructura del Proyecto
```
src/
├── components/       # Componentes React de UI
├── context/         # Estado global y reducers
├── core/            # Lógica de negocio central
├── hooks/           # React hooks personalizados
├── logic/           # Calculadores y utilidades de negocio
├── persistence/     # Repositorios y gestión de datos
├── services/        # Servicios (AI, FX, Backup, etc.)
├── types/           # Definiciones TypeScript
└── utils/           # Utilidades generales
```

## 📦 Arquitectura de Datos

Finance OS utiliza una arquitectura de persistencia granular:

```
.finance-db/
├── core/
│   └── summaries.json      # Resúmenes financieros
├── ledger/
│   ├── 2025-01.json       # Transacciones por mes
│   ├── 2025-02.json
│   └── ...
├── wal/
│   └── recovery.log        # Write-Ahead Log
├── settings.json           # Configuración del usuario
├── infra.json             # Cuentas y categorías
├── assets.json            # Proyectos e inversiones
├── credit.json            # Préstamos y deudas
├── trading.json           # Journal de trading
├── business.json          # Negocios y flujos
├── ledger.json            # Transacciones activas
├── simulations.json       # Datos de simulación
└── custodial.json         # Cuentas custodiales
```

## 🎯 Próximas Mejoras

- [ ] Importador CSV de bancos
- [ ] Comando "Quick Add" para gastos rápidos
- [ ] Automatización completa de recurrentes
- [ ] Wikilinks a notas de Obsidian
- [ ] Modo DIAN (deducibles de impuestos)
- [ ] Sistema de logros y gamificación

## 📄 Licencia

MIT License - Ver archivo LICENSE

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir cambios mayores.

## 📞 Soporte

Si encuentras algún bug o tienes sugerencias:
- Abre un issue en GitHub
- Contacta al autor

---

**Desarrollado con ❤️ para Obsidian**