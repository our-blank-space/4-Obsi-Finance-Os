import { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ExchangeRateService } from '../services/ExchangeRateService';

export const useAutoRefreshRates = () => {
    const { state, dispatch } = useFinance();
    const { baseCurrency, settings, exchangeRates } = state;

    useEffect(() => {
        const checkAndRunUpdate = async () => {
            // 1. Validar si es necesario actualizar (6 horas)
            const lastUpdate = settings.lastRateUpdate || 0;
            const sixHours = 6 * 60 * 60 * 1000;
            const now = Date.now();

            if (now - lastUpdate < sixHours && exchangeRates && Object.keys(exchangeRates).length > 0) {
                return; // Datos frescos, no hacer nada
            }

            // 2. Ejecutar servicio
            try {
                // Instancia directa para evitar complicaciones de inyección por ahora
                // Idealmente esto vendría de un contexto de servicios
                const service = new ExchangeRateService();

                // Obtener tasas base
                const newRates = await service.getLatestRates(
                    baseCurrency,
                    exchangeRates,
                    settings.manualExchangeRates,
                    settings.useManualRates
                );

                // 3. Dispatch solo si hubo éxito
                dispatch({
                    type: 'UPDATE_SETTINGS',
                    payload: {
                        exchangeRates: newRates,
                        settings: {
                            ...settings,
                            lastRateUpdate: now
                        }
                    } as any // Cast temporal para evitar problemas con tipos parciales anidados
                });



            } catch (e) {
                console.warn("[FinanceOS] Falló actualización automática de tasas:", e);
            }
        };

        checkAndRunUpdate();
    }, [baseCurrency, dispatch]); // Dependencias mínimas, settings y exchangeRates se omiten intencionalmente para evitar loops, o se deberían manejar con refs si cambian mucho.
    // Sin embargo, para este caso simple, ejecutar al montar o cambiar baseCurrency suele ser suficiente. 
    // Si settings cambia, también querríamos re-evaluar? Probablemente no, solo si cambia la configuración de red.
};
