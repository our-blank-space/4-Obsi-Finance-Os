
import { API_CONFIG } from "../config/api";

export class ExchangeRateService {
    /**
     * Obtiene las tasas de cambio más recientes, con fallback robusto a datos locales.
     * Prioriza la estabilidad sobre la frescura inmediata si la API falla.
     */
    public async getLatestRates(
        base: string,
        fallbackRates: Record<string, number>,
        manualRates: Record<string, number> = {},
        useManual: boolean = false
    ): Promise<Record<string, number>> {

        // 1. Si el usuario activó tasas manuales, son prioridad absoluta
        if (useManual && Object.keys(manualRates).length > 0) {
            return { ...fallbackRates, ...manualRates };
        }

        try {
            // Intentar fetch con timeout corto definido en config
            const response = await Promise.race([
                fetch(`${API_CONFIG.EXCHANGE_RATE.BASE_URL}/${base}`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), API_CONFIG.EXCHANGE_RATE.TIMEOUT_MS))
            ]) as Response;

            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success' && data.rates) {
                    return data.rates;
                }
            }
            throw new Error('API Response invalid or not ok');
        } catch (e) {
            console.warn(`[ExchangeRateService] API Falló o hubo Timeout (${e.message}). Usando 'Last Known Good Rates' (Resiliencia).`);

            // Si las tasas manuales existen, las usamos como respaldo secundario si la API falla aunque useManual sea false
            if (Object.keys(manualRates).length > 0) {
                return { ...fallbackRates, ...manualRates };
            }

            return fallbackRates;
        }
    }
}
