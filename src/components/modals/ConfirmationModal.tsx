import React from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDangerous = false,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            icon={isDangerous ? <AlertTriangle size={24} className="text-red-500" /> : undefined}
        >
            <div className="space-y-4">
                <div className="text-[var(--text-normal)] text-sm sm:text-base leading-relaxed">
                    {message}
                </div>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        {cancelText || t('btn.cancel')}
                    </Button>
                    <Button
                        variant={isDangerous ? 'danger' : 'primary'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText || t('btn.confirm')}
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
};
