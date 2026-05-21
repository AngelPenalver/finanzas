import type { PeriodData } from "./types";

/** Formato: YYYY-MM-1 | YYYY-MM-2 (1 = días 1–15, 2 = 16–fin) */
export function getPeriodIdFromDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const half = date.getDate() <= 15 ? 1 : 2;
  return `${year}-${month}-${half}`;
}

export function getCurrentPeriodId(): string {
  return getPeriodIdFromDate(new Date());
}

export function isPeriodLocked(periodId: string, now = new Date()): boolean {
  return periodId !== getPeriodIdFromDate(now);
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatPeriodLabel(periodId: string): string {
  const [year, month, half] = periodId.split("-");
  const monthName = MONTHS[parseInt(month, 10) - 1] ?? month;
  const quincena = half === "1" ? "1.ª quincena" : "2.ª quincena";
  return `${monthName} ${year} · ${quincena}`;
}

export function comparePeriodIds(a: string, b: string): number {
  return b.localeCompare(a);
}

export function createEmptyPeriod(id: string): PeriodData {
  return {
    id,
    incomes: [],
    payments: [],
    purchases: [],
    p2pRate: null,
    bcvRate: null,
  };
}

export function sortPeriods(periods: PeriodData[]): PeriodData[] {
  return [...periods].sort((a, b) => comparePeriodIds(a.id, b.id));
}
