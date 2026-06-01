"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/hooks/useFinanzas";
import { getSummary, getDebtBalance, sumPayments, sumPurchases } from "@/lib/calc";
import { formatBcvUsd, formatBs, formatDate, formatUsd } from "@/lib/format";
import { formatPeriodLabel, isPeriodLocked } from "@/lib/period";
import { DonutChart } from "@/components/DonutChart";
import { IncomeSection } from "@/components/IncomeSection";
import { PaymentsSection } from "@/components/PaymentsSection";
import { PurchasesSection } from "@/components/PurchasesSection";
import { DebtSection } from "@/components/DebtSection";
import { RatesPanel } from "@/components/RatesPanel";

const CARD = "rounded-2xl border border-white/[0.06] bg-[#111113]";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`${CARD} px-4 py-4 flex flex-col gap-1`}>
      <p className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
      <p className={`text-xl font-bold leading-tight ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

// ── Sección colapsable (panel derecho) ────────────────────────────────────────
function Section({
  emoji,
  title,
  badge,
  badgeColor = "bg-zinc-800 text-zinc-400",
  defaultOpen = false,
  children,
}: {
  emoji: string;
  title: string;
  badge?: string | number;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={CARD}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-5 py-4"
      >
        <div className="flex items-center gap-2.5">
          <span>{emoji}</span>
          <span className="text-sm font-semibold text-zinc-200">{title}</span>
          {badge !== undefined && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <span className={`text-zinc-600 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-white/[0.06] px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Home() {
  const f = useFinanzas();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const period = f.viewPeriod;

  const calcData = useMemo(
    () =>
      period
        ? {
            incomes: period.incomes,
            payments: period.payments,
            purchases: period.purchases,
            debtPayments: period.debtPayments ?? [],
            p2pRate: f.viewRates.p2pRate,
            bcvRate: f.viewRates.bcvRate,
          }
        : null,
    [period, f.viewRates]
  );

  useEffect(() => {
    if (!f.hydrated || f.isReadOnly) return;
    if (f.state.bcvRate === null) void f.fetchBcv();
    if (f.state.p2pRate === null) void f.fetchP2p();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.hydrated, f.isReadOnly]);

  // Actividad reciente
  const activityItems = useMemo(() => {
    if (!period) return [];
    const bcv = f.viewRates.bcvRate ?? 0;
    const p2p = f.viewRates.p2pRate ?? 0;
    type Item = { id: string; icon: string; label: string; amount: string; color: string; date: string; category: string };
    const items: Item[] = [];

    period.incomes.forEach((i) =>
      items.push({ id: `i-${i.id}`, icon: "💰", label: i.note, amount: `+${formatUsd(i.amountUsd)}`, color: "text-emerald-400", date: i.date, category: "Ingreso" })
    );
    period.payments.forEach((p) => {
      const rate = p.rateType === "p2p" ? p2p : bcv;
      const usd = p.currency === "USD" ? p.amount : rate > 0 ? p.amount / rate : 0;
      items.push({ id: `p-${p.id}`, icon: p.paid ? "✅" : "💳", label: p.description, amount: `-${formatUsd(usd)}`, color: p.paid ? "text-zinc-500" : "text-amber-400", date: p.date, category: "Pago" });
    });
    period.purchases.forEach((p) => {
      const usd = p.currency === "USD" ? p.amount : bcv > 0 ? p.amount / bcv : 0;
      items.push({ id: `c-${p.id}`, icon: p.bought ? "✅" : "🛒", label: p.description, amount: `-${formatUsd(usd)}`, color: p.bought ? "text-zinc-500" : "text-sky-400", date: p.date, category: "Compra" });
    });
    (period.debtPayments ?? []).forEach((dp) => {
      const debt = f.state.debts.find((d) => d.id === dp.debtId);
      items.push({ id: `d-${dp.debtId}`, icon: "🏦", label: debt?.description ?? "Deuda", amount: `-${formatUsd(dp.amountUsd)}`, color: "text-red-400", date: dp.date, category: "Deuda" });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [period, f.viewRates, f.state.debts]);

  // Segmentos donut — incluye el restante en verde
  const chartSegments = useMemo(() => {
    if (!calcData) return [];
    const bcv = f.viewRates.bcvRate ?? 0;
    const p2p = f.viewRates.p2pRate ?? 0;
    const s = getSummary(calcData);
    const pagos   = sumPayments(calcData.payments, false, bcv, p2p).usdTotal;
    const compras  = sumPurchases(calcData.purchases, false, bcv, p2p).usdTotal;
    const deudas   = (calcData.debtPayments ?? []).reduce((acc, dp) => acc + dp.amountUsd, 0);
    const restante = s.availableBcvUsd !== null ? Math.max(0, s.availableBcvUsd) : 0;
    return [
      { label: "Restante", value: restante, color: "#34d399" },
      { label: "Pagos",    value: pagos,    color: "#f59e0b" },
      { label: "Compras",  value: compras,  color: "#38bdf8" },
      { label: "Deudas",   value: deudas,   color: "#f87171" },
    ].filter((seg) => seg.value > 0);
  }, [calcData, f.viewRates]);

  if (!f.hydrated || !period || !calcData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-zinc-500">
        Cargando…
      </div>
    );
  }

  const s = getSummary(calcData);
  const bcv = f.viewRates.bcvRate ?? 0;
  const p2p = f.viewRates.p2pRate ?? 0;
  const totalDebt = f.state.debts.filter((d) => !d.paid).reduce((sum, d) => sum + getDebtBalance(d, f.state.periods), 0);
  const pendingPayments = period.payments.filter((p) => !p.paid).length;
  const pendingPurchases = period.purchases.filter((p) => !p.bought).length;
  const activeDebts = f.state.debts.filter((d) => !d.paid && getDebtBalance(d, f.state.periods) > 0).length;
  const chartCenter = s.availableBcvUsd !== null ? formatBcvUsd(s.availableBcvUsd) : "—";
  const chartCenterSub = s.availableBcvUsd !== null && s.availableBcvUsd >= 0 ? "Te queda" : "Déficit";
  const chartCenterColor =
    s.availableBcvUsd === null
      ? "text-zinc-400"
      : s.availableBcvUsd >= 0
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0b] text-zinc-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.05] bg-[#0a0a0b]/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-6 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-black">F</div>
            <span className="text-sm font-bold tracking-tight">finanzas</span>
          </div>

          {/* Selector de quincenas */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {f.state.periods.map((p) => {
              const locked = isPeriodLocked(p.id);
              const active = p.id === f.viewPeriodId;
              return (
                <button key={p.id} type="button" onClick={() => f.setViewPeriodId(p.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"}`}>
                  {locked ? "🔒 " : ""}{formatPeriodLabel(p.id)}
                </button>
              );
            })}
          </div>

          {/* Tasas + estado */}
          <div className="flex items-center gap-4">
            {p2p > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-zinc-600 uppercase">P2P</p>
                <p className="text-xs font-semibold text-sky-400">{p2p} Bs</p>
              </div>
            )}
            {bcv > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-zinc-600 uppercase">BCV</p>
                <p className="text-xs font-semibold text-emerald-500">{bcv} Bs</p>
              </div>
            )}
            {f.isReadOnly && (
              <span className="rounded-full border border-amber-800/40 bg-amber-900/20 px-2 py-1 text-[10px] text-amber-400">
                Solo lectura
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Cuerpo: dos columnas ── */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* ══ COLUMNA IZQUIERDA: Balances ══ */}
        <aside className="hidden lg:flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/[0.05] px-5 py-6">

          {/* Saludo */}
          <div>
            <h1 className="text-xl font-bold text-white">¡Hola! 👋</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatPeriodLabel(f.viewPeriodId)} · {f.isReadOnly ? "Solo lectura" : "Quincena activa"}
            </p>
          </div>

          {/* 4 stats */}
          <div className="grid grid-cols-2 gap-2">
            {/* Te queda — siempre verde si positivo */}
            <StatCard
              label="Te queda"
              value={s.availableBcvUsd !== null ? formatBcvUsd(s.availableBcvUsd) : "—"}
              sub={s.availableBs !== null ? formatBs(s.availableBs) : undefined}
              accent={
                s.availableBcvUsd === null
                  ? "text-zinc-400"
                  : s.availableBcvUsd >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
              }
            />
            {/* Ingresos — neutral */}
            <StatCard
              label="Ingresos"
              value={formatUsd(s.totalIncomeUsdt)}
              sub={s.incomeBs.p2p !== null ? formatBs(s.incomeBs.p2p) : "Sin tasa P2P"}
              accent="text-zinc-100"
            />
            {/* Por pagar — ámbar */}
            <StatCard
              label="Por pagar"
              value={s.obligationsBcvUsd !== null ? formatBcvUsd(s.obligationsBcvUsd) : "—"}
              sub={`${pendingPayments + pendingPurchases} pendiente${pendingPayments + pendingPurchases !== 1 ? "s" : ""}`}
              accent="text-amber-400"
            />
            {/* Deudas — rojo si hay, verde si no */}
            <StatCard
              label="Deudas"
              value={totalDebt > 0 ? formatUsd(totalDebt) : "Al día ✓"}
              sub={activeDebts > 0 ? `${activeDebts} activa${activeDebts !== 1 ? "s" : ""}` : undefined}
              accent={totalDebt > 0 ? "text-red-400" : "text-emerald-400"}
            />
          </div>

          {/* Gráfico de dona */}
          <div className={`${CARD} p-5`}>
            <p className="text-sm font-semibold text-zinc-200">Gastos por categoría</p>
            <p className="text-xs text-zinc-600 mb-5">Esta quincena en USD</p>
            <div className="flex flex-col items-center gap-5">
              <DonutChart
                segments={chartSegments}
                size={170}
                thickness={26}
                centerLabel={chartCenter}
                centerSub={chartCenterSub}
                centerLabelColor={chartCenterColor}
              />
              <div className="w-full space-y-2.5">
                {chartSegments.length === 0 ? (
                  <p className="text-center text-xs text-zinc-600">Sin gastos registrados</p>
                ) : (
                  chartSegments.map((seg) => {
                    const tot = chartSegments.reduce((s, x) => s + x.value, 0);
                    const pct = tot > 0 ? ((seg.value / tot) * 100).toFixed(1) : "0";
                    return (
                      <div key={seg.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                          <span className="text-sm text-zinc-300">{seg.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-zinc-300">{pct}%</span>
                          <span className="ml-2 text-xs text-zinc-600">{formatUsd(seg.value)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className={`${CARD} p-5 flex-1`}>
            <p className="text-sm font-semibold text-zinc-200">Últimos movimientos</p>
            <p className="text-xs text-zinc-600 mb-4">{activityItems.length} esta quincena</p>

            <div className="space-y-0.5">
              {activityItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-600">Sin movimientos</p>
              ) : (
                activityItems.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{item.label}</p>
                      <p className="text-[10px] text-zinc-600">{item.category} · {formatDate(item.date)}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${item.color}`}>{item.amount}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ══ COLUMNA DERECHA: Gestión ══ */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 space-y-3">

          {/* Vista móvil: stats compactos arriba */}
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <StatCard
              label="Te queda"
              value={s.availableBcvUsd !== null ? formatBcvUsd(s.availableBcvUsd) : "—"}
              sub={s.availableBs !== null ? formatBs(s.availableBs) : undefined}
              accent={
                s.availableBcvUsd === null
                  ? "text-zinc-400"
                  : s.availableBcvUsd >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
              }
            />
            <StatCard
              label="Ingresos"
              value={formatUsd(s.totalIncomeUsdt)}
              sub={s.incomeBs.p2p !== null ? formatBs(s.incomeBs.p2p) : "Sin tasa P2P"}
              accent="text-zinc-100"
            />
            <StatCard
              label="Por pagar"
              value={s.obligationsBcvUsd !== null ? formatBcvUsd(s.obligationsBcvUsd) : "—"}
              sub={`${pendingPayments + pendingPurchases} pendiente${pendingPayments + pendingPurchases !== 1 ? "s" : ""}`}
              accent="text-amber-400"
            />
            <StatCard
              label="Deudas"
              value={totalDebt > 0 ? formatUsd(totalDebt) : "Al día ✓"}
              sub={activeDebts > 0 ? `${activeDebts} activa${activeDebts !== 1 ? "s" : ""}` : undefined}
              accent={totalDebt > 0 ? "text-red-400" : "text-emerald-400"}
            />
          </div>

          {/* Botones de acción rápida */}
          {!f.isReadOnly && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "ingresos", icon: "＋", label: "Ingreso", color: "emerald" },
                { key: "pagos",    icon: "💳", label: "Pago",    color: "amber"   },
                { key: "compras",  icon: "🛒", label: "Compra",  color: "sky"     },
              ].map(({ key, icon, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(activeSection === key ? null : key)}
                  className={`${CARD} flex items-center justify-center gap-2 py-3 text-sm font-medium transition hover:bg-white/[0.04] ${
                    activeSection === key ? `text-${color}-400 border-${color}-800/40` : "text-zinc-400"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}

          <p className="px-1 pt-1 text-[10px] uppercase tracking-widest text-zinc-600">Gestión</p>

          {/* Tasas */}
          <Section emoji="📈" title="Tasas" defaultOpen={!f.viewRates.bcvRate || !f.viewRates.p2pRate}>
            <RatesPanel
              bcv={f.viewRates.bcvRate} p2p={f.viewRates.p2pRate}
              bcvUpdatedAt={f.isReadOnly ? null : f.state.bcvUpdatedAt}
              p2pUpdatedAt={f.isReadOnly ? null : f.state.p2pUpdatedAt}
              readOnly={f.isReadOnly}
              bcvLoading={f.bcvLoading} bcvError={f.bcvError}
              p2pLoading={f.p2pLoading} p2pError={f.p2pError}
              onFetchBcv={f.fetchBcv} onFetchP2p={f.fetchP2p}
              onP2pChange={f.setP2pRate} onBcvManual={f.setBcvRateManual}
            />
          </Section>

          {/* Ingresos */}
          <Section emoji="💰" title="Ingresos"
            badge={period.incomes.length || undefined}
            badgeColor="bg-emerald-500/10 text-emerald-400"
            defaultOpen={activeSection === "ingresos"}
          >
            <IncomeSection incomes={period.incomes} bcv={f.viewRates.bcvRate} p2p={f.viewRates.p2pRate}
              readOnly={f.isReadOnly} onAdd={f.addIncome} onRemove={f.removeIncome} />
          </Section>

          {/* Pagos */}
          <Section emoji="💳" title="Pagos"
            badge={pendingPayments > 0 ? pendingPayments : undefined}
            badgeColor="bg-amber-500/10 text-amber-400"
            defaultOpen={activeSection === "pagos"}
          >
            <PaymentsSection payments={period.payments} bcv={f.viewRates.bcvRate} p2p={f.viewRates.p2pRate}
              readOnly={f.isReadOnly} onAdd={f.addPayment} onToggle={f.togglePayment}
              onToggleRate={f.togglePaymentRate} onRemove={f.removePayment} />
          </Section>

          {/* Compras */}
          <Section emoji="🛒" title="Compras"
            badge={pendingPurchases > 0 ? pendingPurchases : undefined}
            badgeColor="bg-sky-500/10 text-sky-400"
            defaultOpen={activeSection === "compras"}
          >
            <PurchasesSection purchases={period.purchases} bcv={f.viewRates.bcvRate} p2p={f.viewRates.p2pRate}
              readOnly={f.isReadOnly} onAdd={f.addPurchase} onToggle={f.togglePurchase} onRemove={f.removePurchase} />
          </Section>

          {/* Deudas */}
          <Section emoji="🏦" title="Deudas"
            badge={activeDebts > 0 ? activeDebts : undefined}
            badgeColor="bg-red-500/10 text-red-400"
          >
            <DebtSection
              debts={f.state.debts} allPeriods={f.state.periods}
              currentDebtPayments={period.debtPayments ?? []}
              bcvRate={f.viewRates.bcvRate} readOnly={f.isReadOnly}
              onAddDebt={f.addDebt} onRemoveDebt={f.removeDebt}
              onToggleDebtPaid={f.toggleDebtPaid}
              onAddDebtPayment={f.addDebtPayment}
              onRemoveDebtPayment={f.removeDebtPayment}
            />
          </Section>

        </main>
      </div>
    </div>
  );
}
