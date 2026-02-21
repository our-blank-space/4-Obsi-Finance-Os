
export interface ProjectExpense {
    id: string;
    date: string;
    description: string;
    amount: number;
    category?: string;
}

export interface Project {
    id: string;
    name: string;
    status: 'active' | 'completed';
    startDate: string;
    endDate?: string;
    expenses: ProjectExpense[];
    budget?: number;
    notes?: string;
}

export interface Product {
    id: string;
    name: string;
    type: 'physical' | 'digital' | 'service';
    unitCost: number;
    unitPrice: number;
    stock: number;
    category?: string;
    description?: string;
    projectId?: string;
}

export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    weight?: number;
    unitPrice: number;
    total: number;
    cost: number;
}

export interface Client {
    id: string;
    name: string;
    phone?: string;
    notes?: string;
}

export interface Sale {
    id: string;
    date: string;
    clientId?: string;
    clientName?: string;
    items: SaleItem[];
    totalAmount: number;
    totalCost: number;
    netProfit: number;
    status: 'completed' | 'pending' | 'canceled';
    paymentStatus?: 'paid' | 'pending';
    paymentMethod?: 'cash' | 'transfer' | 'crypto' | 'credit';
    note?: string;
}

export interface BusinessData {
    projects: Project[];
    products: Product[];
    sales: Sale[];
    clients: Client[];
}

// --- QUOTATION (Moved from legacy_domain) ---
export enum QuoteComplexity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum QuoteValue {
    NORMAL = 'normal',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface QuoteResult {
    base: number;
    complexityAdj: number;
    riskAdj: number;
    valueAdj: number;
    total: number;
    hourlyEffective: number;
}
