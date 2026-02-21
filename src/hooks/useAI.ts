
// src/hooks/useAI.ts
import { useState, useCallback, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Transaction,
  Reminder,
  AssetProject,
} from '../types';
import { IAIService } from '../services/ai/IAIService';
import { GeminiAdapter } from '../services/ai/GeminiAdapter';

// Singleton instance to persist across hook calls
const aiService: IAIService = new GeminiAdapter();

export const useAI = () => {
  const { state } = useFinance();
  const { accountRegistry, categoryRegistry, features, settings } = state;
  const accounts = accountRegistry.map(a => a.name);
  const areas = categoryRegistry.map(c => c.name);

  const geminiApiKey = settings.geminiApiKey;
  const aiEnabled = features.ai;

  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize/Update API key
  useMemo(() => {
    if (geminiApiKey) {
      aiService.setApiKey(geminiApiKey);
    }
  }, [geminiApiKey]);

  /**
   * Wrapper for AI service calls with loading state
   */
  const wrapCall = useCallback(async <T>(call: () => Promise<T>): Promise<T> => {
    if (!aiEnabled || !aiService.isConfigured()) throw new Error("IA no configurada o desactivada.");
    setIsProcessing(true);
    try {
      return await call();
    } finally {
      setIsProcessing(false);
    }
  }, [aiEnabled]);

  const parseTransaction = useCallback(async (input: string): Promise<Partial<Transaction> | null> => {
    const today = new Date().toISOString().split('T')[0];
    const result = await wrapCall(() => aiService.parseTransaction(input, { accounts, areas, today }));

    if (result) {
      // Map names back to IDs
      const fromId = accountRegistry.find(a => a.name.toLowerCase() === result.from?.toLowerCase())?.id;
      const toId = accountRegistry.find(a => a.name.toLowerCase() === result.to?.toLowerCase())?.id;
      const areaId = categoryRegistry.find(c => c.name.toLowerCase() === result.area?.toLowerCase())?.id;
      return { ...result, fromId, toId, areaId };
    }
    return null;
  }, [wrapCall, accountRegistry, categoryRegistry, accounts, areas]);

  const parseReceiptImage = useCallback(async (base64Image: string): Promise<Partial<Transaction> | null> => {
    const today = new Date().toISOString().split('T')[0];
    const result = await wrapCall(() => aiService.parseReceiptImage(base64Image, { accounts, areas, today }));

    if (result) {
      const fromId = accountRegistry.find(a => a.name.toLowerCase() === result.from?.toLowerCase())?.id;
      const toId = accountRegistry.find(a => a.name.toLowerCase() === result.to?.toLowerCase())?.id;
      const areaId = categoryRegistry.find(c => c.name.toLowerCase() === result.area?.toLowerCase())?.id;
      return { ...result, fromId, toId, areaId };
    }
    return null;
  }, [wrapCall, accountRegistry, categoryRegistry, accounts, areas]);

  const parseReminder = useCallback(async (input: string): Promise<Partial<Reminder> | null> => {
    const today = new Date().toISOString().split('T')[0];
    return await wrapCall(() => aiService.parseReminder(input, { today }));
  }, [wrapCall]);

  const getAssetPrice = useCallback(async (symbol: string): Promise<number | null> => {
    return await wrapCall(() => aiService.getAssetPrice(symbol));
  }, [wrapCall]);

  const generateExecutiveBriefing = useCallback(async (
    stats: any,
    assets: AssetProject[],
    health: any
  ): Promise<string | null> => {
    return await wrapCall(() => aiService.generateExecutiveBriefing({ stats, assets, health }));
  }, [wrapCall]);

  const scoreDealIdea = useCallback(async (
    assetIdea: Partial<AssetProject>,
    stats: any
  ): Promise<{ fitScore: number; analysis: string } | null> => {
    return await wrapCall(() => aiService.scoreDealIdea(assetIdea, stats));
  }, [wrapCall]);

  const estimateAssetValue = useCallback(async (
    asset: Partial<AssetProject>
  ): Promise<{ estimatedValue: number; explanation: string; confidence: number } | null> => {
    return await wrapCall(() => aiService.estimateAssetValue(asset));
  }, [wrapCall]);

  return {
    isProcessing,
    parseTransaction,
    parseReceiptImage,
    parseReminder,
    getAssetPrice,
    generateExecutiveBriefing,
    scoreDealIdea,
    estimateAssetValue
  };
};