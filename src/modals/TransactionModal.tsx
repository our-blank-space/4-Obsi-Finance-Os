import { Modal, App, Notice } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import FinanceOSPlugin from '../main';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionType } from '../types';

const TransactionModalWrapper: React.FC<{ 
    type: TransactionType; 
    onClose: () => void;
    onSaveSuccess?: () => void;
}> = ({ type, onClose }) => {
    const { dispatch, saveDataNow } = useFinance();

    const handleSave = async (data: any) => {
        dispatch({ type: 'ADD_TRANSACTION', payload: data });
        await saveDataNow();
        new Notice(`✅ Registrado: ${data.amount} en ${data.area}`);
        onClose();
    };

    return (
        <TransactionForm 
            initialType={type}
            onSave={handleSave}
            onCancel={onClose}
        />
    );
};

export class TransactionModal extends Modal {
    plugin: FinanceOSPlugin;
    root: ReactDOM.Root | null = null;
    type: TransactionType;

    constructor(app: App, plugin: FinanceOSPlugin, type: TransactionType = TransactionType.EXPENSE) {
        super(app);
        this.plugin = plugin;
        this.type = type;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Add class for styling
        contentEl.addClass('finance-os-modal-container');
        
        this.root = ReactDOM.createRoot(contentEl);
        
        const modalTitle = this.type === TransactionType.INCOME 
            ? '💰 Registrar Ingreso Rápido' 
            : '🛒 Registrar Gasto Rápido';
        
        this.setTitle(modalTitle);

        this.root.render(
            <FinanceProvider initialData={this.plugin.data} api={this.plugin.createPublicAPI()}>
                <div className="p-4">
                    <TransactionModalWrapper 
                        type={this.type}
                        onClose={() => this.close()}
                    />
                </div>
            </FinanceProvider>
        );
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
