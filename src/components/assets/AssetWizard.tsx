import React, { useState, useEffect } from 'react';
import { Asset, ProjectStatus } from '../../types/assets';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { NumericInput } from '../ui/NumericInput';
import { Modal, ModalFooter } from '../ui/Modal';
import { Box, DollarSign, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Asset) => void;
    initialAsset?: Asset | null;
}

export const AssetWizard: React.FC<Props> = ({ isOpen, onClose, onSave, initialAsset }) => {
    const { baseCurrency } = useCurrency();
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [data, setData] = useState<Partial<Asset>>({
        currency: baseCurrency,
        status: 'active',
        purchaseDate: new Date().toISOString().split('T')[0],
        isIncomeGenerating: false,
        isDepreciating: true
    });

    useEffect(() => {
        if (isOpen && initialAsset) {
            setData({
                ...initialAsset,
                purchaseDate: initialAsset.purchaseDate ? initialAsset.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else if (isOpen && !initialAsset) {
            setData({
                currency: baseCurrency,
                status: 'active',
                purchaseDate: new Date().toISOString().split('T')[0],
                isIncomeGenerating: false,
                isDepreciating: true
            });
        }
    }, [isOpen, initialAsset, baseCurrency]);

    // Smart Defaults based on Category
    const handleCategoryChange = (category: string) => {
        let isIncome = false;
        let isDepreciating = true;

        if (category === 'Real Estate' || category === 'Business' || category === 'Financial') {
            isIncome = true;
            isDepreciating = false; // Usually appreciating
        }
        if (category === 'Vehicle' || category === 'Technology') {
            isIncome = false;
            isDepreciating = true;
        }

        setData(prev => ({ ...prev, category, isIncomeGenerating: isIncome, isDepreciating }));
    };

    const handleFinish = () => {
        const newAsset: Asset = {
            id: initialAsset?.id || crypto.randomUUID(),
            name: data.name || 'New Asset',
            category: data.category || 'Other',
            type: data.type || '',
            currency: data.currency as any,
            status: (data.status as ProjectStatus) || 'active',

            purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
            purchasePrice: Number(data.purchasePrice) || 0,
            currentValue: Number(data.currentValue) || Number(data.purchasePrice) || 0,

            isIncomeGenerating: !!data.isIncomeGenerating,
            isDepreciating: !!data.isDepreciating,
            usefulLifeYears: Number(data.usefulLifeYears) || 0,
            depreciationRate: Number(data.depreciationRate) || 0,

            transactions: initialAsset?.transactions || [],
            updatedAt: new Date().toISOString(),
            notes: data.notes
        };
        onSave(newAsset);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialAsset ? `Edit: ${initialAsset.name}` : t('assets.wizard.title_simple')} icon={<Box size={24} />}>
            <div className="space-y-4">

                {/* PRIMARY INFO */}
                <Input label={t('assets.form.name')} value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })} autoFocus placeholder="e.g. My Apartment, Tesla Model 3" />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label={t('assets.form.category')}
                        value={data.category || ''}
                        onChange={e => handleCategoryChange(e.target.value)}
                        options={['Real Estate', 'Vehicle', 'Technology', 'Financial', 'Business', 'Other'].map(v => ({ value: v, label: t(`assets.cat.${v.toLowerCase().replace(' ', '_')}`) }))}
                    />
                    <Select
                        label={t('assets.form.currency')}
                        value={data.currency || baseCurrency}
                        onChange={e => setData({ ...data, currency: e.target.value as any })}
                        options={['COP', 'USD', 'EUR'].map(v => ({ value: v, label: v }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <NumericInput
                        label={t('assets.form.current_value')}
                        value={data.currentValue?.toString() || ''}
                        onValueChange={v => setData({ ...data, currentValue: Number(v) })}
                        placeholder="0.00"
                        currency={data.currency}
                    />
                    <NumericInput
                        label={t('assets.form.purchase_price')}
                        value={data.purchasePrice?.toString() || ''}
                        onValueChange={v => setData({ ...data, purchasePrice: Number(v) })}
                        placeholder="Original Cost"
                        currency={data.currency}
                    />
                </div>

                {/* OPTIONAL / ADVANCED */}
                <div className="pt-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-normal)] transition-colors"
                    >
                        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showAdvanced ? t('assets.wizard.hide_details') : t('assets.wizard.show_details')}
                    </button>

                    {showAdvanced && (
                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <Input type="date" label={t('assets.form.purchase_date')} value={data.purchaseDate || ''} onChange={e => setData({ ...data, purchaseDate: e.target.value })} />
                            <Input label={t('assets.form.location')} value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} placeholder="Optional details..." />

                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${data.isIncomeGenerating ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[var(--background-primary)] border-[var(--background-modifier-border)]'}`}
                                    onClick={() => setData({ ...data, isIncomeGenerating: !data.isIncomeGenerating })}
                                >
                                    <DollarSign size={16} className={data.isIncomeGenerating ? 'text-emerald-500' : 'text-[var(--text-muted)]'} />
                                    <span className="text-xs font-bold">{t('assets.wizard.income_question')}</span>
                                </div>
                                <div
                                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${data.isDepreciating ? 'bg-rose-500/10 border-rose-500' : 'bg-[var(--background-primary)] border-[var(--background-modifier-border)]'}`}
                                    onClick={() => setData({ ...data, isDepreciating: !data.isDepreciating })}
                                >
                                    <TrendingUp size={16} className={`transform rotate-180 ${data.isDepreciating ? 'text-rose-500' : 'text-[var(--text-muted)]'}`} />
                                    <span className="text-xs font-bold">{t('assets.wizard.depreciation_question')}</span>
                                </div>
                            </div>

                            <Select
                                label={t('assets.form.status')}
                                value={data.status || 'active'}
                                onChange={e => setData({ ...data, status: e.target.value as ProjectStatus })}
                                options={['idea', 'diligence', 'active', 'sold', 'closed', 'archived', 'completed'].map(s => ({ value: s, label: t(`assets.status.${s}`) }))}
                            />
                        </div>
                    )}
                </div>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>{t('btn.cancel')}</Button>
                    <Button onClick={handleFinish}>{initialAsset ? t('btn.save') : t('btn.create')}</Button>
                </ModalFooter>
            </div>
        </Modal>
    );
};
