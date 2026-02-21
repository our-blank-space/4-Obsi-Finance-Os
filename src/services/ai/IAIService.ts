
import { Transaction, Reminder, Asset } from '../../types';

export interface AIProcessingOptions {
    systemInstruction?: string;
    temperature?: number;
}

export interface IAIService {
    setApiKey(key: string): void;
    isConfigured(): boolean;

    parseTransaction(input: string, context: { accounts: string[], areas: string[], today: string }): Promise<Partial<Transaction> | null>;
    parseReceiptImage(base64Image: string, context: { accounts: string[], areas: string[], today: string }): Promise<Partial<Transaction> | null>;
    parseReminder(input: string, context: { today: string }): Promise<Partial<Reminder> | null>;
    getAssetPrice(symbol: string): Promise<number | null>;

    generateExecutiveBriefing(data: { stats: any, assets: Asset[], health: any }): Promise<string | null>;
    scoreDealIdea(assetIdea: Partial<Asset>, stats: any): Promise<{ fitScore: number; analysis: string } | null>;
    estimateAssetValue(asset: Partial<Asset>): Promise<{ estimatedValue: number; explanation: string; confidence: number } | null>;
}
