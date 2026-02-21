import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  Book, Sparkles, Command, ArrowRight, GitCommit,
  TrendingUp, Calendar, CheckCircle2, AlertCircle,
  Terminal, ShieldCheck, Repeat, Link as LinkIcon,
  Activity, Wallet, PieChart, Box, Receipt, ShoppingBag, Briefcase, Users2, RefreshCw, Settings as SettingsIcon
} from 'lucide-react';

// --- CONFIGURACIÓN DE SISTEMA ---
const SYSTEM_INFO = {
  version: '3.0.0',
  engine: 'FinanceOS Core v7',
  platform: 'Obsidian Environment'
};

const Guide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-32 max-w-5xl mx-auto font-sans">

      {/* --- HERO HEADER: El Origen --- */}
      <header className="relative py-12 text-center border-b border-[var(--background-modifier-border)] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-gradient-to-b from-purple-500/5 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="p-4 bg-[var(--background-secondary)] rounded-[2rem] border border-[var(--background-modifier-border)] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Book size={48} className="text-purple-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-[var(--text-normal)] mb-3">
              {t('guide.title')}
            </h1>
            <p className="text-lg text-[var(--text-muted)] font-medium max-w-xl mx-auto leading-relaxed">
              {t('guide.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 text-[9px] font-black uppercase text-[var(--text-faint)] tracking-widest bg-[var(--background-secondary)] px-3 py-1 rounded-full border border-[var(--background-modifier-border)]">
            <span>{SYSTEM_INFO.engine}</span>
            <span className="opacity-30">•</span>
            <span>v{SYSTEM_INFO.version}</span>
          </div>
        </div>
      </header>

      {/* --- BLOQUE 1: FUNDAMENTOS (Capa Cognitiva) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-labelledby="section-basics">
        <div className="space-y-6">
          <h2 id="section-basics" className="text-2xl font-black italic text-[var(--text-normal)] flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" /> {t('guide.basics.title')}
          </h2>
          <p className="text-[var(--text-muted)]">{t('guide.basics.desc')}</p>

          <article className="bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)] transition-colors group">
            <h3 className="text-lg font-bold text-[var(--text-normal)] mb-2 flex items-center gap-2">
              <GitCommit size={20} className="text-indigo-400" /> {t('guide.basics.1.title')}
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {t('guide.basics.1.text')}
            </p>
          </article>

          <article className="bg-[var(--background-secondary)] p-6 rounded-3xl border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)] transition-colors">
            <h3 className="text-lg font-bold text-[var(--text-normal)] mb-2 flex items-center gap-2">
              <LinkIcon size={20} className="text-sky-400" /> {t('guide.basics.2.title')}
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              {t('guide.basics.2.text')}
            </p>
            {/* Ejemplo Visual de WikiLink - Semántica de código */}
            <div className="bg-[var(--background-primary)] p-3 rounded-xl border border-[var(--background-modifier-border)] font-mono text-xs flex items-center gap-2 select-all cursor-copy" title="Haz click para seleccionar ejemplo">
              <span className="text-[var(--text-muted)]">Input:</span>
              <span className="text-[var(--text-normal)]">Cena con <span className="text-[var(--interactive-accent)] font-bold">[[Cliente VIP]]</span></span>
            </div>
          </article>
        </div>

        {/* --- BLOQUE 2: IA & COMANDOS (Capa de Interacción) --- */}
        <div className="bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-primary)] p-8 rounded-[2.5rem] border border-[var(--background-modifier-border)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <h2 className="text-2xl font-black italic text-[var(--text-normal)] mb-2 flex items-center gap-3 relative z-10">
            <Sparkles className="text-sky-500" /> {t('guide.ai.title')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 relative z-10">{t('guide.ai.subtitle')}</p>

          <div className="space-y-6 relative z-10">
            <div className="p-4 bg-[var(--background-primary)] rounded-2xl border border-[var(--background-modifier-border)] shadow-inner">
              <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={12} /> {t('guide.ai.tip1')}
              </div>

              <div className="space-y-4">
                <ExampleBox prompt={t('guide.ai.ex1')} result={t('guide.ai.res1')} color="emerald" />
                <ExampleBox prompt={t('guide.ai.ex2')} result={t('guide.ai.res2')} color="sky" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- BLOQUE 3: TRADING & WORKFLOW (Capa Operativa) --- */}
      <section aria-labelledby="section-workflow">
        <div className="flex items-center gap-3 mb-8 border-b border-[var(--background-modifier-border)] pb-4">
          <TrendingUp className="text-rose-500" size={28} />
          <div>
            <h2 id="section-workflow" className="text-2xl font-black italic text-[var(--text-normal)]">{t('guide.trade.title')}</h2>
            <p className="text-xs text-[var(--text-muted)]">{t('guide.trade.desc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepBox number="1" title={t('guide.trade.step1')} text={t('guide.trade.text1')} />
          <StepBox number="2" title={t('guide.trade.step2')} text={t('guide.trade.text2')} highlight />
          <StepBox number="3" title={t('guide.trade.step3')} text={t('guide.trade.text3')} />
        </div>
      </section>

      {/* --- BLOQUE 4: MANUAL DE COMPONENTES --- */}
      <section aria-labelledby="section-manual" className="space-y-8 mt-16 mb-24">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
          <h2 id="section-manual" className="text-3xl font-black italic text-[var(--text-normal)] flex items-center gap-3 justify-center mb-4">
            <Book className="text-emerald-500" size={32} /> Manual de Componentes
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Aprende la <strong>manera adecuada de uso</strong> para cada una de las herramientas de Finance OS.
            Recuerda que los módulos opcionales pueden activarse desde Configuración.
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--text-normal)] border-b border-[var(--background-modifier-border)] pb-2 pt-4">
            <ShieldCheck className="text-sky-500" size={24} /> Estándar (La Base Diaria)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ComponentCard
              icon={<Activity />} title="Dashboard"
              desc="Tu pantalla principal. Úsala a diario para revisar el Flujo de Caja Mensual y el progreso de tu Patrimonio Neto."
              usage="Asegúrate de que las barras verdes superen a las rojas. Si usas presupuestos, fíjate si puedes gastar en salidas o debes quedarte en casa esta semana."
            />
            <ComponentCard
              icon={<Box />} title="Diario / Logs"
              desc="La pantalla de registro puro de ingresos, gastos y transferencias. Usar a diario al hacer compras significativas."
              usage="Escoge bien la Cuenta de la que salió el dinero, y añade una nota si la categoría no te basta. Usa los filtros si no te cuadran los números a fin de mes."
            />
            <ComponentCard
              icon={<Wallet />} title="Balances"
              desc="Tus cuentas de banco, efectivo y ahorros vistos desde arriba. Usar semanal o quincenalmente."
              usage="Arrastra o cliquea entre tarjetas para Transferencias Rápidas. Usa el icono de Tuerca en cada tarjeta para Cuadrar Manualmente tus fondos con el banco."
            />
            <ComponentCard
              icon={<Calendar />} title="Monthly Review"
              desc="Un compendio automático de tus hábitos de gastos de los últimos 30 días. Usar el 1ro de cada mes."
              usage="Compara tus gastos por categoría. Revisa tu Tasa de Ahorro; si fue inferior al 10%, anota un plan para reducir un gasto hormiga específico."
            />
            <ComponentCard
              icon={<TrendingUp />} title="Annual Report"
              desc="Tu 'Wrapped' financiero. Vista macro de todo el año para evaluar tus metas. Usar en Diciembre/Enero."
              usage="Analiza qué meses fueron los más duros (vacaciones, regreso a clases) para prepararte mejor el próximo año."
            />
          </div>
        </div>

        <div className="space-y-6 pt-8">
          <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--text-normal)] border-b border-[var(--background-modifier-border)] pb-2 pt-4">
            <SettingsIcon className="text-amber-500" size={24} /> Modulares (Activables)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ComponentCard
              isOptional icon={<PieChart />} title="Budgets (Presupuestos)"
              desc="Limita el gasto en categorías peligrosas."
              usage="No presupuestes todo. Elige las 3 áreas donde el dinero se fuga (ej. Ropa, Restaurantes). Si te queda menos del 20%, el límite aparecerá naranja/rojo."
            />
            <ComponentCard
              isOptional icon={<Repeat />} title="Suscripciones (Recurrent)"
              desc="Para no registrar transacciones fijas a mano cada mes."
              usage="Ingresa tus obligaciones y fechas de cobro. El sistema no descuenta sin tu permiso. A fin de mes, entra y Ejecuta los cobros confirmados."
            />
            <ComponentCard
              isOptional icon={<TrendingUp />} title="Tradery (Trading)"
              desc="Bitácora profesional para Cripto, Forex o Acciones."
              usage="Anota estrategias y emociones al entrar. Al salir, actualiza con ganancias/pérdidas y registra lecciones para no repetir errores."
            />
            <ComponentCard
              isOptional icon={<Box />} title="Assets (Activos)"
              desc="Llevar la cuenta de propiedades, carros o acciones en startups."
              usage="Crea el activo y regístrale +Inversión cuando pagues impuestos/mantenimiento, para conocer el ROI verídico al vender."
            />
            <ComponentCard
              isOptional icon={<Receipt />} title="Debts / Lending"
              desc="Controla deudas propias o dinero que prestas a terceros."
              usage="Si alguien te presta o le prestas dinero a alguien, crea el registro. Cuando haya pagos, haz 'Pago Parcial' para bajar la deuda al vuelo."
            />
            <ComponentCard
              isOptional icon={<ShoppingBag />} title="Business (Mini ERP)"
              desc="Control para ventas y cálculo de márgenes empresariales."
              usage="Registra tus productos estrella con su Costo Base. Cada fin de semana, ingresa las unidades vendidas para conocer tus ganancias netas."
            />
            <ComponentCard
              isOptional icon={<Briefcase />} title="Quotation (Cotizador)"
              desc="Armar presupuestos formales para cobrar a clientes freelance."
              usage="Añade tu tasa hora, tareas estimadas y costos fijos para conseguir la cotización exacta que debes presentar al cliente de forma limpia."
            />
            <ComponentCard
              isOptional icon={<Users2 />} title="Custodial (Terceros)"
              desc="Separar fondos que 'cuidas' pero no te pertenecen."
              usage="El dinero aquí se excluye de tu Patrimonio Neto global para no inflar tu riqueza. Perfecto para fondos grupales o tesorerías de curso."
            />
            <ComponentCard
              isOptional icon={<RefreshCw />} title="FX (Conversor Divisas)"
              desc="Cotiza cambios antes de ir a una casa cambiaria física."
              usage="Comprueba cuánto estás perdiendo de 'Spread' o comisión escondida respecto a la tasa de cambio global de mercado abierto."
            />
          </div>
        </div>
      </section>

      {/* --- BLOQUE 5: RUTINAS (Capa Conductual) --- */}
      <section className="bg-[var(--background-secondary)] rounded-[2.5rem] p-8 border border-[var(--background-modifier-border)] shadow-sm">
        <h2 className="text-center text-2xl font-black italic text-[var(--text-normal)] mb-10 flex justify-center items-center gap-3">
          <Repeat className="text-purple-500" /> {t('guide.routine.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RoutineItem icon={<Command className="text-amber-500" />} title={t('guide.routine.daily')} text={t('guide.routine.daily.text')} />
          <RoutineItem icon={<CheckCircle2 className="text-sky-500" />} title={t('guide.routine.weekly')} text={t('guide.routine.weekly.text')} />
          <RoutineItem icon={<Calendar className="text-purple-500" />} title={t('guide.routine.monthly')} text={t('guide.routine.monthly.text')} />
        </div>
      </section>

      {/* FOOTER: Identidad Técnica */}
      <footer className="flex flex-col items-center gap-2 pt-8 opacity-40">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <AlertCircle size={14} />
          <span>Finance OS {SYSTEM_INFO.version} • Optimized for {SYSTEM_INFO.platform}</span>
        </div>
        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--text-faint)]">
          Non-Custodial Financial Awareness Engine
        </div>
      </footer>

    </div>
  );
};

