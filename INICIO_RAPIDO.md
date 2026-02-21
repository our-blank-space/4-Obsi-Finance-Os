# 🚀 Guía de Inicio Rápido - Finance OS

## Primeros Pasos

### 1. Verificar Instalación
Después de habilitar el plugin en Obsidian, verás un ícono de billetera en la barra lateral izquierda.

### 2. Configuración Inicial

1. **Abre Settings** (⚙️ icono en la esquina superior derecha)
2. **Configura tu divisa base**: 
   - Por defecto es COP (Peso Colombiano)
   - Puedes cambiarla a USD, EUR, etc.
3. **Define tu año fiscal inicial**:
   - Por ejemplo: 2025
4. **Configura tu idioma**:
   - Español (es) o English (en)

### 3. Crear tus Primeras Cuentas

1. Ve a **Cuentas** en el menú lateral
2. Click en **+ Agregar Cuenta**
3. Configura:
   - Nombre: Ej. "Nequi - Personal"
   - Tipo: `bank`, `cash`, `credit`, etc.
   - Divisa: COP, USD, etc.
   - Saldo inicial: El saldo actual de tu cuenta

**Ejemplo de cuentas básicas:**
```
✅ Nequi - Personal (COP)
✅ Bancolombia - Ahorros (COP)
✅ Efectivo (COP)
✅ Binance (USDT)
```

### 4. Crear Categorías

Las categorías organizan tus gastos e ingresos.

**Categorías de Gastos Recomendadas:**
- 🍔 Alimentación
- 🚗 Transporte
- 🏠 Vivienda
- 💡 Servicios
- 🎮 Entretenimiento
- 👔 Ropa
- 💊 Salud
- 📚 Educación
- 🎁 Regalos
- 💰 Otros

**Categorías de Ingresos:**
- 💼 Salario
- 💸 Freelance
- 📈 Inversiones
- 🎁 Bonos
- 💰 Otros ingresos

### 5. Tu Primera Transacción

1. Ve al **Dashboard** o **Transacciones**
2. Click en **+ Nuevo**
3. Llena el formulario:
   - **Fecha**: Hoy (auto-completado)
   - **Monto**: Ej. 25000
   - **Categoría**: Ej. Alimentación
   - **Cuenta**: Ej. Nequi - Personal
   - **Tipo**: Gasto o Ingreso
   - **Descripción**: Ej. "Almuerzo en restaurante"
4. **Guardar**

¡Listo! Ya tienes tu primer registro.

### 6. Crear un Presupuesto Mensual

1. Ve a **Presupuestos**
2. Click en **+ Nuevo Presupuesto**
3. Configura:
   - **Categoría**: Ej. Alimentación
   - **Límite mensual**: Ej. 600000
   - **Mes/Año**: 2025-02
4. **Guardar**

El sistema te alertará cuando te acerques al límite.

## 📊 Funciones Avanzadas

### Transacciones Recurrentes

Para gastos/ingresos que se repiten automáticamente:

1. Ve a **Recurrentes**
2. Click en **+ Nuevo Recurrente**
3. Configura:
   - **Descripción**: "Arriendo"
   - **Monto**: 800000
   - **Frecuencia**: Mensual
   - **Próxima fecha**: 2025-02-15
   - **Cuenta y categoría**
4. **Guardar**

El sistema te recordará ejecutar la transacción en la fecha.

### Trading Journal

Si haces trading:

1. Ve a **Trading**
2. Click en **+ Nueva Operación**
3. Registra:
   - Par: BTC/USDT
   - Lado: Long/Short
   - Entry price: 98000
   - Cantidad: 0.5 BTC
   - Stop loss: 95000
   - Take profit: 105000
4. Al cerrar, registra el resultado

El módulo calculará:
- Win rate
- Profit factor
- Sharpe ratio
- Drawdown máximo

### Portfolio de Inversiones

Para acciones, crypto, inmuebles:

1. Ve a **Activos**
2. Click en **+ Nuevo Proyecto**
3. Configura:
   - **Tipo**: Inversión
   - **Nombre**: "Bitcoin"
   - **Inversion inicial**: 10000000 COP
   - **Fecha de compra**: 2024-01-15
4. Registra flujos (rentas, dividendos):
   - Click en el activo > **+ Agregar Flujo**

### Préstamos y Créditos

#### Dinero que Prestas (Loan)
1. Ve a **Préstamos**
2. **+ Nuevo Préstamo**
3. Configura:
   - Prestatario: "Juan"
   - Monto: 2000000
   - Tasa: 2% mensual
   - Plazo: 12 meses

#### Deudas (Debt)
1. Ve a **Deudas**
2. **+ Nueva Deuda**
3. Configura:
   - Acreedor: "Banco Falabella"
   - Monto: 5000000
   - Tasa: 3.2% mensual
   - Plazo: 24 meses

El sistema calcula amortización automáticamente.

## 🎯 Tips Pro

### 1. Modo Privacidad
Click en el ícono de ojo (👁️) en la esquina superior derecha para ocultar todos los valores. Útil en pantallas compartidas.

### 2. Atajos de Teclado
- `Cmd/Ctrl + P` → Paleta de comandos
- Busca "Finance OS: Quick Add" para agregar gastos rápidos

### 3. Backup Automático
El sistema guarda automáticamente cada vez que haces cambios. Tus datos están en:
```
tu-vault/.finance-db/
```

### 4. Exportar Datos
Ve a Settings → Export Data para descargar un CSV con todas tus transacciones.

### 5. Vista Previa del Dashboard
El Dashboard muestra:
- **Net Worth Chart**: Evolución de tu patrimonio
- **Cash Flow**: Ingresos vs Gastos del mes
- **Top Categorías**: Dónde gastas más
- **Proyección 20 años**: Basada en tu tasa de retorno

### 6. Cambiar Idioma
Settings → Language → `es` o `en`

## 🔧 Solución de Problemas

### "No aparece el plugin"
1. Verifica que esté habilitado en Settings → Community Plugins
2. Reinicia Obsidian

### "No guarda mis datos"
1. Verifica permisos de escritura en tu Vault
2. Mira la consola (Cmd+Opt+I / Ctrl+Shift+I) por errores

### "Las tasas de cambio no se actualizan"
1. Verifica tu conexión a internet
2. En Settings, activa "Usar tasas manuales" si prefieres control total

### "El build falla"
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📈 Roadmap Personal

**Semana 1:** Registra tus cuentas y categorías básicas  
**Semana 2:** Ingresa transacciones de este mes  
**Semana 3:** Configura presupuestos y recurrentes  
**Semana 4:** Explora Trading/Portfolio si inviertes  
**Mes 2+:** Analiza tendencias, optimiza gastos, proyecta futuro

## 🎓 Recursos Adicionales

- **README.md**: Documentación técnica completa
- **ESTADO_FINAL.md**: Estado del proyecto y roadmap
- **GitHub Issues**: Reporta bugs o sugiere features

---

## 💡 Filosofía del Sistema

Finance OS no es solo un "tracker de gastos". Es un **sistema operativo financiero** diseñado para:

1. **Reducir fricción**: Menos clicks, más insights
2. **Largo plazo**: Arquitectura para 20+ años de datos
3. **Privacidad total**: Todo local, nada en la nube
4. **Obsidian-native**: Integración profunda con tu segunda cerebro

---

**¿Listo para tomar control de tus finanzas?**  
Empieza registrando tu primera transacción hoy. 🚀

*Versión: 2.1.5*  
*Última actualización: 2026-02-12*
