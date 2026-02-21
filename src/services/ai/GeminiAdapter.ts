
import { GoogleGenAI } from "@google/genai";
import { IAIService } from "./IAIService";
import { Transaction, Reminder, Asset, TransactionType, TransactionSentiment } from "../../types";
import { API_CONFIG } from "../../config/api";
import { z } from "zod";

const transactionAiSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.nativeEnum(TransactionType),
    amount: z.number().positive(),
    from: z.string(),
    to: z.string().default('none'),
    area: z.string(),
    note: z.string(),
    currency: z.enum(['COP', 'USD', 'EUR', 'GBP', 'MXN', 'BRL']),
    wikilink: z.string().optional().default(''),
    sentiment: z.nativeEnum(TransactionSentiment).optional(),
    aiInsight: z.string().optional()
});

export class GeminiAdapter implements IAIService {
    private client: GoogleGenAI | null = null;
    private apiKey: string | null = null;

    setApiKey(key: string): void {
        if (this.apiKey !== key) {
            this.apiKey = key;
            this.client = new GoogleGenAI({ apiKey: key });
        }
    }

    isConfigured(): boolean {
        return !!this.client && !!this.apiKey;
    }

    private async generate<T>(
        prompt: string,
        zodSchema: z.ZodSchema<T>,
        jsonSchema: any,
        systemInstruction?: string
    ): Promise<T | null> {
        if (!this.client) throw new Error("IA no configurada.");

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI Timeout: La IA tardó demasiado en responder.")), API_CONFIG.AI.GEMINI.TIMEOUT_MS)
        );

        try {
            const apiCall = this.client.models.generateContent({
                model: API_CONFIG.AI.GEMINI.MODEL_FLASH,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    // @ts-ignore
                    responseSchema: jsonSchema
                }
            });

