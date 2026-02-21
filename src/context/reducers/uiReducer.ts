import { UI } from '../../types';

// =========================================
// DEFINICIONES DE ACCIONES DE UI
// =========================================

export type UIAction =
    | { type: 'SET_VIEW'; payload: UI.View }
    | { type: 'TOGGLE_PRIVACY' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'OPEN_MODAL'; payload: string }
    | { type: 'CLOSE_MODAL'; payload: string };

// =========================================
// STATE TYPE
// =========================================

export interface FinanceUIState {
    currentView: UI.View;
    isPrivacyMode: boolean;
    isLoading: boolean;
    activeModals: Record<string, boolean>;
}

export const INITIAL_UI_STATE: FinanceUIState = {
    currentView: 'dashboard',
    isPrivacyMode: false,
    isLoading: true,
    activeModals: {}
};

// =========================================
// REDUCER
// =========================================

export function uiReducer(state: FinanceUIState, action: UIAction): FinanceUIState {
    switch (action.type) {
        case 'SET_VIEW':
            return { ...state, currentView: action.payload };

        case 'TOGGLE_PRIVACY':
            return { ...state, isPrivacyMode: !state.isPrivacyMode };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'OPEN_MODAL':
            return { ...state, activeModals: { ...state.activeModals, [action.payload]: true } };

        case 'CLOSE_MODAL':
            return { ...state, activeModals: { ...state.activeModals, [action.payload]: false } };

        default:
            return state;
    }
}
