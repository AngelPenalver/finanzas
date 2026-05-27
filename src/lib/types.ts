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

/** Abono a una deuda global registrado en una quincena específica. */
export interface DebtPayment {
  debtId: string;      // referencia a Debt.id
  amountUsd: number;   // cuánto se abonó esta quincena en USD
  date: string;
}

export interface PeriodData {
  id: string;
  incomes: Income[];
  payments: Payment[];
  purchases: Purchase[];
  debtPayments: DebtPayment[];  // abonos a deudas en esta quincena
  /** Tasas al cerrar la quincena (para consulta histórica). */
  p2pRate: number | null;
  bcvRate: number | null;
}

/** Deuda global (no está ligada a ninguna quincena). */
export interface Debt {
  id: string;
  description: string;
  totalAmountUsd: number;  // monto original de la deuda en USD
  createdAt: string;
  paid: boolean;           // marcada manualmente como saldada
}

export interface FinanzasState {
  periods: PeriodData[];
  debts: Debt[];           // deudas globales
  p2pRate: number | null;
  p2pUpdatedAt: string | null;
  bcvRate: number | null;
  bcvUpdatedAt: string | null;
}

export const DEFAULT_STATE: FinanzasState = {
  periods: [],
  debts: [],
  p2pRate: null,
  p2pUpdatedAt: null,
  bcvRate: null,
  bcvUpdatedAt: null,
};
