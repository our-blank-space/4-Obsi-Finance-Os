
import React, { useState } from 'react';
import {
  Transaction, TransactionType, WeeklySnapshot,
  Asset, Trade, Loan, Debt,
  Budget, Currency, TradeSide, TradeStatus, InterestType, TradeOutcome, TradingAccountType,
  RecurrentTransaction, TransactionSentiment
} from '../types';
import { Sparkles, Loader2, RefreshCw, AlertTriangle, User } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface DemoSimulatorProps {
  onLoadData: (data: any) => void;
}

const DemoSimulator: React.FC<DemoSimulatorProps> = ({ onLoadData }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const generateId = () => crypto.randomUUID();

  // --- ESCENARIO: PROFESIONAL JOVEN EN COLOMBIA ---
  // Salario: 4.5M COP
  // Arriendo: 1.6M COP
  // Deuda: Tarjeta Crédito (iPhone) + Crédito Estudio
  // Ahorro: CDT
  const generateScenario = () => {
    setLoading(true);

    try {
      setTimeout(() => {
        const now = new Date();
        const transactions: Transaction[] = [];
        const DAYS_TO_SIMULATE = 180; // 6 meses exactos

        const areas = ['Salario', 'Vivienda', 'Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salud', 'Deuda', 'Inversión', 'Otros'];
        const accounts = ['Bancolombia', 'Nequi', 'Efectivo', 'Tarjeta Crédito'];

        // --- 1. ESTRUCTURAS BASE ---

        // DEUDAS (Para probar módulo de Deudas + Bola de Nieve)
        const debts: Debt[] = [
          {
            id: generateId(),
            lenderName: 'Visa Signature',
            principal: 5000000,
            currency: 'COP',
            annualInterestRate: 2.1, // Mensual
            interestType: InterestType.COMPOUND,
            paymentFrequency: 'monthly',
            startDate: now.toISOString().split('T')[0],
            endDate: null,
            hasDeadline: false,
            durationMonths: 12,
            paid: 1800000,
            payments: [],
            status: 'active',
            description: 'Compra iPhone 14 y viajes'
          },
          {
            id: generateId(),
            lenderName: 'Crédito ICETEX',
            principal: 15000000,
            currency: 'COP',
            annualInterestRate: 0.9,
            interestType: InterestType.SIMPLE,
            paymentFrequency: 'monthly',
            startDate: '2022-01-01',
            endDate: null,
            hasDeadline: false,
            durationMonths: 60,
            paid: 3000000,
            payments: [],
            status: 'active',
            description: 'Especialización'
          }
        ];

        // ACTIVOS (Para probar módulo Activos con funciones avanzadas)
        const assets: Asset[] = [
          {
            id: generateId(), name: 'Apartamento Chapinero', category: 'Real Estate', type: 'real_estate', currency: 'COP', status: 'active',
            isIncomeGenerating: true, isDepreciating: false,
            purchaseDate: '2021-03-01', purchasePrice: 280000000, currentValue: 320000000,
            transactions: [
              { id: generateId(), assetId: 'real_estate_1', date: '2021-03-01', description: 'Compra Inmueble', amount: 280000000, currency: 'COP', type: 'cost', isRecurrent: false, category: 'inversión' },
              { id: generateId(), assetId: 'real_estate_1', date: '2021-03-01', description: 'Escrituración', amount: 8000000, currency: 'COP', type: 'cost', isRecurrent: false, category: 'legal' },
              { id: generateId(), assetId: 'real_estate_1', date: '2023-09-15', description: 'Remodelación', amount: 15000000, currency: 'COP', type: 'improvement', isRecurrent: false, category: 'mejora' }
            ],
            notes: '[[Contrato Arrendamiento]] - 2 habitaciones, excelente zona',
            documents: ['[[Escritura Pública]]', '[[Contrato Arrendamiento 2024]]'],
            score: 8
          },
          {
            id: generateId(), name: 'Acciones Tesla (TSLA)', category: 'Stock Market', type: 'stock_market', currency: 'USD', status: 'active',
            isIncomeGenerating: true, isDepreciating: false,
            purchaseDate: '2022-11-10', purchasePrice: 2625, currentValue: 4125,
            transactions: [
              { id: generateId(), assetId: 'stock_1', date: '2022-11-10', description: '10 acciones @ $180', amount: 1800, currency: 'USD', type: 'cost', isRecurrent: false, category: 'tech' },
              { id: generateId(), assetId: 'stock_1', date: '2023-04-20', description: '5 acciones @ $165', amount: 825, currency: 'USD', type: 'cost', isRecurrent: false, category: 'tech' }
            ],
            notes: '15 acciones - Portfolio diversificado tech',
            score: 7
          },
          {
            id: generateId(), name: 'Bitcoin HODLing', category: 'Crypto', type: 'crypto', currency: 'USD', status: 'active',
            isIncomeGenerating: false, isDepreciating: false,
            purchaseDate: '2020-08-15', purchasePrice: 10850, currentValue: 33600,
            transactions: [
              { id: generateId(), assetId: 'crypto_1', date: '2020-08-15', description: '0.5 BTC @ $11,500', amount: 5750, currency: 'USD', type: 'cost', isRecurrent: false, category: 'crypto' },
              { id: generateId(), assetId: 'crypto_1', date: '2022-12-01', description: '0.3 BTC @ $17,000', amount: 5100, currency: 'USD', type: 'cost', isRecurrent: false, category: 'crypto' }
            ],
            notes: '0.8 BTC - Long term hold',
            score: 6
          },
          {
            id: generateId(), name: 'CDT Bancolombia 180d', category: 'Fixed Income', type: 'tech', currency: 'COP', status: 'active',
            isIncomeGenerating: true, isDepreciating: false,
            purchaseDate: '2024-11-15', purchasePrice: 10000000, currentValue: 10350000,
            transactions: [
              { id: generateId(), assetId: 'cdt_1', date: '2024-11-15', description: 'Apertura CDT EA 13.5%', amount: 10000000, currency: 'COP', type: 'cost', isRecurrent: false, category: 'ahorro' }
            ],
            notes: 'Fondo de emergencia - Vence en marzo',
            score: 9
          },
          {
            id: generateId(), name: 'Moto Yamaha NMax', category: 'Vehicle', type: 'livestock', currency: 'COP', status: 'active',
            isIncomeGenerating: false, isDepreciating: true,
            purchaseDate: '2023-01-15', purchasePrice: 14250000, currentValue: 12500000,
            transactions: [
              { id: generateId(), assetId: 'moto_1', date: '2023-01-15', description: 'Compra Moto', amount: 14000000, currency: 'COP', type: 'cost', isRecurrent: false, category: 'transporte' },
              { id: generateId(), assetId: 'moto_1', date: '2023-06-15', description: 'Mantenimiento 5k', amount: 250000, currency: 'COP', type: 'maintenance', isRecurrent: false, category: 'mantenimiento' }
            ],
            notes: 'Vehículos principal - Depreciación lineal',
            score: 5
          },
          {
            id: generateId(), name: 'Startup SaaS Colombia', category: 'Private Equity', type: 'private_equity', currency: 'USD', status: 'idea',
            isIncomeGenerating: false, isDepreciating: false,
            purchaseDate: '2024-01-01', purchasePrice: 0, currentValue: 0,
            transactions: [
              { id: generateId(), assetId: 'startup_1', date: '2024-01-01', description: 'Diligencia Inicial', amount: 0, currency: 'USD', type: 'cost', isRecurrent: false, category: 'análisis' }
            ],
            notes: '[[Pitch Deck]] - Opportunidad de inversión angel $50k por 10% equity',
            score: 0
          }
        ];

        // TRADING JOURNAL (Para probar módulo Trading completo)
        const trades: Trade[] = [
          // Trades cerrados - Mix de wins y losses
          {
            id: generateId(), symbol: 'BTC/USDT', market: 'Binance', side: TradeSide.BUY, status: TradeStatus.CLOSED,
            date: '2024-01-15', exitDate: '2024-01-22', entryPrice: 42500, exitPrice: 46800, currentPrice: null,
            amount: 21250, fee: 100, pnl: 2150, pnlPercentage: 10.1,
            accountType: TradingAccountType.TRADING, currency: 'USD',
            stopLoss: 40000, outcome: TradeOutcome.WIN, strategy: 'Trend Following',
            notes: 'Strong breakout above resistance', chartLink: 'https://tradingview.com/chart/demo1'
          },
          {
            id: generateId(), symbol: 'ETH/USDT', market: 'Binance', side: TradeSide.SELL, status: TradeStatus.CLOSED,
            date: '2024-01-20', exitDate: '2024-01-21', entryPrice: 2650, exitPrice: 2720, currentPrice: null,
            amount: 13250, fee: 75, pnl: -350, pnlPercentage: -2.64,
            accountType: TradingAccountType.TRADING, currency: 'USD',
            stopLoss: 2700, outcome: TradeOutcome.LOSS, strategy: 'Reversal',
            notes: 'Stopped out - wrong timing', chartLink: 'https://tradingview.com/chart/demo2'
          },
          {
            id: generateId(), symbol: 'SOL/USDT', market: 'Binance', side: TradeSide.BUY, status: TradeStatus.CLOSED,
            date: '2024-02-01', exitDate: '2024-02-10', entryPrice: 98, exitPrice: 115, currentPrice: null,
            amount: 4900, fee: 50, pnl: 850, pnlPercentage: 17.35,
            accountType: TradingAccountType.TRADING, currency: 'USD',
            takeProfit: 120, outcome: TradeOutcome.WIN, strategy: 'Accumulation',
            notes: '17% gain - patience paid off'
          },
          {
            id: generateId(), symbol: 'AAPL', market: 'NYSE', side: TradeSide.BUY, status: TradeStatus.CLOSED,
            date: '2023-11-10', exitDate: '2023-12-15', entryPrice: 178, exitPrice: 195, currentPrice: null,
            amount: 17800, fee: 20, pnl: 1680, pnlPercentage: 9.55,
            accountType: TradingAccountType.INVESTMENT, currency: 'USD',
            stopLoss: 170, takeProfit: 200, outcome: TradeOutcome.WIN, strategy: 'Earnings Play',
            notes: 'Q4 earnings beat expectations'
          },
          // Trades activos
          {
            id: generateId(), symbol: 'NVDA', market: 'NASDAQ', side: TradeSide.BUY, status: TradeStatus.OPEN,
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString().split('T')[0],
            entryPrice: 875, exitPrice: null, currentPrice: 892, amount: 17500, fee: 15, pnl: 340, pnlPercentage: 1.94,
            accountType: TradingAccountType.INVESTMENT, currency: 'USD',
            stopLoss: 850, takeProfit: 950, outcome: TradeOutcome.OPEN, strategy: 'AI Trend',
            notes: 'Riding the AI wave - strong technicals'
          },
          {
            id: generateId(), symbol: 'BTC/USDT', market: 'Binance', side: TradeSide.BUY, status: TradeStatus.OPEN,
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString().split('T')[0],
            entryPrice: 51200, exitPrice: null, currentPrice: 52100, amount: 15360, fee: 80, pnl: 270, pnlPercentage: 1.76,
            accountType: TradingAccountType.TRADING, currency: 'USD',
            stopLoss: 49500, takeProfit: 55000, outcome: TradeOutcome.OPEN, strategy: 'Breakout',
            notes: 'New ATH attempt - 3x leverage'
          }
        ];

        // LOANS (Para probar módulo de Préstamos/Lending)
        const loans: Loan[] = [
          {
            id: generateId(), borrowerName: 'Juan Pérez', principal: 3000000, currency: 'COP',
            annualInterestRate: 1.5, interestType: InterestType.SIMPLE, paymentFrequency: 'monthly',
            startDate: '2023-06-01', endDate: '2024-06-01', hasDeadline: true,
            durationMonths: 12, collected: 1200000, payments: [],
            status: 'active', description: 'Préstamo personal - amortización mensual'
          },
          {
            id: generateId(), borrowerName: 'María González', principal: 8000000, currency: 'COP',
            annualInterestRate: 2.0, interestType: InterestType.COMPOUND, paymentFrequency: 'monthly',
            startDate: '2023-09-15', endDate: null, hasDeadline: false,
            durationMonths: 24, collected: 500000, payments: [],
            status: 'active', description: 'Capital de trabajo negocio familiar'
          },
          {
            id: generateId(), borrowerName: 'Carlos Rodríguez', principal: 5000000, currency: 'COP',
            annualInterestRate: 1.8, interestType: InterestType.SIMPLE, paymentFrequency: 'monthly',
            startDate: '2022-03-01', endDate: '2023-03-01', hasDeadline: true,
            durationMonths: 12, collected: 5900000, payments: [],
            status: 'completed', description: 'Préstamo vivienda - Liquidado'
          }
        ];

        // RECURRENTES (Para probar módulo Recurrentes)
        const recurrents: RecurrentTransaction[] = [
          { id: generateId(), name: 'Spotify Premium', amount: 16900, type: TransactionType.EXPENSE, frequency: 'monthly', nextDate: now.toISOString().split('T')[0], currency: 'COP', account: 'Nequi', area: 'Entretenimiento', isVariable: false, isActive: true },
          { id: generateId(), name: 'Internet + Celular', amount: 120000, type: TransactionType.EXPENSE, frequency: 'monthly', nextDate: now.toISOString().split('T')[0], currency: 'COP', account: 'Bancolombia', area: 'Servicios', isVariable: false, isActive: true },
          { id: generateId(), name: 'Suscripción Gym', amount: 89000, type: TransactionType.EXPENSE, frequency: 'monthly', nextDate: now.toISOString().split('T')[0], currency: 'COP', account: 'Tarjeta Crédito', area: 'Salud', isVariable: false, isActive: true },
          { id: generateId(), name: 'Arriendo Apartamento Chapinero', amount: 2500000, type: TransactionType.INCOME, frequency: 'monthly', nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().split('T')[0], currency: 'COP', account: 'Bancolombia', area: 'Inversión', isVariable: false, isActive: true }
        ];

        // PRESUPUESTOS (Para probar módulo Budgets + Gauge)
        const budgets: Budget[] = [
          { id: generateId(), area: 'Alimentación', areaId: 'area-food', type: TransactionType.EXPENSE, amount: 800000, currency: 'COP' },
          { id: generateId(), area: 'Entretenimiento', areaId: 'area-fun', type: TransactionType.EXPENSE, amount: 400000, currency: 'COP' },
          { id: generateId(), area: 'Transporte', areaId: 'area-trans', type: TransactionType.EXPENSE, amount: 300000, currency: 'COP' },
          { id: generateId(), area: 'Salud', areaId: 'area-health', type: TransactionType.EXPENSE, amount: 200000, currency: 'COP' }
        ];

        // --- 2. GENERADOR DE TRANSACCIONES (6 MESES) ---
        let baseBankBalance = 1500000;
        let baseCash = 200000;

        for (let i = DAYS_TO_SIMULATE; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfMonth = date.getDate();
          const dayOfWeek = date.getDay(); // 0-6

          // NOMINA (Quincenal: 15 y 30)
          if (dayOfMonth === 15 || dayOfMonth === 30 || (dayOfMonth === 28 && date.getMonth() === 1)) {
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.INCOME, amount: 2250000,
              areaId: 'area-salary', fromId: 'acc-bancolombia', amountBase: 2250000, exchangeRateSnapshot: 1,
              from: 'Bancolombia', to: 'none', area: 'Salario',
              note: 'Abono Nómina Quincenal', currency: 'COP', tags: ['ingreso_fijo']
            });
            baseBankBalance += 2250000;
          }

          // ARRIENDO (Día 1)
          if (dayOfMonth === 1) {
            const amount = 1600000;
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.EXPENSE, amount,
              areaId: 'area-housing', fromId: 'acc-bancolombia', amountBase: amount, exchangeRateSnapshot: 1,
              from: 'Bancolombia', to: 'none', area: 'Vivienda',
              note: 'Pago Administración + Arriendo', currency: 'COP', tags: ['fijo', 'vivienda']
            });
            baseBankBalance -= amount;
          }

          // PAGO TARJETA (Día 5)
          if (dayOfMonth === 5) {
            const payment = 450000;
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.TRANSFER, amount: payment,
              areaId: 'area-debt', fromId: 'acc-bancolombia', amountBase: payment, exchangeRateSnapshot: 1,
              from: 'Bancolombia', to: 'Tarjeta Crédito', area: 'Deuda',
              note: 'Pago Minimo TC', currency: 'COP', tags: ['deuda']
            });
            baseBankBalance -= payment;
          }

          // GASTOS DIARIOS
          // Corrientazo (Lunes a Viernes)
          if (dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.2) {
            const amount = 18000 + Math.floor(Math.random() * 5000);
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.EXPENSE, amount,
              areaId: 'area-food', fromId: 'acc-cash', amountBase: amount, exchangeRateSnapshot: 1,
              from: Math.random() > 0.6 ? 'Nequi' : 'Efectivo', to: 'none', area: 'Alimentación',
              note: 'Almuerzo Ejecutivo', currency: 'COP', tags: ['comida']
            });
            if (Math.random() > 0.6) baseCash -= amount;
          }

          // Pola/Rumba (Viernes/Sábado)
          if ((dayOfWeek === 5 || dayOfWeek === 6) && Math.random() > 0.4) {
            const amount = 120000 + Math.floor(Math.random() * 150000);
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.EXPENSE, amount,
              areaId: 'area-fun', fromId: 'acc-cc', amountBase: amount, exchangeRateSnapshot: 1,
              from: 'Tarjeta Crédito', to: 'none', area: 'Entretenimiento',
              note: 'Salida con amigos / Cena', currency: 'COP', sentiment: TransactionSentiment.WANT, tags: ['ocio']
            });
          }

          // Transporte (Uber/Transmilenio)
          if (Math.random() > 0.3) {
            const isUber = Math.random() > 0.8;
            const amount = isUber ? 25000 : 6000;
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.EXPENSE, amount,
              areaId: 'area-transport', fromId: 'acc-cash', amountBase: amount, exchangeRateSnapshot: 1,
              from: isUber ? 'Tarjeta Crédito' : 'Efectivo', to: 'none', area: 'Transporte',
              note: isUber ? 'Uber a casa' : 'Recarga TuLlave', currency: 'COP', tags: ['transporte']
            });
            if (!isUber) baseCash -= amount;
          }

          // Retiros Cajero (Semanal)
          if (dayOfWeek === 5 && baseCash < 50000) {
            transactions.push({
              id: generateId(), date: dateStr, type: TransactionType.TRANSFER, amount: 200000,
              areaId: 'area-other', fromId: 'acc-bancolombia', amountBase: 200000, exchangeRateSnapshot: 1,
              from: 'Bancolombia', to: 'Efectivo', area: 'Otros',
              note: 'Retiro Cajero', currency: 'COP'
            });
            baseBankBalance -= 200000;
            baseCash += 200000;
          }
        }

        // --- 3. SNAPSHOTS HISTÓRICOS (Patrimonio vs Deuda) ---
        const snapshots: WeeklySnapshot[] = [];
        let historicalNetWorth = 5000000;

        for (let j = 24; j >= 0; j--) {
          historicalNetWorth += (Math.random() - 0.4) * 300000; // Fluctuación leve
          const date = new Date(now);
          date.setDate(date.getDate() - (j * 7));

          snapshots.push({
            id: generateId(), date: date.toISOString().split('T')[0],
            currency: 'COP', patrimonio: Math.floor(historicalNetWorth),
            values: { 'Bancolombia': historicalNetWorth * 0.6, 'CDT': 2000000, 'Deudas': -15000000 }
          });
        }

        onLoadData({
          transactions,
          trades,
          assets,
          debts,
          loans,
          snapshots,
          budgets,
          recurrents,
          accounts,
          areas,
          exchangeRate: 4100,
          baseCurrency: 'COP',
          settings: { language: 'es', baseCurrency: 'COP', monthlyBudget: 4500000 }
        });

        setLoading(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--background-secondary)] border border-[var(--background-modifier-border)] rounded-[2rem] p-8 text-center relative overflow-hidden group shadow-xl">
      <div className="relative z-10 space-y-6">
        <div className="w-16 h-16 bg-[var(--interactive-accent)]/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
          <User size={32} className="text-[var(--interactive-accent)] drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic text-[var(--text-normal)] mb-2">{t('demo.title')}</h2>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto leading-relaxed">
            {t('demo.description')}
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={generateScenario}
            disabled={loading}
            className="bg-[var(--interactive-accent)] text-[var(--text-on-accent)] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 transition-all flex items-center gap-3 disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {loading ? t('demo.generating') : t('demo.load_data')}
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-rose-500 uppercase bg-rose-500/10 py-2 rounded-lg max-w-xs mx-auto border border-rose-500/20">
          <AlertTriangle size={12} />
          {t('demo.warning')}
        </div>
      </div>
    </div>
  );
};

export default DemoSimulator;