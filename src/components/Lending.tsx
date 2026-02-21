// src/components/Lending.tsx
import React from 'react';
import { Loan } from '../types';
import { CreditManager } from './CreditManager';

interface LendingProps {
  loans: Loan[];
  onUpdate: (loans: Loan[]) => void;
}

const Lending: React.FC<LendingProps> = ({ loans, onUpdate }) => {
  return (
    <CreditManager 
      items={loans} 
      onUpdate={(items) => onUpdate(items as Loan[])} 
      mode="lending" 
    />
  );
};

export default Lending; 