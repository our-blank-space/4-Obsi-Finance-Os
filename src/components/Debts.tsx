// src/components/Debts.tsx
import React from 'react';
import { Debt } from '../types';
import { CreditManager } from './CreditManager';

interface DebtsProps {
  debts: Debt[];
  onUpdate: (debts: Debt[]) => void;
}

const Debts: React.FC<DebtsProps> = ({ debts, onUpdate }) => {
  return (
    <CreditManager 
      items={debts} 
      onUpdate={(items) => onUpdate(items as Debt[])} 
      mode="debt" 
    />
  );
};

export default Debts; 