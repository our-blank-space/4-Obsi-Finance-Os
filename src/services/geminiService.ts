import { GoogleGenAI } from "@google/genai";
import { PluginData } from '../types';

// Initialize the Gemini API client with the API key from environment variables (or settings)
// In a real plugin, we would look up the key from settings.
// For now, we will assume it's passed or available.

// Helper to shrink context and prevent token overflow
const shrinkContext = (context: any) => {
    // We only need high-level KPIs, not every single transaction history
    return {
        currency: context.baseCurrency,
        // Balances summary (if available in state, otherwise calculate rough totals)
        // For now, we assume context.agriPro contains the relevant sector data
        agriParams: {
            totalBatches: context.agriPro?.batches?.length || 0,
            activeBatches: context.agriPro?.batches?.filter((b: any) => b.status === 'active').length || 0,
            inventoryItems: context.agriPro?.inventory?.length || 0
        },
        // We avoid sending 'transactions' array which can be huge
        globalSettings: {
            inflation: context.projectionParams?.inflationRate || 0,
            riskFreeRate: context.projectionParams?.expectedReturn || 0
        }
    };
};

export const analyzeBatchPerformance = async (batchData: any, financialContext: any, apiKey: string) => {
    if (!apiKey) return "⚠️ API Key no configurada. Ve a Configuración > Gemini API Key.";

    // 1. Shrink Context
    const safeContext = shrinkContext(financialContext);

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `Analiza este lote de producción agrícola y financiera:
                Lote: ${JSON.stringify(batchData)}
                Contexto Financiero Resumido: ${JSON.stringify(safeContext)}
                
                Como experto economista e ingeniero agrónomo, proporciona:
                1. Análisis de rentabilidad proyectada (ROI).
                2. Riesgos detectados.
                3. Sugerencias técnicas para mejorar la producción.
                4. Análisis de costos de insumos vs histórico.
                
                Responde en formato Markdown profesional, breve y conciso.`
                        }
                    ]
                }
            ]
        });
        // FIX: GoogleGenAI response (New SDK) usually has .text property (getter)
        // Based on error "This expression is not callable because it is a get accessor"
        if (typeof response.text === 'string') {
            return response.text;
        }
        if (typeof response.text === 'function') {
            // @ts-ignore
            return response.text();
        }
        // Fallback for some versions or if text() failed
        return response.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";
    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return "Error generando el análisis. Verifica tu conexión o API Key.";
    }
};
