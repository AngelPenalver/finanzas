"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCurrentPeriodId,
  isPeriodLocked,
} from "@/lib/period";
import {
  ensurePeriods,
  getPeriod,
  getRatesForPeriod,
  loadState,
  saveState,
} from "@/lib/storage";
import {
  DEFAULT_STATE,
  type Currency,
  type Debt,
  type FinanzasState,
  type PeriodData,
  type RateType,
  type Income,
  type Payment,
  type Purchase,
} from "@/lib/types";

function uid(): string {
  return crypto.randomUUID();
}

function updateCurrentPeriod(
  state: FinanzasState,
  updater: (period: PeriodData) => PeriodData
): FinanzasState {
  const currentId = getCurrentPeriodId();
  if (!state.periods.some((p) => p.id === currentId)) {
    return ensurePeriods(state);
  }
  return {
    ...state,
    periods: state.periods.map((p) =>
      p.id === currentId ? updater(p) : p
    ),
  };
}

export function useFinanzas() {
  const [state, setState] = useState<FinanzasState>(DEFAULT_STATE);
  const [viewPeriodId, setViewPeriodId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [bcvLoading, setBcvLoading] = useState(false);
  const [bcvError, setBcvError] = useState<string | null>(null);
  const [p2pLoading, setP2pLoading] = useState(false);
  const [p2pError, setP2pError] = useState<string | null>(null);

  const currentPeriodId = getCurrentPeriodId();
  const activeViewId = viewPeriodId || currentPeriodId;
  const isReadOnly = isPeriodLocked(activeViewId);

  const viewPeriod =
    getPeriod(state, activeViewId) ??
    state.periods.find((p) => p.id === currentPeriodId);

  const viewRates = getRatesForPeriod(state, activeViewId);

  useEffect(() => {
    const loaded = ensurePeriods(loadState());
    setState(loaded);
    setViewPeriodId(getCurrentPeriodId());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const id = getCurrentPeriodId();
    setState((s) => ensurePeriods(s));
    setViewPeriodId((prev) => (isPeriodLocked(prev) ? id : prev === "" ? id : prev));
  }, [hydrated]);

  const update = useCallback((patch: Partial<FinanzasState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const fetchBcv = useCallback(async () => {
    if (isPeriodLocked(activeViewId)) return;
    setBcvLoading(true);
    setBcvError(null);
    try {
      const res = await fetch("/api/bcv");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      update({ bcvRate: data.rate, bcvUpdatedAt: data.updatedAt });
    } catch (e) {
      setBcvError(e instanceof Error ? e.message : "Error al cargar BCV");
    } finally {
      setBcvLoading(false);
    }
  }, [update, activeViewId]);

  const fetchP2p = useCallback(async () => {
    if (isPeriodLocked(activeViewId)) return;
    setP2pLoading(true);
    setP2pError(null);
    try {
      const res = await fetch("/api/p2p");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      update({ p2pRate: data.rate, p2pUpdatedAt: data.updatedAt });
    } catch (e) {
      setP2pError(e instanceof Error ? e.message : "Error al cargar P2P");
    } finally {
      setP2pLoading(false);
    }
  }, [update, activeViewId]);

  const setP2pRate = useCallback(
    (rate: number | null) => {
      if (isReadOnly) return;
      update({
        p2pRate: rate,
        ...(rate === null ? { p2pUpdatedAt: null } : {}),
      });
    },
    [update, isReadOnly]
  );

  const setBcvRateManual = useCallback(
    (rate: number | null) => {
      if (isReadOnly) return;
      update({ bcvRate: rate });
    },
    [update, isReadOnly]
  );

  const addIncome = useCallback((amountUsd: number, note: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    const entry: Income = {
      id: uid(),
      amountUsd,
      note: note.trim() || "Ingreso USDT",
      date: new Date().toISOString(),
    };
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        incomes: [entry, ...p.incomes],
      }))
    );
  }, []);

  const removeIncome = useCallback((id: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        incomes: p.incomes.filter((i) => i.id !== id),
      }))
    );
  }, []);

  const addPayment = useCallback(
    (
      description: string,
      amount: number,
      currency: Currency,
      rateType: RateType = "bcv"
    ) => {
      if (isPeriodLocked(getCurrentPeriodId())) return;
      const entry: Payment = {
        id: uid(),
        description: description.trim(),
        amount,
        currency,
        rateType,
        paid: false,
        date: new Date().toISOString(),
      };
      setState((s) =>
        updateCurrentPeriod(s, (p) => ({
          ...p,
          payments: [entry, ...p.payments],
        }))
      );
    },
    []
  );

  const togglePaymentRate = useCallback((id: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        payments: p.payments.map((pay) =>
          pay.id === id
            ? { ...pay, rateType: pay.rateType === "p2p" ? "bcv" : "p2p" }
            : pay
        ),
      }))
    );
  }, []);

  const togglePayment = useCallback((id: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        payments: p.payments.map((pay) =>
          pay.id === id ? { ...pay, paid: !pay.paid } : pay
        ),
      }))
    );
  }, []);

  const removePayment = useCallback((id: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        payments: p.payments.filter((pay) => pay.id !== id),
      }))
    );
  }, []);

  const addPurchase = useCallback(
    (description: string, amount: number, currency: Currency) => {
      if (isPeriodLocked(getCurrentPeriodId())) return;
      const entry: Purchase = {
        id: uid(),
        description: description.trim(),
        amount,
        currency,
        rateType: "bcv",
        bought: false,
        date: new Date().toISOString(),
      };
      setState((s) =>
        updateCurrentPeriod(s, (p) => ({
          ...p,
          purchases: [entry, ...p.purchases],
        }))
      );
    },
    []
  );

  const togglePurchase = useCallback((id: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        purchases: p.purchases.map((pur) =>
          pur.id === id ? { ...pur, bought: !pur.bought } : pur
        ),
      }))
    );
  }, []);

  const removePurchase = useCallback((id: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        purchases: p.purchases.filter((pur) => pur.id !== id),
      }))
    );
  }, []);

  // ── Deudas globales ─────────────────────────────────────────────────────

  const addDebt = useCallback((description: string, totalAmountUsd: number) => {
    const entry: Debt = {
      id: uid(),
      description: description.trim(),
      totalAmountUsd,
      createdAt: new Date().toISOString(),
      paid: false,
    };
    setState((s) => ({ ...s, debts: [entry, ...s.debts] }));
  }, []);

  const removeDebt = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      debts: s.debts.filter((d) => d.id !== id),
      // Limpiar abonos hueérfanos en todos los períodos
      periods: s.periods.map((p) => ({
        ...p,
        debtPayments: (p.debtPayments ?? []).filter((dp) => dp.debtId !== id),
      })),
    }));
  }, []);

  const toggleDebtPaid = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      debts: s.debts.map((d) =>
        d.id === id ? { ...d, paid: !d.paid } : d
      ),
    }));
  }, []);

  /** Registra un abono a una deuda en la quincena activa. */
  const addDebtPayment = useCallback(
    (debtId: string, amountUsd: number) => {
      if (isPeriodLocked(getCurrentPeriodId())) return;
      setState((s) =>
        updateCurrentPeriod(s, (p) => {
          // Reemplaza el abono anterior de esta deuda en esta quincena si existe
          const existing = (p.debtPayments ?? []).filter(
            (dp) => dp.debtId !== debtId
          );
          return {
            ...p,
            debtPayments: [
              ...existing,
              { debtId, amountUsd, date: new Date().toISOString() },
            ],
          };
        })
      );
    },
    []
  );

  /** Elimina el abono de una deuda en la quincena activa. */
  const removeDebtPayment = useCallback((debtId: string) => {
    if (isPeriodLocked(getCurrentPeriodId())) return;
    setState((s) =>
      updateCurrentPeriod(s, (p) => ({
        ...p,
        debtPayments: (p.debtPayments ?? []).filter(
          (dp) => dp.debtId !== debtId
        ),
      }))
    );
  }, []);

  return {
    state,
    hydrated,
    viewPeriodId: activeViewId,
    currentPeriodId,
    isReadOnly,
    viewPeriod,
    viewRates,
    setViewPeriodId,
    bcvLoading,
    bcvError,
    p2pLoading,
    p2pError,
    fetchBcv,
    fetchP2p,
    setP2pRate,
    setBcvRateManual,
    addIncome,
    removeIncome,
    addPayment,
    togglePayment,
    togglePaymentRate,
    removePayment,
    addPurchase,
    togglePurchase,
    removePurchase,
    addDebt,
    removeDebt,
    toggleDebtPaid,
    addDebtPayment,
    removeDebtPayment,
  };
}
