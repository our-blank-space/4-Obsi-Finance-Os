import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTranslation } from '../hooks/useTranslation';
import { Product, Sale, SaleItem, Project, ProjectExpense } from '../types';
import { ShoppingCart, Package, TrendingUp, Plus, Trash2, Save, ShoppingBag, DollarSign, Users, ChevronRight, Minus, RotateCcw, AlertCircle, Folder, Briefcase, FilePlus, CheckCircle2 } from 'lucide-react';
import { Input } from './ui/Input';
import { NumericInput } from './ui/NumericInput';

export const BusinessManager: React.FC = () => {
    const { state, dispatch, saveDataNow } = useFinance();
    const { t } = useTranslation();
    const { business, baseCurrency } = state;

    // Default to 'pos' view
    const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'projects' | 'stats'>('pos');

    // --- INVENTORY STATE ---
    const [newProduct, setNewProduct] = useState<Partial<Product>>({ type: 'physical', unitCost: 0, unitPrice: 0, stock: 0, projectId: '' });
    const [isAddingProduct, setIsAddingProduct] = useState(false);

    // --- POS STATE ---
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [checkoutStatus, setCheckoutStatus] = useState<'paid' | 'pending'>('paid');
    const [checkoutClient, setCheckoutClient] = useState('');
    const [tempWeight, setTempWeight] = useState<{ [key: string]: string }>({});

    // --- PROJECTS STATE ---
    const [newProject, setNewProject] = useState<Partial<Project>>({ name: '', status: 'active', notes: '' });
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [expenseDraft, setExpenseDraft] = useState<{ projectId: string, amount: string, desc: string }>({ projectId: '', amount: '', desc: '' });

    // --- HANDLERS ---

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.unitPrice) return;

        const product: Product = {
            id: crypto.randomUUID(),
            name: newProduct.name,
            type: newProduct.type as any || 'physical',
            unitCost: Number(newProduct.unitCost) || 0,
            unitPrice: Number(newProduct.unitPrice) || 0,
            stock: Number(newProduct.stock) || 0,
            category: newProduct.category || 'General',
            projectId: newProduct.projectId || undefined
        };

        const updatedProducts = [...state.business.products, product];

        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                products: updatedProducts
            }
        });

        setNewProduct({ type: 'physical', unitCost: 0, unitPrice: 0, stock: 0, projectId: '' });
        setIsAddingProduct(false);
        saveDataNow();
    };

    const addToCart = (productId: string) => {
        const prod = business.products.find(p => p.id === productId);
        if (!prod) return;

        const existingItemIndex = cart.findIndex(c => c.productId === productId);
        if (existingItemIndex >= 0) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            newCart[existingItemIndex].total = newCart[existingItemIndex].quantity * newCart[existingItemIndex].unitPrice;
            setCart(newCart);
        } else {
            const newItem: SaleItem = {
                productId: prod.id,
                productName: prod.name,
                quantity: 1,
                unitPrice: prod.unitPrice,
                total: prod.unitPrice,
                cost: prod.unitCost
            };
            setCart([...cart, newItem]);
        }
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;

        const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
        const totalCost = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

        const newSale: Sale = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            clientName: checkoutClient || undefined,
            items: cart,
            totalAmount,
            totalCost,
            netProfit: totalAmount - totalCost,
            status: 'completed',
            paymentStatus: checkoutStatus,
            paymentMethod: checkoutStatus === 'paid' ? 'cash' : undefined
        };

        // Update Stock Logic (only physical items)
        const updatedProducts = state.business.products.map(p => {
            const soldItem = cart.find(c => c.productId === p.id);
            if (soldItem && p.type === 'physical') {
                return { ...p, stock: p.stock - soldItem.quantity };
            }
            return p;
        });

        const updatedSales = [newSale, ...state.business.sales];

        dispatch({
            type: 'UPDATE_BUSINESS_DATA',
            payload: {
                sales: updatedSales,
                products: updatedProducts
            }
        });

        setCart([]);
        setCheckoutClient('');
        setTempWeight({});
        saveDataNow();
    };

    const handleCreateProject = () => {
        if (!newProject.name) return;
        const p: Project = {
            id: crypto.randomUUID(),
            name: newProject.name,
            status: 'active',
            startDate: new Date().toISOString(),
            expenses: [],
            notes: newProject.notes
        };
        dispatch({ type: 'UPDATE_BUSINESS_DATA', payload: { projects: [...(state.business.projects || []), p] } });
        setNewProject({ name: '', notes: '', status: 'active' });
        setIsAddingProject(false);
        saveDataNow();
    };

    const handleAddExpenseToProject = (projectId: string) => {
        if (!expenseDraft.amount || expenseDraft.projectId !== projectId) return;

        const expense: ProjectExpense = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            description: expenseDraft.desc || 'Gasto Operativo',
            amount: parseFloat(expenseDraft.amount)
        };

        const updatedProjects = state.business.projects.map(p => {
            if (p.id === projectId) {
                return { ...p, expenses: [...p.expenses, expense] };
            }
            return p;
        });

        dispatch({ type: 'UPDATE_BUSINESS_DATA', payload: { projects: updatedProjects } });
        setExpenseDraft({ projectId: '', amount: '', desc: '' });
        saveDataNow();
    };

    // --- CALCULATIONS ---
    const totalSales = business.sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = business.sales.reduce((sum, s) => sum + s.netProfit, 0);
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    const format = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: baseCurrency }).format(v);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-6xl mx-auto h-full flex flex-col">

            {/* HEADER */}
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-black italic flex items-center gap-3 text-[var(--text-normal)]">
                        <ShoppingBag className="text-emerald-500" /> {t('nav.business')}
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">{t('business.subtitle') || 'Mini-ERP System'}</p>
                </div>

                <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl border border-[var(--background-modifier-border)]">
                    <TabButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} icon={<ShoppingCart size={16} />} label={t('business.pos')} />
                    <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={16} />} label={t('business.inventory')} />
                    <TabButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={16} />} label="Proyectos" />
                    <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<TrendingUp size={16} />} label={t('business.stats')} />
                </div>
            </header>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-hidden flex flex-col">

                {/* --- POS VIEW --- */}
                {activeTab === 'pos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                        {/* Product Selection */}
                        <div className="lg:col-span-2 bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl p-6 overflow-y-auto custom-scrollbar">
                            <h3 className="text-xs font-black uppercase text-[var(--text-muted)] mb-4">{t('business.select_product')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {business.products.map(prod => (
                                    <button
                                        key={prod.id}
                                        onClick={() => addToCart(prod.id)}
                                        className="p-4 rounded-xl border text-left transition-all bg-[var(--background-primary)] border-[var(--background-modifier-border)] hover:border-emerald-500 hover:bg-emerald-500/5 group"
                                    >
                                        <div className="font-bold truncate group-hover:text-emerald-500 transition-colors">{prod.name}</div>
                                        <div className="text-xs opacity-70 flex justify-between mt-1">
                                            <span>{format(prod.unitPrice)}</span>
                                            {prod.stock > 0 ? (
                                                <span className="text-[10px] bg-[var(--background-secondary)] px-1.5 py-0.5 rounded font-bold border border-[var(--background-modifier-border)] shadow-sm">{prod.stock}</span>
                                            ) : (
                                                <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-1.5 py-0.5 rounded">0</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                                {business.products.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-[var(--text-muted)]">
                                        <Package size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">{t('business.no_products')}</p>
                                        <button onClick={() => setActiveTab('inventory')} className="mt-2 text-emerald-500 text-xs font-bold underline">
                                            {t('business.add_first_product')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart & Checkout */}
                        <div className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-2xl p-6 flex flex-col shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                                    <ShoppingCart size={14} /> {t('business.cart')}
                                </h3>
                                {cart.length > 0 && (
                                    <button onClick={() => setCart([])} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-500/20" title="Vaciar Carrito">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-[var(--background-secondary)] rounded-lg text-sm group">
                                        <div className="flex-1 truncate pr-2">
                                            <div className="font-bold truncate text-[var(--text-normal)]">{item.productName}</div>
                                            <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                                {format(item.unitPrice)} <span className="opacity-50">/u</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-[var(--background-primary)] rounded-md border border-[var(--background-modifier-border)] p-0.5">
                                                <button onClick={() => {
                                                    const newCart = [...cart];
                                                    if (newCart[idx].quantity > 1) {
                                                        newCart[idx].quantity -= 1;
                                                        newCart[idx].total = newCart[idx].quantity * newCart[idx].unitPrice;
                                                        setCart(newCart);
                                                    } else {
                                                        removeFromCart(idx);
                                                    }
                                                }} className="p-1 text-[var(--text-muted)] hover:text-emerald-500 transition-colors bg-[var(--background-secondary)] rounded"><Minus size={12} strokeWidth={3} /></button>
                                                <span className="px-3 font-bold text-xs">{item.quantity}</span>
                                                <button onClick={() => {
                                                    const newCart = [...cart];
                                                    newCart[idx].quantity += 1;
                                                    newCart[idx].total = newCart[idx].quantity * newCart[idx].unitPrice;
                                                    setCart(newCart);
                                                }} className="p-1 text-[var(--text-muted)] hover:text-emerald-500 transition-colors bg-[var(--background-secondary)] rounded"><Plus size={12} strokeWidth={3} /></button>
                                            </div>
                                            <span className="font-mono font-bold w-16 text-right text-emerald-400">{format(item.total)}</span>
                                            <button onClick={() => removeFromCart(idx)} className="text-[var(--text-muted)] hover:text-rose-400 transition-colors p-1" title="Remover">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-40">
                                        <ShoppingCart size={48} strokeWidth={1} />
                                        <p className="text-xs mt-2">Vacío</p>
                                    </div>
                                )}
                            </div>

                            {/* Checkout Tools */}
                            <div className="border-t border-[var(--background-modifier-border)] pt-4 space-y-3 mt-4">
                                <Input
                                    label="Cliente / Comprador"
                                    value={checkoutClient}
                                    onChange={e => setCheckoutClient(e.target.value)}
                                    placeholder="Opcional"
                                />

                                <div className="flex bg-[var(--background-secondary)] rounded-lg p-1 border border-[var(--background-modifier-border)]">
                                    <button
                                        onClick={() => setCheckoutStatus('paid')}
                                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${checkoutStatus === 'paid' ? 'bg-emerald-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
                                    >Pagado</button>
                                    <button
                                        onClick={() => setCheckoutStatus('pending')}
                                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${checkoutStatus === 'pending' ? 'bg-amber-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'}`}
                                    >Por Cobrar</button>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-between items-center text-xl font-black mt-2">
                                    <span>Total</span>
                                    <span className="font-mono text-emerald-400">
                                        {format(cart.reduce((s, i) => s + i.total, 0))}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg disabled:opacity-50 disabled:shadow-none ${checkoutStatus === 'pending' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}
                                >
                                    {t('business.checkout')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- INVENTORY VIEW --- */}
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        {/* Product Statistics */}
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                            <div className="bg-[var(--background-secondary)] p-4 rounded-xl border border-[var(--background-modifier-border)]">
                                <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold">Total Products</div>
                                <div className="text-2xl font-black">{business.products.length}</div>
                            </div>
                            <div className="bg-[var(--background-secondary)] p-4 rounded-xl border border-[var(--background-modifier-border)]">
                                <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold">Total Value</div>
                                <div className="text-2xl font-black font-mono text-emerald-400">
                                    {format(business.products.reduce((s, p) => s + (p.stock * p.unitCost), 0))}
                                </div>
                            </div>
                        </div>

                        {/* Add Product Form */}
                        <div className="bg-[var(--background-secondary)] p-6 rounded-2xl border border-[var(--background-modifier-border)] h-fit">
                            <h3 className="font-black text-sm uppercase text-[var(--text-muted)] mb-4 flex items-center gap-2">
                                <Plus size={14} /> {t('business.new_product')}
                            </h3>
                            <div className="space-y-4">
                                <Input
                                    label={t('business.product_name') || "Nombre del Producto"}
                                    value={newProduct.name || ''}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Tipo</label>
                                        <select
                                            className="w-full bg-[var(--background-primary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                                            value={newProduct.type}
                                            onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value as any })}
                                        >
                                            <option value="physical">Físico (Stock)</option>
                                            <option value="digital">Digital</option>
                                            <option value="service">Servicio</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Proyecto</label>
                                        <select
                                            className="w-full bg-[var(--background-primary)] text-[var(--text-normal)] border border-[var(--background-modifier-border)] rounded-lg p-2.5 text-sm outline-none focus:border-[var(--interactive-accent)] transition-colors"
                                            value={newProduct.projectId || ''}
                                            onChange={(e) => setNewProduct({ ...newProduct, projectId: e.target.value })}
                                        >
                                            <option value="">Ninguno</option>
                                            {business.projects?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <NumericInput
                                        label="Costo"
                                        value={newProduct.unitCost?.toString() || ''}
                                        onValueChange={v => setNewProduct({ ...newProduct, unitCost: parseFloat(v) })}
                                        currency={baseCurrency}
                                    />
                                    <NumericInput
                                        label="Precio Venta"
                                        value={newProduct.unitPrice?.toString() || ''}
                                        onValueChange={v => setNewProduct({ ...newProduct, unitPrice: parseFloat(v) })}
                                        currency={baseCurrency}
                                    />
                                </div>
                                <div>
                                    <NumericInput
                                        label="Stock Inicial"
                                        value={newProduct.stock?.toString() || ''}
                                        onValueChange={v => setNewProduct({ ...newProduct, stock: parseFloat(v) })}
                                    />
                                </div>
                                <button
                                    onClick={handleAddProduct}
                                    disabled={!newProduct.name || !newProduct.unitPrice}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black tracking-widest transition-all uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-emerald-500/20"
                                >
                                    {t('btn.save')}
                                </button>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="lg:col-span-2 bg-[var(--background-secondary)]/30 border border-[var(--background-modifier-border)] rounded-2xl p-4 overflow-y-auto custom-scrollbar flex flex-col">
                            <h3 className="font-black text-sm uppercase text-[var(--text-muted)] mb-4">Inventario Actual</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                {business.products.map(prod => (
                                    <div key={prod.id} className="p-4 bg-[var(--background-primary)] rounded-xl border border-[var(--background-modifier-border)] hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="font-bold text-sm mb-1 text-[var(--text-normal)]">{prod.name}</div>
                                                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--background-secondary)] inline-block px-1.5 py-0.5 rounded border border-[var(--background-modifier-border)]">
                                                    Margen: {((prod.unitPrice - prod.unitCost) / prod.unitPrice * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className={`text-xs font-black px-2.5 py-1 rounded border shadow-sm flex items-center gap-1 ${prod.stock <= 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                {prod.stock <= 0 && <AlertCircle size={10} />}
                                                {prod.stock} u.
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-auto bg-[var(--background-secondary)]/50 p-2 rounded-lg border border-[var(--background-modifier-border)]">
                                            <div>
                                                <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">Costo</span>
                                                <span className="font-mono text-xs opacity-70">{format(prod.unitCost)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-[var(--text-muted)] uppercase block font-bold">Venta</span>
                                                <span className="font-mono text-xs font-bold text-emerald-500">{format(prod.unitPrice)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {business.products.length === 0 && (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--text-muted)] border-2 border-dashed border-[var(--background-modifier-border)] rounded-xl opacity-50">
                                        <Package size={48} className="mb-2" strokeWidth={1} />
                                        <p className="text-sm font-bold">Inventario Vacío</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PROJECTS VIEW --- */}
                {activeTab === 'projects' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                        <div className="lg:col-span-1 bg-[var(--background-secondary)] p-6 rounded-2xl border border-[var(--background-modifier-border)] h-fit">
                            <h3 className="font-black text-sm uppercase text-[var(--text-muted)] mb-4 flex items-center gap-2">
                                <Folder size={14} /> Nuevo Proyecto / Tanda
                            </h3>
                            <div className="space-y-4">
                                <Input label="Abreviatura o Nombre" value={newProject.name || ''} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="Ej: Pollos Engorde #3" />
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProject.name}
                                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-black tracking-widest transition-all uppercase text-xs disabled:opacity-50 mt-2 shadow-lg shadow-indigo-500/20"
                                >
                                    Abrir Proyecto
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-4 overflow-y-auto custom-scrollbar">
                            {(business.projects || []).map(proj => {
                                const projSales = business.sales.filter(s => s.items.some(i => business.products.find(p => p.id === i.productId)?.projectId === proj.id));
                                const totalRevenue = projSales.reduce((sum, s) => sum + s.totalAmount, 0);
                                const totalExpenses = proj.expenses.reduce((sum, e) => sum + e.amount, 0);
                                const projROI = totalRevenue - totalExpenses;

                                return (
                                    <div key={proj.id} className="bg-[var(--background-primary)] border border-[var(--background-modifier-border)] rounded-2xl p-6 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-[var(--text-normal)]">{proj.name}</h3>
                                                <span className="text-[10px] font-mono text-[var(--text-muted)]">Iniciado: {new Date(proj.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs uppercase font-bold text-[var(--text-muted)] mb-1">Rentabilidad</div>
                                                <div className={`font-mono font-black text-lg ${projROI >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{format(projROI)}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-xs mb-4 p-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--background-modifier-border)]">
                                            <span className="text-[var(--text-muted)]">Ventas Asociadas: <b className="text-[var(--text-normal)]">{format(totalRevenue)}</b> ({projSales.length})</span>
                                            <span className="text-[var(--text-muted)]">Gatos Operativos: <b className="text-[var(--text-normal)]">{format(totalExpenses)}</b></span>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Añadir Gasto Operativo (Cuido, Vacunas, Server)</p>
                                            <div className="flex gap-2">
                                                <div className="flex-1"><Input label="Concepto (Ej. Bulto Levante)" value={expenseDraft.projectId === proj.id ? expenseDraft.desc : ''} onChange={e => setExpenseDraft({ projectId: proj.id, desc: e.target.value, amount: expenseDraft.amount })} /></div>
                                                <div className="w-1/3"><NumericInput label="Monto" value={expenseDraft.projectId === proj.id ? expenseDraft.amount : ''} onValueChange={v => setExpenseDraft({ projectId: proj.id, amount: v, desc: expenseDraft.desc })} currency={baseCurrency} /></div>
                                                <button onClick={() => handleAddExpenseToProject(proj.id)} className="bg-[var(--background-modifier-border)] hover:bg-[var(--interactive-accent)] hover:text-white px-4 rounded-lg transition-colors font-bold text-xs"><FilePlus size={16} /></button>
                                            </div>

                                            {proj.expenses.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-[var(--background-modifier-border)]">
                                                    {proj.expenses.map(exp => (
                                                        <div key={exp.id} className="flex justify-between py-1 text-xs">
                                                            <span className="text-[var(--text-muted)]">{exp.description}</span>
                                                            <span className="font-mono text-rose-400 font-bold">-{format(exp.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {(!business.projects || business.projects.length === 0) && (
                                <div className="text-center py-20 opacity-50 text-[var(--text-muted)] border-2 border-dashed border-[var(--background-modifier-border)] rounded-2xl">
                                    <Folder size={48} className="mx-auto mb-4" strokeWidth={1} />
                                    <p className="font-bold">No hay proyectos activos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- STATS VIEW --- */}
                {activeTab === 'stats' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
                                <div className="text-xs font-bold uppercase text-indigo-400 mb-2 flex items-center gap-2"><DollarSign size={14} /> Total Revenue</div>
                                <div className="text-4xl font-black text-[var(--text-normal)] tracking-tight">{format(totalSales)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
                                <div className="text-xs font-bold uppercase text-emerald-400 mb-2 flex items-center gap-2"><TrendingUp size={14} /> Net Profit</div>
                                <div className="text-4xl font-black text-emerald-400 tracking-tight">{format(totalProfit)}</div>
                                <div className="text-xs font-bold text-emerald-300 mt-2 opacity-70">Margin: {profitMargin.toFixed(1)}%</div>
                            </div>
                            <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl p-6">
                                <div className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2 flex items-center gap-2"><Users size={14} /> Operations</div>
                                <div className="text-4xl font-black text-[var(--text-normal)] tracking-tight">{business.sales.length}</div>
                                <div className="text-xs font-bold text-[var(--text-muted)] mt-2 opacity-70">Sales Recorded</div>
                            </div>
                        </div>

                        {/* Accounts Receivable (CxC) */}
                        {business.sales.some(s => s.paymentStatus === 'pending') && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                                <h3 className="font-bold text-sm uppercase text-amber-500 mb-4 flex items-center gap-2">Cuentas por Cobrar (Fiado)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {business.sales.filter(s => s.paymentStatus === 'pending').map(sale => (
                                        <div key={sale.id} className="bg-[var(--background-primary)] border border-amber-500/30 p-4 rounded-xl flex justify-between items-center group shadow-sm">
                                            <div>
                                                <div className="font-bold text-[var(--text-normal)]">{sale.clientName || 'Cliente Anónimo'}</div>
                                                <div className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(sale.date).toLocaleDateString()} • {sale.items.length} ítems</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="font-mono font-black text-amber-500 text-lg">{format(sale.totalAmount)}</div>
                                                <button
                                                    onClick={() => {
                                                        const updatedSales = state.business.sales.map(s => s.id === sale.id ? { ...s, paymentStatus: 'paid' as any, paymentMethod: 'cash' as any } : s);
                                                        dispatch({ type: 'UPDATE_BUSINESS_DATA', payload: { sales: updatedSales } });
                                                        saveDataNow();
                                                    }}
                                                    className="p-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors border border-amber-500/20 shadow-sm"
                                                    title="Marcar como Pagado"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Sales Table */}
                        <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-[var(--background-modifier-border)]">
                                <h3 className="font-bold text-sm uppercase">Recent Transactions</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-[var(--text-muted)] uppercase bg-[var(--background-primary)]">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Cliente</th>
                                            <th className="px-6 py-3">Items</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                            <th className="px-6 py-3 text-right">Profit</th>
                                            <th className="px-2 py-3 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--background-modifier-border)]">
                                        {business.sales.slice(0, 10).map((sale) => (
                                            <tr key={sale.id} className="hover:bg-[var(--background-primary)] transition-colors group">
                                                <td className="px-6 py-4 font-mono text-xs">{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-6 py-4 font-bold text-xs">
                                                    {sale.clientName || '-'}
                                                    {sale.paymentStatus === 'pending' && <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-amber-500/30">Deuda</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold">{sale.items.length} items</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]" title={sale.items.map(i => i.productName).join(', ')}>
                                                        {sale.items.map(i => i.productName).join(', ')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-[var(--text-normal)]">{format(sale.totalAmount)}</td>
                                                <td className="px-6 py-4 text-right font-mono text-emerald-500 font-bold">{format(sale.netProfit)}</td>
                                                <td className="px-2 py-4">
                                                    <button
                                                        onClick={() => {
                                                            // Revertir Venta (Devolver Stock y Botar Venta)
                                                            const reverseProducts = state.business.products.map(p => {
                                                                const soldItem = sale.items.find(c => c.productId === p.id);
                                                                if (soldItem) return { ...p, stock: p.stock + soldItem.quantity };
                                                                return p;
                                                            });
                                                            const newSalesList = state.business.sales.filter(s => s.id !== sale.id);
                                                            dispatch({ type: 'UPDATE_BUSINESS_DATA', payload: { sales: newSalesList, products: reverseProducts } });
                                                        }}
                                                        className="text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--background-secondary)] rounded shadow border border-[var(--background-modifier-border)] hover:border-rose-500/20"
                                                        title="Cancelar Venta y Retornar Stock"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Subcomponent for Tabs
const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${active
            ? 'bg-[var(--background-primary)] text-[var(--text-normal)] shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text-normal)]'
            }`}
    >
        {icon}
        {label}
    </button>
);
