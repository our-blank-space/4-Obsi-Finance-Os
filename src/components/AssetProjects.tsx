import React, { useState, useMemo } from 'react';
import { Asset, ProjectStatus } from '../types/assets';
import { useTranslation } from '../hooks/useTranslation';
import { AssetDashboard } from './assets/AssetDashboard';
import { AssetCard } from './assets/AssetCard';
import { AssetDetailView } from './assets/AssetDetailView';
import { AssetWizard } from './assets/AssetWizard';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Plus, Box, Filter, Check } from 'lucide-react';

interface AssetProjectsProps {
  assets: Asset[];
  onUpdate: (assets: Asset[]) => void;
}

const AssetProjects: React.FC<AssetProjectsProps> = ({ assets, onUpdate }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'active' | 'pipeline' | 'archive'>('active');

  // Selection & Wizard States
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null); // New state for editing
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter Assets based on View
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const status = asset.status || 'active';
      if (view === 'active') return status === 'active';
      if (view === 'pipeline') return status === 'idea' || status === 'diligence';
      if (view === 'archive') return status === 'closed' || status === 'sold' || status === 'archived';
      return false;
    });
  }, [assets, view]);

  // Handlers
  const handleSaveAsset = (newAsset: Asset) => {
    if (editingAsset) {
      // Update existing
      onUpdate(assets.map(a => a.id === newAsset.id ? newAsset : a));
      setEditingAsset(null);
    } else {
      // Create new
      onUpdate([...assets, newAsset]);
    }
    setIsWizardOpen(false);
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    onUpdate(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const handleDeleteAsset = (id?: string) => {
    const targetId = id || deleteId;
    if (targetId) {
      onUpdate(assets.filter(a => a.id !== targetId));
      if (selectedAssetId === targetId) setSelectedAssetId(null);
      setDeleteId(null);
    }
  };

  const openEditWizard = (asset: Asset) => {
    setEditingAsset(asset);
    setIsWizardOpen(true);
  };

  // Render Logic
  const selectedAsset = useMemo(() => assets.find(a => a.id === selectedAssetId), [assets, selectedAssetId]);

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-5xl mx-auto font-sans px-4 sm:px-0">

      {selectedAsset ? (
        <AssetDetailView
          asset={selectedAsset}
          onUpdate={handleUpdateAsset}
          onClose={() => setSelectedAssetId(null)}
          onEdit={openEditWizard}
          onDelete={(id) => setDeleteId(id)}
        />
      ) : (
        <>
          {/* HEADER */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-normal)] uppercase italic flex items-center gap-2">
                <Box className="text-[var(--interactive-accent)]" /> {t('asset.title')}
              </h1>
              <p className="text-[var(--text-muted)] text-sm font-medium">{t('asset.subtitle')}</p>
            </div>
            <Button onClick={() => setIsWizardOpen(true)} icon={<Plus size={18} />}>
              {t('assets.btn.create')}
            </Button>
          </header>

          {/* DASHBOARD (Only on Active View) */}
          {view === 'active' && <AssetDashboard assets={assets} />}

          {/* TABS & FILTERS */}
          <div className="flex justify-between items-center bg-[var(--background-secondary)] p-1.5 rounded-xl border border-[var(--background-modifier-border)]">
            <div className="flex gap-1">
              <button onClick={() => setView('active')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-[var(--background-primary)] text-[var(--interactive-accent)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}>
                {t('assets.filter.active')}
              </button>
              <button onClick={() => setView('pipeline')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'pipeline' ? 'bg-[var(--background-primary)] text-blue-500 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}>
                {t('assets.filter.pipeline')}
              </button>
              <button onClick={() => setView('archive')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'archive' ? 'bg-[var(--background-primary)] text-[var(--text-normal)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}>
                {t('assets.filter.archive')}
              </button>
            </div>
            <div className="px-4 text-[10px] font-bold text-[var(--text-muted)] hidden sm:block">
              {filteredAssets.length} {t('assets.items')}
            </div>
          </div>

          {/* ASSET GRID */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)] border-2 border-dashed border-[var(--background-modifier-border)] rounded-3xl">
              <Box size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">{t('assets.empty.view')}</p>
              <Button variant="ghost" className="mt-4" onClick={() => setIsWizardOpen(true)}>{t('assets.btn.create_first')}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => setSelectedAssetId(asset.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* WIZARD MODAL */}
      <AssetWizard
        isOpen={isWizardOpen}
        onClose={() => { setIsWizardOpen(false); setEditingAsset(null); }}
        onSave={handleSaveAsset}
        initialAsset={editingAsset}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDeleteAsset()}
        title={t('assets.delete.title')}
        description={t('assets.delete.desc')}
        intent="delete_asset"
      />

    </div>
  );
};

export default AssetProjects;