#!/bin/bash

# Script de ayuda para ejecutar las pruebas de arquitectura V3
# Uso: sh run_tests.sh

echo "==== 🧪 Finance OS: Iniciando Pruebas de Arquitectura V3 ===="
echo "Directorio: $(pwd)"

if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json. Asegúrate de estar en la carpeta del plugin."
    exit 1
fi

echo "📦 Instalando dependencias (por si acaso)..."
# npm install --silent # Opcional, puede ser lento, mejor asumimos que ya tienen entorno o usan npm test directo

echo "🚀 Ejecutando Jest..."
# Ejecutamos específicamente el test suite de V3
npm test src/tests/ArchitectureV3.test.ts

echo "=========================================================="
echo "💡 Recuerda: También puedes verificar la integración real"
echo "   abriendo Obsidian y usando el comando:"
echo "   'Finance OS: DEV: Ejecutar Pruebas de Arquitectura'"
echo "=========================================================="
