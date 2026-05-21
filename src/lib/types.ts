export type Currency = "USD" | "BS";

/** BCV = pagos/compras normales. P2P = solo quincena (Binance). */
export type RateType = "bcv" | "p2p";

export interface Income {
  id: string;
  amountUsd: number;
  note: string;
  date: string;
}

export interface Payment {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  rateType: RateType;
  paid: boolean;
  date: string;
}

export interface Purchase {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  rateType: RateType;
  bought: boolean;
  date: string;
}

export interface PeriodData {
  id: string;
  incomes: Income[];
  payments: Payment[];
  purchases: Purchase[];
  /** Tasas al cerrar la quincena (para consulta histórica). */
  p2pRate: number | null;
  bcvRate: number | null;
}

export interface FinanzasState {
  periods: PeriodData[];
  p2pRate: number | null;
  p2pUpdatedAt: string | null;
  bcvRate: number | null;
  bcvUpdatedAt: string | null;
}

export const DEFAULT_STATE: FinanzasState = {
  periods: [],
  p2pRate: null,
  p2pUpdatedAt: null,
  bcvRate: null,
  bcvUpdatedAt: null,
};
