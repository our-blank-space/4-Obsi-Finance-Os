// src/components/BusinessManager.tsx
// === MÓDULO AGROPECUARIO ===
// Gestión de lotes de cerdos, aves y cultivos.

import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTranslation } from '../hooks/useTranslation';
import { FarmProject, FarmCost, FarmSale, FarmClient, ClientPayment } from '../types/business';
import { PiggyBank, DollarSign, ShoppingBag, Users, Plus, TrendingUp } from 'lucide-react';

// Sub-componentes
import { FarmProjectCard } from './farm/FarmProjectCard';
import { FarmNewProjectModal } from './farm/FarmNewProjectModal';
import { FarmCostForm } from './farm/FarmCostForm';
import { FarmSaleForm } from './farm/FarmSaleForm';
import { FarmClientBook } from './farm/FarmClientBook';
import { FarmWeightModal } from './farm/FarmWeightModal';
import { FarmMortalityModal } from './farm/FarmMortalityModal';

type Tab = 'lots' | 'costs' | 'sales' | 'clients';

const TabButton = ({ active, onClick, icon, label, badge }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number;
}) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
            active
                ? 'bg-[var(--background-primary)] text-[var(--text-normal)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'
        }`}
    >
        {icon}
        {label}
        {badge != null && badge > 0 && (
            <span className="absolute -top-1 -right-1 text-[9px] font-black bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

export const BusinessManager: React.FC = () => {
    const { state, dispatch, saveDataNow } = useFinance();
    const { t } = useTranslation();
    const { business, baseCurrency } = state;

    const [activeTab, setActiveTab] = useState<Tab>('lots');
    const [showNewProject, setShowNewProject] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        (business.projects as FarmProject[]).find(p => p.status === 'active')?.id ?? null
    );
    const [showWeightModalId, setShowWeightModalId] = useState<string | null>(null);
    const [showMortalityModalId, setShowMortalityModalId] = useState<string | null>(null);

    const projects: FarmProject[] = (business.projects ?? []) as FarmProject[];
    const sales: FarmSale[] = (business.sales ?? []) as FarmSale[];
    const clients: FarmClient[] = (business.clients ?? []) as FarmClient[];

    const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: baseCurrency }).format(v);

    // --- Métricas globales ---
    const totalInvested = projects.reduce((s, p) => s + p.costs.reduce((cs, c) => cs + c.amount, 0), 0);
    const totalRevenue = sales.reduce((s, v) => s + v.totalAmount, 0);
    const totalPending = sales.reduce((s, v) => s + v.balance, 0);
    const activeCount = projects.filter(p => p.status === 'active').length;

    // --- HANDLERS ---

    const handleSaveProject = (project: FarmProject) => {
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: { projects: [project, ...projects] }
        });
        setSelectedProjectId(project.id);
        setShowNewProject(false);
        setActiveTab('costs');
        saveDataNow();
    };

    const handleDeleteProject = (id: string) => {
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                projects: projects.filter(p => p.id !== id),
                sales: sales.filter(s => s.projectId !== id)
            }
        });
        if (selectedProjectId === id) setSelectedProjectId(null);
        saveDataNow();
    };

    const handleCloseProject = (id: string) => {
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                projects: projects.map(p =>
                    p.id === id
                        ? { ...p, status: 'closed' as const, closeDate: new Date().toISOString().split('T')[0] }
                        : p
                )
            }
        });
        saveDataNow();
    };

    const handleAddCost = (projectId: string, cost: FarmCost) => {
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                projects: projects.map(p =>
                    p.id === projectId ? { ...p, costs: [...p.costs, cost] } : p
                )
            }
        });
        saveDataNow();
    };

    const handleNewClient = (name: string): FarmClient => {
        const newClient: FarmClient = {
            id: crypto.randomUUID(),
            name,
            payments: [],
        };
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: { clients: [newClient, ...clients] }
        });
        return newClient;
    };

    const handleSaveSale = (sale: FarmSale) => {
        const updatedSales = [sale, ...sales];
        // Si el cliente es nuevo y no existe aún, asegurarnos que se creó
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: { sales: updatedSales }
        });
        saveDataNow();
    };

    const handleAddWeight = (projectId: string, weightKg: number, note: string) => {
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                projects: projects.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            weightLogs: [...(p.weightLogs || []), { date: new Date().toISOString().split('T')[0], weightKg, note }]
                        }
                        : p
                )
            }
        });
        setShowWeightModalId(null);
        saveDataNow();
    };

    const handleAddMortality = (projectId: string, count: number, reason: string) => {
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                projects: projects.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            mortalityCount: (p.mortalityCount || 0) + count,
                            notes: p.notes ? `${p.notes}\n[Baja ${count}${reason ? ': ' + reason : ''}]` : `[Baja ${count}${reason ? ': ' + reason : ''}]`
                        }
                        : p
                )
            }
        });
        setShowMortalityModalId(null);
        saveDataNow();
    };

    const handleRegisterPayment = (clientId: string, saleId: string, payment: ClientPayment, newBalance: number) => {
        const updatedSales = sales.map(s =>
            s.id === saleId
                ? {
                    ...s,
                    balance: newBalance,
                    amountPaid: s.amountPaid + payment.amount,
                    paymentStatus: newBalance <= 0 ? 'paid' as const : 'partial' as const
                }
                : s
        );
        const updatedClients = clients.map(c =>
            c.id === clientId
                ? { ...c, payments: [...c.payments, payment] }
                : c
        );
        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: { sales: updatedSales, clients: updatedClients }
        });
        saveDataNow();
    };

    // Proyecto seleccionado para el tab costos
    const selectedProject = projects.find(p => p.id === selectedProjectId) ?? projects.find(p => p.status === 'active') ?? null;
    const pendingClientsCount = clients.filter(c =>
        sales.some(s => s.clientId === c.id && s.balance > 0)
    ).length;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-6xl mx-auto flex flex-col">

            {/* HEADER */}
            <header className="flex items-start justify-between shrink-0 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black italic flex items-center gap-3 text-[var(--text-normal)]">
                        <PiggyBank className="text-rose-500" /> Agropecuario
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Gestión de lotes, costos, ventas y cartera</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* KPI chips */}
                    <div className="flex gap-2">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] text-[var(--text-muted)]">
                            🐷 {activeCount} lote{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
                        </span>
                        {totalPending > 0 && (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600">
                                💰 {fmt(totalPending)} por cobrar
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowNewProject(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={14} /> Nuevo Lote
                    </button>
                </div>
            </header>

            {/* MÉTRICAS GLOBALES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                {[
                    { label: 'Inversión Total', value: fmt(totalInvested), iconColor: 'text-rose-500', icon: <TrendingUp size={16} /> },
                    { label: 'Ventas Totales', value: fmt(totalRevenue), iconColor: 'text-emerald-500', icon: <ShoppingBag size={16} /> },
                    { label: 'Rentabilidad', value: fmt(totalRevenue - totalInvested), iconColor: totalRevenue >= totalInvested ? 'text-emerald-500' : 'text-rose-500', icon: <DollarSign size={16} /> },
                    { label: 'Por Cobrar', value: fmt(totalPending), iconColor: 'text-amber-500', icon: <Users size={16} /> },
                ].map(({ label, value, iconColor, icon }) => (
                    <div key={label} className={`bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
                        <div className={`text-[10px] uppercase font-bold ${iconColor} mb-1 flex items-center gap-1.5`}>{icon}{label}</div>
                        <div className={`font-mono font-black text-lg ${iconColor}`}>{value}</div>
                    </div>
                ))}
            </div>

            {/* TABS */}
            <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)] w-fit shrink-0">
                <TabButton active={activeTab === 'lots'} onClick={() => setActiveTab('lots')} icon={<PiggyBank size={14} />} label="Lotes" />
                <TabButton active={activeTab === 'costs'} onClick={() => setActiveTab('costs')} icon={<TrendingUp size={14} />} label="Costos" />
                <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<ShoppingBag size={14} />} label="Ventas" />
                <TabButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={14} />} label="Clientes" badge={pendingClientsCount} />
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 mt-2">

                {/* === LOTES === */}
                {activeTab === 'lots' && (
                    <div className="space-y-4">
                        {projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] border-2 border-dashed border-[var(--background-modifier-border)] rounded-2xl opacity-50">
                                <PiggyBank size={48} strokeWidth={1} className="mb-3" />
                                <p className="font-bold">Sin lotes registrados</p>
                                <button onClick={() => setShowNewProject(true)} className="mt-3 text-emerald-500 text-xs font-bold underline">Crear primer lote</button>
                            </div>
                        ) : (
                            <>
                                {/* Activos */}
                                {projects.filter(p => p.status === 'active').length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
                                            Lotes Activos
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {projects.filter(p => p.status === 'active').map(p => (
                                                <FarmProjectCard
                                                    key={p.id}
                                                    project={p}
                                                    sales={sales}
                                                    currency={baseCurrency}
                                                    onDelete={handleDeleteProject}
                                                    onClose={handleCloseProject}
                                                    onAddWeight={setShowWeightModalId}
                                                    onAddMortality={setShowMortalityModalId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Cerrados */}
                                {projects.filter(p => p.status === 'closed').length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-[var(--text-muted)] mb-3 mt-6">Lotes Cerrados</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {projects.filter(p => p.status === 'closed').map(p => (
                                                <FarmProjectCard
                                                    key={p.id}
                                                    project={p}
                                                    sales={sales}
                                                    currency={baseCurrency}
                                                    onDelete={handleDeleteProject}
                                                    onClose={handleCloseProject}
                                                    onAddWeight={setShowWeightModalId}
                                                    onAddMortality={setShowMortalityModalId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* === COSTOS === */}
                {activeTab === 'costs' && (
                    <div className="space-y-4">
                        {/* Selector de lote */}
                        {projects.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Lote destino</label>
                                <select
                                    value={selectedProjectId ?? ''}
                                    onChange={e => setSelectedProjectId(e.target.value)}
                                    className="w-full max-w-sm bg-[var(--background-secondary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.status === 'closed' ? '(cerrado)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedProject ? (
                            <FarmCostForm
                                project={selectedProject}
                                currency={baseCurrency}
                                onSave={handleAddCost}
                            />
                        ) : (
                            <div className="text-center py-12 text-[var(--text-muted)] text-sm opacity-50">
                                Crea un lote primero para registrar costos.
                            </div>
                        )}
                    </div>
                )}

                {/* === VENTAS === */}
                {activeTab === 'sales' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FarmSaleForm
                            projects={projects}
                            clients={clients}
                            currency={baseCurrency}
                            onSave={handleSaveSale}
                            onNewClient={handleNewClient}
                        />

                        {/* Historial de ventas */}
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Historial de ventas</p>
                            {sales.length === 0 ? (
                                <div className="text-center py-10 text-[var(--text-muted)] text-xs opacity-50">Sin ventas registradas aún.</div>
                            ) : (
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {sales.map(sale => {
                                        const proj = projects.find(p => p.id === sale.projectId);
                                        return (
                                            <div key={sale.id} className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-xl p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-sm text-[var(--text-normal)]">{sale.clientName || 'Sin cliente'}</div>
                                                        <div className="text-[10px] text-[var(--text-muted)]">{sale.date} · {proj?.name}</div>
                                                        {sale.note && <div className="text-[10px] italic text-[var(--text-muted)] mt-0.5">{sale.note}</div>}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono font-bold text-emerald-500">{fmt(sale.totalAmount)}</div>
                                                        {sale.balance > 0 && (
                                                            <div className="text-[10px] text-amber-600 font-bold">Debe: {fmt(sale.balance)}</div>
                                                        )}
                                                        {sale.balance <= 0 && (
                                                            <div className="text-[10px] text-emerald-500 font-bold">Pagado ✓</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* === CLIENTES === */}
                {activeTab === 'clients' && (
                    <FarmClientBook
                        clients={clients}
                        sales={sales}
                        currency={baseCurrency}
                        onRegisterPayment={handleRegisterPayment}
                    />
                )}
            </div>

            {/* MODAL NUEVO LOTE */}
            {showNewProject && (
                <FarmNewProjectModal
                    currency={baseCurrency}
                    onSave={handleSaveProject}
                    onClose={() => setShowNewProject(false)}
                />
            )}

            {/* MODALES BIOMETRÍA */}
            {showWeightModalId && (
                <FarmWeightModal
                    projectName={projects.find(p => p.id === showWeightModalId)?.name || ''}
                    onSave={(w, n) => handleAddWeight(showWeightModalId, w, n)}
                    onClose={() => setShowWeightModalId(null)}
                />
            )}
            {showMortalityModalId && (
                <FarmMortalityModal
                    projectName={projects.find(p => p.id === showMortalityModalId)?.name || ''}
                    onSave={(c, r) => handleAddMortality(showMortalityModalId, c, r)}
                    onClose={() => setShowMortalityModalId(null)}
                />
            )}
        </div>
    );
};

export default BusinessManager;
