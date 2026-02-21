import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import FinanceOSPlugin from './main';
import { Settings } from './types';
import { DateUtils } from './utils/date';

export class FinanceOSSettingTab extends PluginSettingTab {
    plugin: FinanceOSPlugin;

    constructor(app: App, plugin: FinanceOSPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.renderHeader(containerEl);
        this.renderTestingMode(containerEl); // 🧪 NUEVO
        this.renderConnectionSettings(containerEl);
        this.renderDangerZone(containerEl);
    }

    /**
     * Renderiza la cabecera y avisos generales.
     */
    private renderHeader(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Finance OS: Sistema' });

        const info = containerEl.createDiv({ cls: 'setting-item-description' });
        info.innerHTML = 'Gestión de conexiones y mantenimiento del sistema. Para configuración de vistas, usa el panel lateral.';
        info.style.marginBottom = '20px';
    }

    /**
     * 🧪 Renderiza controles para el modo de testing
     */
    private renderTestingMode(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: '🧪 Modo Testing (Recurrentes)' });

        const infoDiv = containerEl.createDiv({ cls: 'setting-item-description' });
        infoDiv.innerHTML = 'Simula fechas para probar pagos e ingresos recurrentes sin cambiar la fecha del sistema.';
        infoDiv.style.marginBottom = '15px';

        // Toggle para activar/desactivar testing mode
        new Setting(containerEl)
            .setName('Activar Modo Testing')
            .setDesc('Permite simular fechas futuras para probar transacciones recurrentes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.data.settings.testingMode)
                .onChange(async (value) => {
                    this.plugin.data.settings.testingMode = value;

                    if (value) {
                        // Activar con la fecha actual
                        const today = new Date().toISOString().split('T')[0];
                        this.plugin.data.settings.simulatedDate = today;
                        DateUtils.setSimulatedDate(today);
                    } else {
                        // Desactivar
                        this.plugin.data.settings.simulatedDate = undefined;
                        DateUtils.setSimulatedDate(null);
                    }

                    await this.plugin.savePluginData();
                    this.display(); // Refrescar para mostrar/ocultar controles
                    new Notice(value ? '🧪 Modo Testing activado' : '✅ Modo Testing desactivado');
                })
            );

        // Solo mostrar controles si el modo está activo
        if (this.plugin.data.settings.testingMode && this.plugin.data.settings.simulatedDate) {
            // Mostrar fecha actual simulada
            const currentDateDiv = containerEl.createDiv({ cls: 'setting-item-description' });
            currentDateDiv.innerHTML = `<strong>Fecha simulada actual:</strong> ${this.plugin.data.settings.simulatedDate}`;
            currentDateDiv.style.marginBottom = '10px';
            currentDateDiv.style.padding = '10px';
            currentDateDiv.style.backgroundColor = 'var(--background-secondary)';
            currentDateDiv.style.borderRadius = '5px';

            // Botones para avanzar tiempo
            new Setting(containerEl)
                .setName('Avanzar tiempo')
                .setDesc('Simula el paso del tiempo para probar recurrentes.')
                .addButton(btn => btn
                    .setButtonText('+1 Día')
                    .onClick(async () => {
                        await this.advanceDate(1);
                    })
                )
                .addButton(btn => btn
                    .setButtonText('+7 Días')
                    .onClick(async () => {
                        await this.advanceDate(7);
                    })
                )
                .addButton(btn => btn
                    .setButtonText('+30 Días')
                    .onClick(async () => {
                        await this.advanceDate(30);
                    })
                );

            // Botón para resetear a hoy
            new Setting(containerEl)
                .setName('Resetear fecha')
                .setDesc('Vuelve a la fecha actual real.')
                .addButton(btn => btn
                    .setButtonText('Volver a Hoy')
                    .onClick(async () => {
                        const today = new Date().toISOString().split('T')[0];
                        this.plugin.data.settings.simulatedDate = today;
                        DateUtils.setSimulatedDate(today);
                        await this.plugin.savePluginData();
                        this.display();
                        new Notice(`📅 Fecha reseteada a: ${today}`);
                    })
                );
        }

        // Separador
        const separator = containerEl.createEl('hr');
        separator.style.marginTop = '20px';
        separator.style.marginBottom = '20px';
    }

    /**
     * Avanza la fecha simulada por X días
     */
    private async advanceDate(days: number): Promise<void> {
        if (!this.plugin.data.settings.simulatedDate) return;

        const current = new Date(`${this.plugin.data.settings.simulatedDate}T12:00:00`);
        current.setDate(current.getDate() + days);
        const newDate = current.toISOString().split('T')[0];

        this.plugin.data.settings.simulatedDate = newDate;
        DateUtils.setSimulatedDate(newDate);
        await this.plugin.savePluginData();

        this.display(); // Refrescar UI
        new Notice(`⏩ Fecha avanzada a: ${newDate} (+${days} días)`);
    }

    /**
     * Renderiza configuraciones de APIs y servicios externos.
     * Implementa campo de contraseña para seguridad visual.
     */
    private renderConnectionSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Clave API de Google para funciones de IA. Se almacena localmente.')
            .addText(text => {
                text
                    .setPlaceholder('Ej: AIzaSy...')
                    .setValue(this.plugin.data.settings.geminiApiKey)
                    .onChange(async (value) => {
                        await this.updateSetting('geminiApiKey', value.trim());
                    });

                // 🔐 SEGURIDAD VISUAL: Ocultar caracteres
                text.inputEl.type = 'password';
            });
    }

    /**
     * Renderiza la zona de acciones destructivas con estilos nativos de Obsidian.
     */
    private renderDangerZone(containerEl: HTMLElement): void {
        // Separador visual
        const separator = containerEl.createEl('hr');
        separator.style.marginTop = '40px';
        separator.style.borderTop = '1px solid var(--background-modifier-border-hover)';

        // Título de sección con color de error nativo
        const dangerHeader = containerEl.createEl('h3', { text: 'Zona de Peligro' });
        dangerHeader.style.color = 'var(--text-error)';
        dangerHeader.style.marginTop = '20px';

        new Setting(containerEl)
            .setName('Restablecer de Fábrica')
            .setDesc('ACCIÓN DESTRUCTIVA: Borra todos los datos, transacciones y cuentas. Esta acción no se puede deshacer.')
            .addButton(button => button
                .setButtonText('Borrar Todo el Sistema')
                .setWarning() // Estilo nativo de advertencia
                .onClick(async () => {
                    await this.handleFactoryReset();
                }));
    }

    /**
     * Helper para actualizar configuraciones de forma tipada y segura.
     */
    private async updateSetting<K extends keyof Settings.PluginSettings>(key: K, value: Settings.PluginSettings[K]): Promise<void> {
        this.plugin.data.settings[key] = value;
        await this.plugin.savePluginData();
    }

    /**
     * Maneja la lógica de confirmación y ejecución del reset.
     */
    private async handleFactoryReset(): Promise<void> {
        // Doble confirmación simple por ahora (MVP mejorado)
        // Idealmente, esto debería ser un Modal personalizado que pida escribir "BORRAR"
        if (window.confirm('⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEstás a punto de borrar TODA tu base de datos financiera.\n\n¿Estás absolutamente seguro?')) {
            const secondCheck = window.confirm('Última oportunidad. Si aceptas, perderás todos los registros.\n\n¿Proceder?');

            if (secondCheck) {
                try {
                    await this.plugin.performFactoryReset();
                    new Notice('♻️ Sistema restablecido correctamente.');
                } catch (e) {
                    console.error(e);
                    new Notice('❌ Error al restablecer el sistema.');
                }
            }
        }
    }
}
