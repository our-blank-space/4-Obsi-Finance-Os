import React from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Trash2, Archive, Lock, Save } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button, ButtonVariant } from './Button';

/* =========================================================
   1. DEFINICIONES DEL SISTEMA
   Vocabulario controlado de acciones críticas financieras.
========================================================= */

export type ConfirmIntent = 
  | 'delete_record'       // Borrado de transacción simple
  | 'delete_asset'        // Borrado de activo (implica pérdida de historia)
  | 'close_period'        // Cierre mensual/anual (congela datos)
  | 'reset_data'          // Destructivo total
  | 'execute_trade'       // Acción financiera con riesgo
  | 'reconcile_balance'   // Ajuste contable
  | 'generic_danger'      // Fallback
  | 'generic_info';       // Fallback

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>; // Soporte explícito para Async
  
  // Contenido
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  
  // Semántica (Preferida)
  intent?: ConfirmIntent;
  
  // Visual Override (Legacy/Fallback)
  variant?: 'danger' | 'warning' | 'info' | 'success';
  
  // Estado
  isLoading?: boolean;
}

/* =========================================================
   2. CONFIGURACIÓN VISUAL Y SEMÁNTICA
========================================================= */

interface VisualConfig {
  icon: React.ReactNode;
  buttonVariant: ButtonVariant;
  headerColorClass: string; // Para colorear título/icono sutilmente
}

// Mapa: Intención -> Configuración Visual
const intentMap: Record<ConfirmIntent, VisualConfig> = {
  delete_record: {
    icon: <Trash2 size={24} className="text-rose-500" />,
    buttonVariant: 'danger',
    headerColorClass: 'text-rose-500'
  },
  delete_asset: {
    icon: <AlertOctagon size={24} className="text-rose-600" />,
    buttonVariant: 'danger',
    headerColorClass: 'text-rose-600'
  },
  reset_data: {
    icon: <AlertOctagon size={24} className="text-rose-600" />,
    buttonVariant: 'danger',
    headerColorClass: 'text-rose-600'
  },
  close_period: {
    icon: <Archive size={24} className="text-amber-500" />,
    buttonVariant: 'primary', // Warning usualmente usa colores primarios o ambers
    headerColorClass: 'text-amber-500'
  },
  reconcile_balance: {
    icon: <Lock size={24} className="text-amber-500" />,
    buttonVariant: 'secondary',
    headerColorClass: 'text-amber-500'
  },
  execute_trade: {
    icon: <Info size={24} className="text-sky-500" />,
    buttonVariant: 'primary',
    headerColorClass: 'text-sky-500'
  },
  generic_danger: {
    icon: <AlertTriangle size={24} className="text-rose-500" />,
    buttonVariant: 'danger',
    headerColorClass: 'text-rose-500'
  },
  generic_info: {
    icon: <Info size={24} className="text-sky-500" />,
    buttonVariant: 'secondary',
    headerColorClass: 'text-sky-500'
  }
};

// Fallback para prop 'variant' antigua
const variantFallback: Record<string, VisualConfig> = {
  danger: intentMap.generic_danger,
  warning: { icon: <AlertTriangle size={24} className="text-amber-500" />, buttonVariant: 'primary', headerColorClass: 'text-amber-500' },
  info: intentMap.generic_info,
  success: { icon: <CheckCircle2 size={24} className="text-emerald-500" />, buttonVariant: 'success', headerColorClass: 'text-emerald-500' }
};

/* =========================================================
   3. COMPONENTE
========================================================= */

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  intent,
  variant = 'danger',
  isLoading = false
}) => {
  
  // Resolución de Configuración: Intención > Variante > Default
  const config = intent 
    ? intentMap[intent] 
    : (variantFallback[variant] || intentMap.generic_danger);

  // Manejador Interno (Hook para futura auditoría)
  const handleConfirm = async () => {
    // 1. Aquí iría el log de auditoría en v2.0
    // await auditLog.record(intent, { title, timestamp: Date.now() });
    
    // 2. Ejecución
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      icon={config.icon}
      preventCloseOnOutsideClick={isLoading}
    >
      <div 
        className="space-y-4"
        data-intent={intent || variant} // Huella para tests/debugging
      >
        {/* Cuerpo del mensaje */}
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {description}
        </p>

        {/* Footer de Acciones */}
        <ModalFooter>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
            fullWidth
          >
            {cancelText}
          </Button>
          
          <Button 
            variant={config.buttonVariant} 
            onClick={handleConfirm} 
            isLoading={isLoading}
            fullWidth
            // Pasamos la intención al botón también para consistencia ARIA
            intent={intent === 'execute_trade' ? 'create' : intent?.includes('delete') ? 'destructive' : undefined}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}; 