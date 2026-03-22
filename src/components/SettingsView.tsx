// src/components/SettingsView.tsx
import React, { useState } from 'react';
import {
  Settings, Check, Globe, Box, Database
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { PluginSettings } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useTaxonomy } from '../hooks/useTaxonomy';
import { Notice } from 'obsidian';
import { SettingsGeneral } from './settings/SettingsGeneral';
import { SettingsModules } from './settings/SettingsModules';
import { SettingsData } from './settings/SettingsData';

export const SettingsView: React.FC = () => {
  const { state, dispatch, saveDataNow } = useFinance();
  const { t } = useTranslation();
  const { addEntity } = useTaxonomy();

  const [isSaved, setIsSaved] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'data'>('general');

  const triggerAutoSave = () => {
    saveDataNow();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const updateSettings = (partialSettings: Partial<PluginSettings>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        settings: { ...state.settings, ...partialSettings },
        ...(partialSettings.language ? { language: partialSettings.language } : {})
      }
    });
    triggerAutoSave();
  };

  const fetchExchangeRates = async () => {
    setIsFetchingRates(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error("Network error");

      const data = await response.json();
      const usdToBase = data.rates[state.baseCurrency] || 1;

      const newRates: Record<string, number> = {
        'USD': usdToBase,
        'EUR': Math.round((usdToBase / (data.rates.EUR || 0.92)) * 100) / 100,
        'GBP': Math.round((usdToBase / (data.rates.GBP || 0.79)) * 100) / 100,
        'MXN': Math.round((usdToBase / (data.rates.MXN || 17.5)) * 100) / 100,
        'BRL': Math.round((usdToBase / (data.rates.BRL || 5.0)) * 100) / 100,
      };

      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          exchangeRates: { ...state.exchangeRates, ...newRates },
          exchangeRate: newRates.USD,
          lastRateUpdate: Date.now()
        }
      });
      new Notice(t('msg.rates_updated'));
      triggerAutoSave();
    } catch (e) {
      new Notice(t('msg.error_rates'));
    } finally {
      setIsFetchingRates(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-5xl mx-auto font-sans">
      {/* HEADER FIJO */}
      <div className="flex items-center justify-between sticky top-0 bg-[var(--background-primary)]/95 backdrop-blur z-20 py-4 border-b border-[var(--background-modifier-border)]">
        <div>
          <h2 className="text-2xl font-black italic flex items-center gap-3 text-[var(--text-normal)]">
            <Settings className="text-[var(--interactive-accent)]" /> {t('settings.title')}
          </h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isSaved ? 'bg-[var(--interactive-accent)]/10 text-[var(--interactive-accent)]' : 'text-transparent'}`}>
          <Check size={14} /> {t('state.saved')}
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)] w-full sm:w-fit">
        <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Globe size={14} />} label={t('settings.tab.general')} />
        <TabButton active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} icon={<Box size={14} />} label={t('settings.tab.modules')} />
        <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={14} />} label={t('settings.tab.data')} />
      </div>

      {activeTab === 'general' && (
        <SettingsGeneral 
          state={state} 
          dispatch={dispatch} 
          updateSettings={updateSettings} 
          fetchExchangeRates={fetchExchangeRates}
          isFetchingRates={isFetchingRates}
          triggerAutoSave={triggerAutoSave}
          addEntity={addEntity}
          t={t} 
        />
      )}
      
      {activeTab === 'modules' && (
        <SettingsModules 
          state={state} 
          dispatch={dispatch} 
          updateSettings={updateSettings}
          triggerAutoSave={triggerAutoSave}
          t={t}
        />
      )}
      
      {activeTab === 'data' && (
        <SettingsData />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active
      ? 'bg-[var(--background-primary)] text-[var(--text-normal)] shadow-sm border border-[var(--background-modifier-border)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'
      }`}
  >
    {icon} {label}
  </button>
);