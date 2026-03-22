// src/components/farm/FarmSaleForm.tsx
import React, { useState } from 'react';
import { FarmProject, FarmSale, FarmClient, PigSaleMode } from '../../types/business';
import { NumericInput } from '../ui/NumericInput';
import { Input } from '../ui/Input';
import { ShoppingBag } from 'lucide-react';

interface FarmSaleFormProps {
    projects: FarmProject[];
    clients: FarmClient[];
    currency: string;
    onSave: (sale: FarmSale) => void;
    onNewClient: (name: string) => FarmClient;
}

export const FarmSaleForm: React.FC<FarmSaleFormProps> = ({ projects, clients, currency, onSave, onNewClient }) => {
    const activeProjects = projects.filter(p => p.status === 'active');

    const [projectId, setProjectId] = useState(activeProjects[0]?.id ?? '');
    const [clientName, setClientName] = useState('');
    const [clientId, setClientId] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [note, setNote] = useState('');

    // --- Pig fields ---
    const [pigMode, setPigMode] = useState<PigSaleMode>('live_weight');
    const [pigWeightKg, setPigWeightKg] = useState('');
    const [pigPricePerKg, setPigPricePerKg] = useState('');

    // --- Poultry fields ---
    const [poultryQty, setPoultryQty] = useState('1');
    const [poultryWeightPerBird, setPoultryWeightPerBird] = useState('');
    const [poultryPricePerLb, setPoultryPricePerLb] = useState('');
    const [soldByEntable, setSoldByEntable] = useState(false);
    const [entablePrice, setEntablePrice] = useState('');

    const selectedProject = projects.find(p => p.id === projectId);

    // Calcular total automático
    const calcTotal = (): number => {
        if (!selectedProject) return 0;
        if (selectedProject.type === 'pig_fattening' || selectedProject.type === 'sow') {
            const w = Number(pigWeightKg) || 0;
            const p = Number(pigPricePerKg) || 0;
            return w * p;
        }
        if (selectedProject.type === 'poultry') {
            if (soldByEntable) {
                return (Number(poultryQty) || 0) * (Number(entablePrice) || selectedProject.refEntablePrice || 0);
            }
            const qty = Number(poultryQty) || 0;
            const w = Number(poultryWeightPerBird) || 0;
            const p = Number(poultryPricePerLb) || selectedProject.refPricePerLb || 0;
            return qty * w * p;
        }
        return 0;
    };

    const totalAmount = calcTotal();
    const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(v);
    const balance = Math.max(0, totalAmount - (Number(amountPaid) || 0));

    const handleSave = () => {
        if (!projectId || totalAmount <= 0) return;

        // Resolver cliente
        let resolvedClientId = clientId;
        let resolvedClientName = clientName;
        if (clientName && !clientId) {
            const existing = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
            if (existing) {
                resolvedClientId = existing.id;
                resolvedClientName = existing.name;
            } else {
                const newC = onNewClient(clientName);
                resolvedClientId = newC.id;
                resolvedClientName = newC.name;
            }
        }

        const pigDetail = (selectedProject?.type === 'pig_fattening' || selectedProject?.type === 'sow') ? {
            mode: pigMode,
            pricePerKgLive: pigMode === 'live_weight' ? Number(pigPricePerKg) : undefined,
            liveWeightKg: pigMode === 'live_weight' ? Number(pigWeightKg) : undefined,
            pricePerKg: pigMode === 'canal' ? Number(pigPricePerKg) : undefined,
            canalWeightKg: pigMode === 'canal' ? Number(pigWeightKg) : undefined,
        } : undefined;

        const poultryDetail = selectedProject?.type === 'poultry' ? {
            quantity: Number(poultryQty) || 1,
            pricePerLb: Number(poultryPricePerLb) || selectedProject.refPricePerLb || 0,
            weightPerBirdLb: Number(poultryWeightPerBird) || 0,
            entablePricePerBird: soldByEntable ? (Number(entablePrice) || selectedProject.refEntablePrice) : undefined,
            soldByEntable,
        } : undefined;

        const sale: FarmSale = {
            id: crypto.randomUUID(),
            projectId,
            date: new Date().toISOString().split('T')[0],
            clientId: resolvedClientId || undefined,
            clientName: resolvedClientName || undefined,
            totalAmount,
            amountPaid: Number(amountPaid) || 0,
            balance,
            paymentStatus: balance <= 0 ? 'paid' : (Number(amountPaid) > 0 ? 'partial' : 'pending'),
            note: note || undefined,
            pigDetail,
            poultryDetail,
        };

        onSave(sale);

        // Reset
        setClientName('');
        setClientId('');
        setAmountPaid('');
        setNote('');
        setPigWeightKg('');
        setPigPricePerKg('');
        setPoultryQty('1');
        setPoultryWeightPerBird('');
        setPoultryPricePerLb('');
        setEntablePrice('');
        setSoldByEntable(false);
    };

    return (
        <div className="bg-[var(--background-secondary)] rounded-3xl border border-[var(--background-modifier-border)] p-6 space-y-5 shadow-sm">
            <h3 className="font-black text-sm uppercase text-[var(--text-muted)]">Registrar Venta</h3>

            {/* Selector de lote */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Lote</label>
                <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full bg-[var(--background-primary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                >
                    {activeProjects.length === 0 && <option value="">Sin lotes activos</option>}
                    {activeProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* === CERDO === */}
            {(selectedProject?.type === 'pig_fattening' || selectedProject?.type === 'sow') && (
                <>
                    <div className="flex gap-2 bg-[var(--background-primary)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
                        <button
                            onClick={() => setPigMode('live_weight')}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${pigMode === 'live_weight' ? 'bg-rose-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
                        >En Pie (kg vivo)</button>
                        <button
                            onClick={() => setPigMode('canal')}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${pigMode === 'canal' ? 'bg-rose-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
                        >En Canal (kg canal)</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericInput
                            label={pigMode === 'live_weight' ? 'Peso vivo (kg)' : 'Peso canal (kg)'}
                            value={pigWeightKg}
                            onValueChange={setPigWeightKg}
                        />
                        <NumericInput
                            label="Precio / kg"
                            value={pigPricePerKg}
                            onValueChange={setPigPricePerKg}
                            currency={currency}
                        />
                    </div>
                </>
            )}

            {/* === POLLO === */}
            {selectedProject?.type === 'poultry' && (
                <>
                    <div className="flex gap-2 bg-[var(--background-primary)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
                        <button
                            onClick={() => setSoldByEntable(false)}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${!soldByEntable ? 'bg-amber-500 text-white shadow' : 'text-[var(--text-muted)]'}`}
                        >Por Libra</button>
                        <button
                            onClick={() => setSoldByEntable(true)}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${soldByEntable ? 'bg-amber-500 text-white shadow' : 'text-[var(--text-muted)]'}`}
                        >Por Entable</button>
                    </div>
                    <NumericInput label="Cantidad de aves" value={poultryQty} onValueChange={setPoultryQty} />
                    {!soldByEntable ? (
                        <div className="grid grid-cols-2 gap-3">
                            <NumericInput
                                label={`Peso/ave (lb) `}
                                value={poultryWeightPerBird}
                                onValueChange={setPoultryWeightPerBird}
                            />
                            <NumericInput
                                label={`Precio/lb`}
                                value={poultryPricePerLb}
                                onValueChange={setPoultryPricePerLb}
                                currency={currency}
                            />
                        </div>
                    ) : (
                        <NumericInput
                            label="Precio por entable (ave entera)"
                            value={entablePrice}
                            onValueChange={setEntablePrice}
                            currency={currency}
                        />
                    )}
                </>
            )}

            {/* === CULTIVO === */}
            {selectedProject?.type === 'crop' && (
                <NumericInput
                    label="Total venta"
                    value={amountPaid}
                    onValueChange={v => { setAmountPaid(v); }}
                    currency={currency}
                />
            )}

            {/* Total calculado */}
            {totalAmount > 0 && (
                <div className="relative overflow-hidden px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-inner shadow-emerald-500/5">
                    <div className="absolute top-0 right-0 p-1 opacity-10">
                        <ShoppingBag size={48} className="text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-emerald-600 tracking-widest">Total de la Venta</span>
                            <span className="text-[9px] text-emerald-600/60 font-medium">Calculado automáticamente</span>
                        </div>
                        <span className="font-mono font-black text-2xl text-emerald-500 tabular-nums">{fmt(totalAmount)}</span>
                    </div>
                </div>
            )}

            {/* Cliente y pago */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Cliente</label>
                    <input
                        list="client-list"
                        value={clientName}
                        onChange={e => {
                            setClientName(e.target.value);
                            const found = clients.find(c => c.name === e.target.value);
                            setClientId(found?.id ?? '');
                        }}
                        placeholder="Nombre cliente"
                        className="w-full bg-[var(--background-primary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                    />
                    <datalist id="client-list">
                        {clients.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                </div>
                <NumericInput
                    label="Abono / Pago inicial"
                    value={amountPaid}
                    onValueChange={setAmountPaid}
                    currency={currency}
                />
            </div>

            {balance > 0 && (
                <div className="flex justify-between text-xs text-amber-600 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    <span>Queda debiendo:</span>
                    <span className="font-mono">{fmt(balance)}</span>
                </div>
            )}

            <Input label="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} placeholder="Observaciones..." />

            <button
                onClick={handleSave}
                disabled={!projectId || totalAmount <= 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
                <ShoppingBag size={14} /> Registrar Venta
            </button>
        </div>
    );
};
