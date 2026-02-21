// src/types/ui.ts

import React from 'react';

// --- INTERFAZ DE USUARIO (UI) ---

/**
 * View representa todas las rutas/pantallas disponibles en el plugin.
 * Se ha añadido 'quotation' para dar soporte al nuevo Cotizador Inteligente.
 */
export type View =
    | 'dashboard'
    | 'balances'
    | 'logs'
    | 'budgets'
    | 'reminders'
    | 'recurrent'
    | 'assets'
    | 'reviews'
    | 'trading'
    | 'lending'
    | 'debts'
    | 'settings'
    | 'guide'
    | 'fx'
    | 'monthly_review'
    | 'annual_report'
    | 'quotation'
    | 'custodial'
    | 'business'
    | 'sales'
    | 'simulations'
    | 'agripro'; // ADD THIS LINE

export interface NavItemProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: number;
    hidden?: boolean;
}

export interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtext?: string;
    className?: string;
}

export interface DetailItemProps {
    label: string;
    value: string | number;
    className?: string;
}