// --- COMPONENTES AUXILIARES TIPADOS ---

interface StepBoxProps {
  number: string;
  title: string;
  text: string;
  highlight?: boolean;
}

const StepBox: React.FC<StepBoxProps> = ({ number, title, text, highlight }) => (
  <div className={`p-6 rounded-2xl border flex flex-col gap-3 h-full transition-all hover:-translate-y-1 ${highlight ? 'bg-[var(--interactive-accent)]/5 border-[var(--interactive-accent)]/30' : 'bg-[var(--background-primary)] border-[var(--background-modifier-border)]'}`}>
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--background-secondary)] font-black text-xs border border-[var(--background-modifier-border)]">
        {number}
      </span>
      <h3 className="font-bold text-[var(--text-normal)] text-sm">{title}</h3>
    </div>
    <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-1">
      {text}
    </p>
  </div>
);

interface ExampleBoxProps {
  prompt: string;
  result: string;
  color: 'emerald' | 'sky';
}

const ExampleBox: React.FC<ExampleBoxProps> = ({ prompt, result, color }) => (
  <div>
    <div className="font-mono text-xs text-[var(--text-normal)] bg-[var(--background-modifier-form-field)] p-2 rounded-lg border border-[var(--background-modifier-border)] mb-1">
      "{prompt}"
    </div>
    <div className={`text-[10px] font-bold pl-2 flex items-center gap-1 ${color === 'emerald' ? 'text-emerald-500' : 'text-sky-500'}`}>
      <ArrowRight size={10} /> {result}
    </div>
  </div>
);

