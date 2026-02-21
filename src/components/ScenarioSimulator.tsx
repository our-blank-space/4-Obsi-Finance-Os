import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTranslation } from '../hooks/useTranslation';
import { Scenario, ScenarioType } from '../types';
import { TrendingUp, Sprout, Egg, Save, History, Play, RotateCcw, ArrowRight, Calculator, Trash2, Scale, Box } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const ScenarioSimulator: React.FC = () => {
    const { state, dispatch } = useFinance();
    const { t } = useTranslation();
    const { baseCurrency } = state;

    // --- STATE ---
    const [view, setView] = useState<'menu' | 'simulator' | 'history' | 'comparison'>('menu');
    const [selectedType, setSelectedType] = useState<ScenarioType>('passive');

    // Dynamic Inputs
    const [inputs, setInputs] = useState<Record<string, number>>({});
    const [simName, setSimName] = useState('');
    const [timeHorizon, setTimeHorizon] = useState(1); // Default 1 (year or cycle)

    // Comparison State
    const [compareSelection, setCompareSelection] = useState<string[]>([]); // IDs of selected scenarios

    // --- TEMPLATES ---
    const TEMPLATES = {
        passive: {
            title: 'Passive Growth',
            icon: <TrendingUp size={24} className="text-emerald-400" />,
            desc: 'Real Estate, Crypto, Savings',
            inputs: [
                { key: 'initialValue', label: 'Initial Value', default: 1000 },
                { key: 'growthRate', label: 'Annual Growth (%)', default: 10 },
            ],
            unit: 'Years'
        },
        livestock: {
            title: 'Livestock / Production',
            icon: <Egg size={24} className="text-amber-400" />,
            desc: 'Animals (Chickens, Pigs)',
            inputs: [
                { key: 'quantity', label: 'Quantity (Animals)', default: 10 },
                { key: 'consumptionPerUnit', label: 'Feed per Unit (Sacks/Kg)', default: 2 },
                { key: 'costPerUnit', label: 'Cost per Feed Unit', default: 40 },
                { key: 'finalWeight', label: 'Avg Final Weight (Kg)', default: 2 },
                { key: 'pricePerKilo', label: 'Sale Price per Kilo', default: 8 },
                { key: 'fixedCosts', label: 'Fixed Costs (Rent/Labor)', default: 100 },
            ],
            unit: 'Cycles'
        },
        agriculture: {
            title: 'Agriculture / Sowing',
            icon: <Sprout size={24} className="text-lime-400" />,
            desc: 'Crops (Beans, Corn, Rice)',
            inputs: [
                { key: 'area', label: 'Area / Seed Qty (Kg)', default: 10 },
                { key: 'yield', label: 'Yield (Kg harvest / Kg seed)', default: 20 },
                { key: 'pricePerKilo', label: 'Sale Price per Kilo', default: 5 },
                { key: 'fixedCosts', label: 'Fixed Costs (Labor/Fertilizer)', default: 500 },
            ],
            unit: 'Harvests'
        }
    };

    // --- LOGIC HELPER ---
    const calculate = (type: ScenarioType, vars: Record<string, number>, time: number) => {
        let cost = 0;
        let revenue = 0;
        let finalValue = 0;
        let breakEvenPrice = 0;
        let breakEvenVolume = 0;

        if (type === 'passive') {
            const v0 = vars.initialValue || 0;
            const r = (vars.growthRate || 0) / 100;
            finalValue = v0 * Math.pow(1 + r, time);
            cost = v0;
            revenue = finalValue;
        }
        else if (type === 'livestock') {
            const qty = vars.quantity || 0;
            const cons = vars.consumptionPerUnit || 0;
            const feedCost = vars.costPerUnit || 0;
            const fixed = vars.fixedCosts || 0;

            // Var Cost per animal (per cycle)
            const varCostPerUnit = cons * feedCost;
            // Total Cost = (VarPerUnit * Qty * Time) + (Fixed * Time)
            cost = (varCostPerUnit * qty * time) + (fixed * time);

            const weight = vars.finalWeight || 0;
            const price = vars.pricePerKilo || 0;
            // Rev per animal (per cycle) = Weight * Price
            const revPerUnit = weight * price;
            revenue = qty * revPerUnit * time;

            finalValue = revenue;

            // Break Even Price (per Kilo) to cover Total Costs
            // TotalCost = (VarCostPerUnit * Qty * Time) + (Fixed * Time)
            // TotalRev = (Price * Weight * Qty * Time)
            // Price = TotalCost / (Weight * Qty * Time)
            const totalProdWeight = qty * weight * time; // Total production over time horizon
            if (totalProdWeight > 0) {
                breakEvenPrice = cost / totalProdWeight;
            }

            // Break Even Volume (Quantity of Animals to sell)
            // Fixed / (UnitContribution)
            // UnitContrib = RevPerUnit - VarCostPerUnit
            const unitContrib = revPerUnit - varCostPerUnit;
            if (unitContrib > 0) {
                breakEvenVolume = (fixed * time) / unitContrib; // Fixed costs are per cycle, so scale by time
            }
        }
        else if (type === 'agriculture') {
            const area = vars.area || 0;
            const yieldRate = vars.yield || 0;
            const price = vars.pricePerKilo || 0;
            revenue = area * yieldRate * price * time;

            const fixed = vars.fixedCosts || 0;
            cost = fixed * time; // Assumes fixed costs are per harvest

            finalValue = revenue;

            // Break Even Price: Cost / (Production)
            // For Agri, assumes "Var Cost" is negligible or included in Fixed for this simple model?
            // "fixedCosts" here acts as Total Costs for the area. 
            // So Break Even Price = Fixed / Production
            const prodBase = area * yieldRate * time; // Total production over time horizon
            if (prodBase > 0) {
                breakEvenPrice = cost / prodBase;
            }

            // Break Even Volume (Kg to sell)
            // Fixed / Price
            // (Since VarCost is 0 in this simplified model, Contribution = Price)
            if (price > 0) {
                breakEvenVolume = (fixed * time) / price; // Fixed costs are per harvest, so scale by time
            }
        }

        const profit = revenue - cost;
        const roi = cost > 0 ? (profit / cost) * 100 : 0;
        return { cost, revenue, profit, roi, finalValue, breakEvenPrice, breakEvenVolume };
    };

    const currentResult = useMemo(() => calculate(selectedType, inputs, timeHorizon), [selectedType, inputs, timeHorizon]);

    const chartData = useMemo(() => {
        const data = [];
        for (let t = 0; t <= timeHorizon; t++) {
            const res = calculate(selectedType, inputs, t);
            data.push({
                name: `T${t}`,
                value: res.finalValue,
                profit: res.profit
            });
        }
        return data;
    }, [selectedType, inputs, timeHorizon]);

    // --- HANDLERS ---
    const handleStart = (type: ScenarioType) => {
        setSelectedType(type);
        // Load defaults
        const defs: Record<string, number> = {};
        TEMPLATES[type as keyof typeof TEMPLATES].inputs.forEach(i => defs[i.key] = i.default);
        setInputs(defs);
        setSimName(`${TEMPLATES[type as keyof typeof TEMPLATES].title} #${state.scenarios ? state.scenarios.length + 1 : 1}`);
        setView('simulator');
    };

    const handleSave = () => {
        const newScenario: Scenario = {
            id: crypto.randomUUID(),
            name: simName || `Scenario ${new Date().toLocaleDateString()}`,
            type: selectedType,
            variables: inputs,
            timeHorizon: timeHorizon,
            createdAt: new Date().toISOString()
        };

        const updatedScenarios = [...(state.scenarios || []), newScenario];
        dispatch({ type: 'SET_SCENARIOS', payload: updatedScenarios });

        alert(t('common.saved') || "Scenario Saved");
    };

    const handleLoad = (scenario: Scenario) => {
        setSelectedType(scenario.type);
        setInputs(scenario.variables);
        setSimName(scenario.name);
        setTimeHorizon(scenario.timeHorizon);
        setView('simulator');
    };

    const handleDelete = (id: string) => {
        const updated = (state.scenarios || []).filter(s => s.id !== id);
        dispatch({ type: 'SET_SCENARIOS', payload: updated });
    };

    const toggleCompare = (id: string) => {
        if (compareSelection.includes(id)) {
            setCompareSelection(compareSelection.filter(i => i !== id));
        } else {
            if (compareSelection.length < 2) {
                setCompareSelection([...compareSelection, id]);
            }
        }
    };

    const format = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: baseCurrency }).format(v);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col">
            <header>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black italic flex items-center gap-3 text-[var(--text-normal)]">
                        <Calculator className="text-violet-500" /> {t('nav.simulations') || 'Simulators'}
                    </h1>
                    <div className="flex items-center gap-2">
                        {view !== 'menu' && (
                            <button onClick={() => setView('menu')} className="text-xs font-bold uppercase text-[var(--text-muted)] hover:text-[var(--text-normal)]">
                                Menu
                            </button>
                        )}
                        <button
                            onClick={() => setView('history')}
                            className={`p-2 rounded-lg transition-all ${view === 'history' || view === 'comparison' ? 'bg-violet-500 text-white' : 'hover:bg-[var(--background-modifier-hover)]'}`}
                            title="History & Compare"
                        >
                            <History size={20} />
                        </button>
                    </div>
                </div>
                <p className="text-[var(--text-muted)] text-sm mt-1">Universal Scenario Calculator (CTTSA)</p>
            </header>

            {/* --- MENU VIEW --- */}
            {view === 'menu' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {(Object.entries(TEMPLATES) as [ScenarioType, any][]).map(([key, tmpl]) => (
                        <button
                            key={key}
                            onClick={() => handleStart(key)}
                            className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] p-8 rounded-[2rem] hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-125">
                                {tmpl.icon}
                            </div>
                            <div className="mb-4 bg-[var(--background-primary)] w-fit p-3 rounded-xl shadow-sm">
                                {tmpl.icon}
                            </div>
                            <h3 className="text-lg font-black uppercase mb-1">{tmpl.title}</h3>
                            <p className="text-xs text-[var(--text-muted)]">{tmpl.desc}</p>

                            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-violet-500 uppercase tracking-wider">
                                Start <ArrowRight size={12} />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* --- SIMULATOR VIEW --- */}
            {view === 'simulator' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    {/* INPUTS COL */}
                    <div className="lg:col-span-1 bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-3xl p-6 h-fit">
                        <div className="flex items-center gap-2 mb-6">
                            <button onClick={() => setView('menu')} className="p-2 hover:bg-[var(--background-modifier-hover)] rounded-lg">
                                <RotateCcw size={16} />
                            </button>
                            <input
                                value={simName}
                                onChange={e => setSimName(e.target.value)}
                                className="bg-transparent font-bold text-lg outline-none w-full"
                            />
                        </div>

                        <div className="space-y-4">
                            {TEMPLATES[selectedType as keyof typeof TEMPLATES].inputs.map(input => (
                                <div key={input.key}>
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 block">{input.label}</label>
                                    <input
                                        type="number"
                                        value={inputs[input.key]}
                                        onChange={e => setInputs({ ...inputs, [input.key]: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-[var(--background-primary)] p-3 rounded-xl border border-[var(--background-modifier-border)] font-mono text-sm outline-none focus:border-violet-500"
                                    />
                                </div>
                            ))}

                            <div className="pt-4 border-t border-[var(--background-modifier-border)]">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 block">
                                    Time ({TEMPLATES[selectedType as keyof typeof TEMPLATES].unit})
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="20" step="1"
                                        value={timeHorizon}
                                        onChange={e => setTimeHorizon(parseFloat(e.target.value))}
                                        className="flex-1 accent-violet-500"
                                    />
                                    <span className="font-mono font-bold w-8 text-center">{timeHorizon}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RESULTS COL */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* MAIN CARD */}
                        <div className="bg-gradient-to-br from-violet-950/50 to-fuchsia-950/50 border border-violet-500/20 rounded-[2.5rem] p-10 text-center relative overflow-hidden backdrop-blur-xl">
                            <div className="relative z-10">
                                <h3 className="text-sm font-black text-violet-300 uppercase tracking-[0.2em] mb-4">Projected Profit</h3>
                                <div className="text-6xl font-black text-white tracking-tighter mb-4 filter drop-shadow-lg">
                                    {format(currentResult.profit)}
                                </div>
                                <div className="flex justify-center gap-4">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${currentResult.roi >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        ROI: {currentResult.roi.toFixed(1)}%
                                    </span>
                                    <span className="bg-[var(--background-modifier-form-field)] px-3 py-1 rounded-lg text-xs font-bold text-[var(--text-normal)]">
                                        Gross: {format(currentResult.revenue)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DETAILS GRID */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--background-primary)] p-6 rounded-2xl border border-[var(--background-modifier-border)]">
                                <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold mb-1">Initial Investment / Cost</div>
                                <div className="text-2xl font-mono font-bold text-[var(--text-normal)]">{format(currentResult.cost)}</div>
                            </div>
                            <div className="bg-[var(--background-primary)] p-6 rounded-2xl border border-[var(--background-modifier-border)]">
                                <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold mb-1">Revenue</div>
                                <div className="text-2xl font-mono font-bold text-emerald-400">{format(currentResult.revenue)}</div>
                            </div>

                            {/* Break Even Card - PRICE */}
                            {selectedType !== 'passive' && currentResult.breakEvenPrice > 0 && (
                                <div className="col-span-1 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col justify-between">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                                            <Scale size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-amber-500/80">Min. Price</div>
                                            <div className="text-[9px] text-[var(--text-muted)]">To not lose</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-amber-400 text-right">
                                        {format(currentResult.breakEvenPrice)}
                                    </div>
                                </div>
                            )}

                            {/* Break Even Card - VOLUME */}
                            {selectedType !== 'passive' && (
                                <div className="col-span-1 bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl flex flex-col justify-between">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                                            <Box size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-blue-500/80">Min. Sales Qty</div>
                                            <div className="text-[9px] text-[var(--text-muted)]">Units to break even</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-blue-400 text-right">
                                        {currentResult.breakEvenVolume > 0
                                            ? Math.ceil(currentResult.breakEvenVolume).toLocaleString() + (selectedType === 'livestock' ? ' Animals' : ' Kg')
                                            : 'N/A'
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CHART */}
                        <div className="h-64 bg-[var(--background-primary)] rounded-2xl border border-[var(--background-modifier-border)] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'var(--text-muted)' }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--background-secondary)', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: 'var(--text-normal)' }}
                                        formatter={(val: number) => format(val)}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="bg-[var(--interactive-accent)] text-white px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <Save size={16} /> Save Scenario
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HISTORY & COMPARE VIEW --- */}
            {(view === 'history' || view === 'comparison') && (
                <div className="animate-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <History size={20} className="text-[var(--text-muted)]" /> Simulation History
                        </h2>
                        {compareSelection.length > 0 && (
                            <div className="flex items-center gap-3 bg-[var(--background-secondary)] px-4 py-2 rounded-xl border border-[var(--background-modifier-border)]">
                                <span className="text-xs font-bold">{compareSelection.length} selected</span>
                                {compareSelection.length === 2 && view !== 'comparison' && (
                                    <button onClick={() => setView('comparison')} className="text-xs bg-violet-500 text-white px-3 py-1 rounded-lg font-bold">
                                        Compare IDs
                                    </button>
                                )}
                                <button onClick={() => setCompareSelection([])} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-normal)]">Clear</button>
                            </div>
                        )}
                    </div>

                    {view === 'comparison' && compareSelection.length === 2 ? (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {compareSelection.map(id => {
                                const s = state.scenarios?.find(sc => sc.id === id);
                                if (!s) return null;
                                const res = calculate(s.type, s.variables, s.timeHorizon);
                                return (
                                    <div key={id} className="bg-[var(--background-secondary)] p-6 rounded-2xl border border-violet-500/50">
                                        <div className="font-bold text-xl mb-4 text-center">{s.name}</div>
                                        <div className="space-y-2 text-center">
                                            <div className="text-3xl font-black">{format(res.profit)}</div>
                                            <div className={`font-bold ${res.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>ROI: {res.roi.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <button onClick={() => { setView('history'); setCompareSelection([]); }} className="col-span-2 text-center text-xs text-[var(--text-muted)] mt-4 hover:underline">
                                Exit Comparison
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(state.scenarios || []).length === 0 && (
                                <div className="col-span-full text-center py-12 text-[var(--text-muted)] opacity-50">
                                    <Save size={48} className="mx-auto mb-4" strokeWidth={1} />
                                    <p>No saved simulations yet.</p>
                                </div>
                            )}

                            {[...(state.scenarios || [])].reverse().map(scen => (
                                <div
                                    key={scen.id}
                                    onClick={() => toggleCompare(scen.id)}
                                    className={`p-6 rounded-2xl border relative group cursor-pointer transition-all ${compareSelection.includes(scen.id) ? 'bg-violet-500/10 border-violet-500' : 'bg-[var(--background-secondary)] border-[var(--background-modifier-border)] hover:border-[var(--text-muted)]'}`}
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLoad(scen); }}
                                            className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                                            title="Load"
                                        >
                                            <Play size={14} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(scen.id); }}
                                            className="p-2 bg-[var(--background-modifier-error)] text-white rounded-lg hover:opacity-80 transition-opacity"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-lg ${compareSelection.includes(scen.id) ? 'bg-violet-500 text-white' : 'bg-[var(--background-primary)]'}`}>
                                            {TEMPLATES[scen.type]?.icon || <Calculator size={16} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg leading-tight">{scen.name}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mt-1">
                                                {TEMPLATES[scen.type]?.title} • {new Date(scen.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Select Indicator */}
                                    <div className={`absolute top-4 left-4 w-4 h-4 rounded-full border-2 ${compareSelection.includes(scen.id) ? 'bg-violet-500 border-violet-500' : 'border-[var(--text-muted)] opacity-30'}`} />

                                    {/* Mini Result Preview */}
                                    <div className="mt-4 pt-4 border-t border-[var(--background-modifier-border)] grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-[8px] uppercase text-[var(--text-muted)] font-bold">Time</div>
                                            <div className="font-mono font-bold text-xs">{scen.timeHorizon} {TEMPLATES[scen.type]?.unit}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] uppercase text-[var(--text-muted)] font-bold">Vars</div>
                                            <div className="font-mono font-bold text-xs opacity-70">
                                                {Object.keys(scen.variables).length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] uppercase text-[var(--text-muted)] font-bold">Type</div>
                                            <div className="font-mono font-bold text-xs text-violet-400 capitalize">{scen.type}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
