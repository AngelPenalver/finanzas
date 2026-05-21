import {
  getCurrentPeriodId,
  getPeriodIdFromDate,
  isPeriodLocked,
} from "./period";
import type { PeriodData } from "./types";

/** Id de la quincena de prueba = quincena anterior a la actual. */
export function getDemoPeriodId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (now.getDate() <= 15) {
    return getPeriodIdFromDate(new Date(year, month - 1, 20));
  }
  const m = String(month + 1).padStart(2, "0");
  return `${year}-${m}-1`;
}

export function isDemoPeriod(periodId: string): boolean {
  return periodId === getDemoPeriodId();
}

export function createDemoPeriod(): PeriodData {
  const id = getDemoPeriodId();
  return {
    id,
    p2pRate: 705,
    bcvRate: 518,
    incomes: [
      {
        id: "demo-income-1",
        amountUsd: 180,
        note: "Binance P2P — quincena de prueba",
        date: "2026-05-08T14:00:00.000Z",
      },
      {
        id: "demo-income-2",
        amountUsd: 45,
        note: "Venta USDT extra",
        date: "2026-05-12T10:00:00.000Z",
      },
    ],
    payments: [
      {
        id: "demo-pay-1",
        description: "Alquiler",
        amount: 85,
        currency: "USD",
        rateType: "bcv",
        paid: true,
        date: "2026-05-05T09:00:00.000Z",
      },
      {
        id: "demo-pay-2",
        description: "Internet + luz",
        amount: 42,
        currency: "USD",
        rateType: "bcv",
        paid: true,
        date: "2026-05-07T11:00:00.000Z",
      },
      {
        id: "demo-pay-3",
        description: "Mi quincena",
        amount: 130,
        currency: "USD",
        rateType: "p2p",
        paid: true,
        date: "2026-05-01T08:00:00.000Z",
      },
      {
        id: "demo-pay-4",
        description: "Préstamo",
        amount: 28000,
        currency: "BS",
        rateType: "bcv",
        paid: false,
        date: "2026-05-11T16:00:00.000Z",
      },
    ],
    purchases: [
      {
        id: "demo-pur-1",
        description: "Mercado semanal",
        amount: 55,
        currency: "USD",
        rateType: "bcv",
        bought: true,
        date: "2026-05-09T18:00:00.000Z",
      },
      {
        id: "demo-pur-2",
        description: "Aceite / filtros",
        amount: 32,
        currency: "USD",
        rateType: "bcv",
        bought: false,
        date: "2026-05-13T12:00:00.000Z",
      },
    ],
  };
}

export function injectDemoPeriodIfNeeded(periods: PeriodData[]): PeriodData[] {
  const demoId = getDemoPeriodId();
  const currentId = getCurrentPeriodId();
  if (periods.some((p) => p.id === demoId)) return periods;
  if (demoId === currentId) return periods;
  if (!isPeriodLocked(demoId)) return periods;
  return [...periods, createDemoPeriod()];
}