interface RoutineItemProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const RoutineItem: React.FC<RoutineItemProps> = ({ icon, title, text }) => (
  <div className="text-center space-y-3 group">
    <div className="w-16 h-16 mx-auto bg-[var(--background-primary)] rounded-full flex items-center justify-center border-4 border-[var(--background-secondary)] shadow-xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-[var(--text-normal)]">{title}</h3>
    <p className="text-sm text-[var(--text-muted)] leading-relaxed px-4">
      {text}
    </p>
  </div>
);

interface ComponentManualProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  usage: string;
  isOptional?: boolean;
}

const ComponentCard: React.FC<ComponentManualProps> = ({ icon, title, desc, usage, isOptional }) => (
  <div className="p-6 bg-[var(--background-primary)] rounded-3xl border border-[var(--background-modifier-border)] hover:border-[var(--interactive-accent)] transition-all relative overflow-hidden group flex flex-col h-full hover:-translate-y-1">
    {isOptional && (
      <div className="absolute top-4 right-4 text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 tracking-widest z-10">Opcional</div>
    )}
    <div className="w-12 h-12 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center text-[var(--interactive-accent)] mb-5 border border-[var(--background-modifier-border)] group-hover:scale-110 transition-transform relative z-10">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-[var(--text-normal)] mb-2 relative z-10">{title}</h3>
    <p className="text-xs text-[var(--text-muted)] mb-5 flex-1 relative z-10">{desc}</p>
    <div className="bg-[var(--background-secondary)]/50 p-4 rounded-xl border border-[var(--background-modifier-border)] opacity-90 relative z-10">
      <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Manera Adecuada de Uso:</div>
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{usage}</p>
    </div>
  </div>
);

export default Guide;