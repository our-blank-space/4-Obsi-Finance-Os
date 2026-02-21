/**
 * FinanceView - Adaptador de Infraestructura
 * ==========================================
 * Conecta el ciclo de vida de Obsidian con el ecosistema React.
 * 
 * Responsabilidades:
 * 1. Montaje/Desmontaje de React Root.
 * 2. Inyección de Dependencias (API, Datos).
 * 3. Aislamiento de estilos vía CSS classes.
 * 4. Gestión de actualizaciones críticas (Factory Reset).
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import FinanceOSPlugin from './main';
import { Data, Obsidian } from './types';

export const VIEW_TYPE_FINANCE = 'finance-os-view';

// Configuración de entorno (Idealmente vendría de process.env)
const IS_DEVELOPMENT = false;

export class FinanceView extends ItemView {
    plugin: FinanceOSPlugin;
    root: ReactDOM.Root | null = null;

    // Estado interno del adaptador
    private currentData: Data.PluginData;
    private api: Obsidian.FinanceObsidianAPI;
    private appKey: number = 0; // Para forzar remontaje limpio en hard-resets

    constructor(
        leaf: WorkspaceLeaf,
        plugin: FinanceOSPlugin,
        initialData: Data.PluginData,
        api: Obsidian.FinanceObsidianAPI
    ) {
        super(leaf);
        this.plugin = plugin;
        this.currentData = initialData;
        this.api = api;
    }

    getViewType() {
        return VIEW_TYPE_FINANCE;
    }

    getDisplayText() {
        return 'Finance OS';
    }

    getIcon() {
        return 'dollar-sign';
    }

    async onOpen() {
        // 1. DOM SAFETY: Usamos contentEl (API oficial) en lugar de buscar hijos manualmente
        const container = this.contentEl;
        container.empty();

        // 2. CSS ISOLATION: Asignamos clase para manejar estilos en styles.css
        container.addClass('finance-os-view-container');

        // 3. REACT ROOT: Inicialización única
        this.root = ReactDOM.createRoot(container);

        // 4. MOUNT
        this.mountReactApp();
    }

    /**
     * Renderiza la aplicación React.
     * Encapsula la lógica de StrictMode y Providers.
     */
    private mountReactApp() {
        if (!this.root) return;

        const AppParams = {
            initialData: this.currentData,
            api: this.api
        };

        const content = <App key={this.appKey} {...AppParams} />;

        this.root.render(
            IS_DEVELOPMENT ? (
                <React.StrictMode>{content}</React.StrictMode>
            ) : (
                content
            )
        );
    }

    /**
     * HARD RESET / DATA REPLACEMENT
     * Utilizado para restaurar backups o factory reset.
     * Incrementa la key para obligar a React a descartar el estado anterior completamente.
     */
    public updateData(newData: Data.PluginData) {
        this.currentData = newData;
        this.appKey += 1; // Force remount
        this.mountReactApp();
    }

    async onClose() {
        if (this.root) {
            // Cleanup explícito para evitar memory leaks en Obsidian
            this.root.unmount();
            this.root = null;
        }
    }
}