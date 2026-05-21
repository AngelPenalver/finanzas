"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/hooks/useFinanzas";
import { Summary } from "@/components/Summary";
import { PeriodSelector } from "@/components/PeriodSelector";
import { RatesPanel } from "@/components/RatesPanel";
import { IncomeSection } from "@/components/IncomeSection";
import { PaymentsSection } from "@/components/PaymentsSection";
import { PurchasesSection } from "@/components/PurchasesSection";
import { TabButton } from "@/components/ui";

type Tab = "resumen" | "ingresos" | "pagos" | "compras";

export default function Home() {
  const [tab, setTab] = useState<Tab>("resumen");
  const f = useFinanzas();

  const period = f.viewPeriod;

  const calcData = useMemo(
    () =>
      period
        ? {
            incomes: period.incomes,
            payments: period.payments,
            purchases: period.purchases,
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

  if (!f.hydrated || !period || !calcData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-5 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold tracking-tight">Control de Finanzas</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Por quincena · $ BCV · solo la actual se edita
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5 pb-24">
        <PeriodSelector
          state={f.state}
          viewPeriodId={f.viewPeriodId}
          onSelect={f.setViewPeriodId}
        />

        <RatesPanel
          bcv={f.viewRates.bcvRate}
          p2p={f.viewRates.p2pRate}
          bcvUpdatedAt={f.isReadOnly ? null : f.state.bcvUpdatedAt}
          p2pUpdatedAt={f.isReadOnly ? null : f.state.p2pUpdatedAt}
          readOnly={f.isReadOnly}
          bcvLoading={f.bcvLoading}
          bcvError={f.bcvError}
          p2pLoading={f.p2pLoading}
          p2pError={f.p2pError}
          onFetchBcv={f.fetchBcv}
          onFetchP2p={f.fetchP2p}
          onP2pChange={f.setP2pRate}
          onBcvManual={f.setBcvRateManual}
        />

        <Summary periodId={f.viewPeriodId} data={calcData} />

        <nav
          className={`flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1 ${f.isReadOnly ? "opacity-90" : ""}`}
        >
          <TabButton
            active={tab === "resumen"}
            onClick={() => setTab("resumen")}
          >
            Todo
          </TabButton>
          <TabButton
            active={tab === "ingresos"}
            onClick={() => setTab("ingresos")}
          >
            Ingresos
          </TabButton>
          <TabButton active={tab === "pagos"} onClick={() => setTab("pagos")}>
            Pagos
          </TabButton>
          <TabButton active={tab === "compras"} onClick={() => setTab("compras")}>
            Compras
          </TabButton>
        </nav>

        {(tab === "resumen" || tab === "ingresos") && (
          <IncomeSection
            incomes={period.incomes}
            bcv={f.viewRates.bcvRate}
            p2p={f.viewRates.p2pRate}
            readOnly={f.isReadOnly}
            onAdd={f.addIncome}
            onRemove={f.removeIncome}
          />
        )}
        {(tab === "resumen" || tab === "pagos") && (
          <PaymentsSection
            payments={period.payments}
            bcv={f.viewRates.bcvRate}
            p2p={f.viewRates.p2pRate}
            readOnly={f.isReadOnly}
            onAdd={f.addPayment}
            onToggle={f.togglePayment}
            onToggleRate={f.togglePaymentRate}
            onRemove={f.removePayment}
          />
        )}
        {(tab === "resumen" || tab === "compras") && (
          <PurchasesSection
            purchases={period.purchases}
            bcv={f.viewRates.bcvRate}
            p2p={f.viewRates.p2pRate}
            readOnly={f.isReadOnly}
            onAdd={f.addPurchase}
            onToggle={f.togglePurchase}
            onRemove={f.removePurchase}
          />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/90 px-4 py-2 text-center text-xs text-zinc-600 backdrop-blur">
        Guardado por quincena en este navegador
      </footer>
    </div>
  );
}
