// /home/kira/Desktop/finance/.obsidian/plugins/finance-os-plugin2/eslint.config.mts

import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "@eslint/js"; // Corregido: Importación desde @eslint/js
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Solución para obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				project: './tsconfig.json', // Es una buena práctica ser explícito
				tsconfigRootDir: __dirname, // Usar la variable corregida
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		// Los ignores ahora se configuran dentro de un objeto en el array
		ignores: [
			"node_modules",
			"dist",
			"esbuild.config.mjs",
			"version-bump.mjs",
			"versions.json",
			"main.js",
		]
	}
);