            const result = await Promise.race([apiCall, timeoutPromise]) as any;
            const responseText = result.text || '';
            const parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim());

            const validated = zodSchema.safeParse(parsed);
            if (!validated.success) {
                console.error("[GeminiAdapter] Validation failed:", validated.error);
                return null;
            }
            return validated.data;
        } catch (error) {
            console.error("[GeminiAdapter] Error:", error);
            throw error;
        }
    }

    async parseTransaction(input: string, context: { accounts: string[], areas: string[], today: string }): Promise<Partial<Transaction> | null> {
        const contextPrompt = `Mentor financiero. Hoy: ${context.today}. Cuentas: ${context.accounts.join(', ')}. Áreas: ${context.areas.join(', ')}. Clasifica sentimiento (need, want, invest, regret) y da un aiInsight corto.`;

        const jsonSchema = {
            type: "object",
            properties: {
                date: { type: "string" },
                type: { type: "string", enum: Object.values(TransactionType) },
                amount: { type: "number" },
                from: { type: "string" },
                to: { type: "string" },
                area: { type: "string" },
                note: { type: "string" },
                currency: { type: "string" },
                sentiment: { type: "string", enum: Object.values(TransactionSentiment) },
                aiInsight: { type: "string" }
            },
            required: ["date", "type", "amount", "from", "currency", "area", "sentiment"]
        };

        return await this.generate<any>(`Analiza: "${input}"`, transactionAiSchema, jsonSchema, contextPrompt);
    }

    async parseReceiptImage(base64Image: string, context: { accounts: string[], areas: string[], today: string }): Promise<Partial<Transaction> | null> {
        if (!this.client) return null;

        const prompt = `Analiza este recibo/factura. 
      Extrae los datos estrictamente en este formato JSON:
      {
        "date": "YYYY-MM-DD",
        "amount": número,
        "currency": "COP" | "USD" | "EUR",
        "note": "Nombre del comercio + productos principales",
        "area": "Categoría más probable entre: ${context.areas.join(', ')}",
        "sentiment": "need" | "want" | "regret",
        "type": "expense"
      }
      Si no ves la fecha, usa la de hoy: ${context.today}.
      Si no estás seguro de la categoría, usa 'Otros'.`;

        try {
            const result = await this.client.models.generateContent({
                model: API_CONFIG.AI.GEMINI.MODEL_FLASH,
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
                        ]
                    }
                ]
            });

            const responseText = result.text || '';
            const text = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(text);

            const validated = transactionAiSchema.safeParse({
                ...parsed,
                from: context.accounts[0] || 'Efectivo',
                to: 'none'
            });

            return validated.success ? validated.data : parsed;
        } catch (error) {
            console.error("[GeminiAdapter] OCR Error:", error);
            return null;
        }
    }

    async parseReminder(input: string, context: { today: string }): Promise<Partial<Reminder> | null> {
        const jsonSchema = {
            type: "object",
            properties: {
                title: { type: "string" },
                dueDate: { type: "string" },
                amount: { type: "number" },
                priority: { type: "string", enum: ['low', 'medium', 'high'] }
            },
            required: ["title", "dueDate", "priority"]
        };
        return await this.generate(`Recordatorio: "${input}"`, z.any(), jsonSchema, `Hoy es ${context.today}`);
    }

    async getAssetPrice(symbol: string): Promise<number | null> {
        const jsonSchema = { type: "object", properties: { price: { type: "number" } }, required: ["price"] };
        const result = await this.generate<{ price: number }>(
            `What is the current estimated market price of ${symbol} in USD? Return approx value.`,
            z.object({ price: z.number() }),
            jsonSchema
        );
        return result?.price || null;
    }

    async generateExecutiveBriefing(data: { stats: any, assets: Asset[], health: any }): Promise<string | null> {
        const contextPrompt = `Eres el Comité de Inversiones de un Family Office institucional. Tu objetivo es dar un resumen ejecutivo (Briefing) de alto nivel sobre el estado actual del portafolio. Sé directo, estratégico y crítico si es necesario.`;
        const assetsSummary = data.assets.map(a => `${a.name} (${a.type}): ${a.currentValue} ${a.currency}`).join(', ');

        const prompt = `
      Analiza los siguientes datos del portafolio y genera un informe ejecutivo en formato Markdown (máximo 4 puntos clave):
      - Patrimonio Neto: ${data.stats.totalValuation} ${data.stats.currency}
      - ROI Histórico: ${data.stats.roi.toFixed(2)}%
      - TIR Anual Estimada: ${data.stats.irr.toFixed(2)}%
      - Puntaje de Salud Financiera: ${data.health.score}/100
      - Estado de Liquidez: ${data.health.details.liquidity.label} (${data.health.details.liquidity.status})
      - Diversificación: ${data.health.details.diversification.label}
      - Activos Principales: ${assetsSummary}
    `;

        const jsonSchema = { type: "object", properties: { briefing: { type: "string" } }, required: ["briefing"] };
        const result = await this.generate<{ briefing: string }>(prompt, z.object({ briefing: z.string() }), jsonSchema, contextPrompt);
        return result?.briefing || null;
    }

    async scoreDealIdea(assetIdea: Partial<Asset>, stats: any): Promise<{ fitScore: number; analysis: string } | null> {
        const contextPrompt = `Eres un analista de riesgos de inversiones de élite. Tu trabajo es puntuar objetivamente ideas de inversión basándote en el portafolio actual del cliente.`;
        const prompt = `
      Analiza esta nueva idea de inversión comparándola con el portafolio actual:
      IDEA: Name: ${assetIdea.name}, Type: ${assetIdea.category || assetIdea.type}, Notes: ${assetIdea.notes}.
      PORTAFOLIO ACTUAL: Net Worth: ${stats.totalValuation} ${stats.currency}, ROI: ${stats.roi.toFixed(1)}%.
    `;
        const jsonSchema = { type: "object", properties: { fitScore: { type: "number" }, analysis: { type: "string" } }, required: ["fitScore", "analysis"] };
        return await this.generate<{ fitScore: number; analysis: string }>(prompt, z.object({ fitScore: z.number(), analysis: z.string() }), jsonSchema, contextPrompt);
    }

    async estimateAssetValue(asset: Partial<Asset>): Promise<{ estimatedValue: number; explanation: string; confidence: number } | null> {
        const contextPrompt = `Eres un tasador experto internacional certificado. Tu especialidad es estimar el valor de mercado de activos ilíquidos.`;
        const prompt = `Estimate value for: Name: ${asset.name}, Type: ${asset.category || asset.type}, Notes: ${asset.notes}, Currency: ${asset.currency}.`;
        const jsonSchema = {
            type: "object",
            properties: { estimatedValue: { type: "number" }, explanation: { type: "string" }, confidence: { type: "number" } },
            required: ["estimatedValue", "explanation", "confidence"]
        };
        return await this.generate<{ estimatedValue: number; explanation: string; confidence: number }>(
            prompt,
            z.object({ estimatedValue: z.number(), explanation: z.string(), confidence: z.number() }),
            jsonSchema,
            contextPrompt
        );
    }
}
