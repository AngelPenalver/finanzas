import { injectDemoPeriodIfNeeded } from "./demo-period";
import {
  createEmptyPeriod,
  getCurrentPeriodId,
  isPeriodLocked,
  sortPeriods,
} from "./period";
import {
  DEFAULT_STATE,
  type FinanzasState,
  type Payment,
  type PeriodData,
  type Purchase,
} from "./types";

const STORAGE_KEY = "finanzas-ve";

function normalizePayment(p: Payment & { rateType?: string }): Payment {
  return {
    ...p,
    rateType: p.rateType === "p2p" ? "p2p" : "bcv",
  };
}

function normalizePurchase(p: Purchase & { rateType?: string }): Purchase {
  return { ...p, rateType: "bcv" };
}

function normalizePeriod(period: PeriodData): PeriodData {
  return {
    ...period,
    incomes: period.incomes ?? [],
    payments: (period.payments ?? []).map(normalizePayment),
    purchases: (period.purchases ?? []).map(normalizePurchase),
    p2pRate: period.p2pRate ?? null,
    bcvRate: period.bcvRate ?? null,
  };
}

type LegacyState = FinanzasState & {
  incomes?: PeriodData["incomes"];
  payments?: Payment[];
  purchases?: Purchase[];
};

function lockPeriodRates(
  period: PeriodData,
  global: Pick<FinanzasState, "p2pRate" | "bcvRate">
): PeriodData {
  if (!isPeriodLocked(period.id)) return period;
  return {
    ...period,
    p2pRate: period.p2pRate ?? global.p2pRate,
    bcvRate: period.bcvRate ?? global.bcvRate,
  };
}

export function ensurePeriods(raw: Partial<LegacyState>): FinanzasState {
  const currentId = getCurrentPeriodId();
  const base: FinanzasState = {
    ...DEFAULT_STATE,
    p2pRate: raw.p2pRate ?? null,
    p2pUpdatedAt: raw.p2pUpdatedAt ?? null,
    bcvRate: raw.bcvRate ?? null,
    bcvUpdatedAt: raw.bcvUpdatedAt ?? null,
    periods: [],
  };

  let periods: PeriodData[] = (raw.periods ?? []).map(normalizePeriod);

  if (periods.length === 0 && (raw.incomes || raw.payments || raw.purchases)) {
    periods = [
      normalizePeriod({
        id: currentId,
        incomes: raw.incomes ?? [],
        payments: (raw.payments ?? []).map(normalizePayment),
        purchases: (raw.purchases ?? []).map(normalizePurchase),
        p2pRate: base.p2pRate,
        bcvRate: base.bcvRate,
      }),
    ];
  }

  if (!periods.some((p) => p.id === currentId)) {
    periods = [
      {
        ...createEmptyPeriod(currentId),
        p2pRate: base.p2pRate,
        bcvRate: base.bcvRate,
      },
      ...periods,
    ];
  }

  periods = injectDemoPeriodIfNeeded(periods);
  periods = sortPeriods(periods).map((p) => lockPeriodRates(p, base));

  return { ...base, periods };
}

export function loadState(): FinanzasState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensurePeriods({});
    return ensurePeriods(JSON.parse(raw) as Partial<LegacyState>);
  } catch {
    return ensurePeriods({});
  }
}

export function saveState(state: FinanzasState): void {
  if (typeof window === "undefined") return;
  const normalized = ensurePeriods(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function getPeriod(
  state: FinanzasState,
  periodId: string
): PeriodData | undefined {
  return state.periods.find((p) => p.id === periodId);
}

export function getRatesForPeriod(
  state: FinanzasState,
  periodId: string
): { p2pRate: number | null; bcvRate: number | null } {
  const period = getPeriod(state, periodId);
  const locked = isPeriodLocked(periodId);
  if (locked && period) {
    return {
      p2pRate: period.p2pRate ?? state.p2pRate,
      bcvRate: period.bcvRate ?? state.bcvRate,
    };
  }
  return { p2pRate: state.p2pRate, bcvRate: state.bcvRate };
}
