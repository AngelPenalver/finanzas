import type {
  Currency,
  Debt,
  DebtPayment,
  Payment,
  PeriodData,
  Purchase,
  RateType,
} from "./types";

export type CalcInput = {
  incomes: PeriodData["incomes"];
  payments: Payment[];
  purchases: Purchase[];
  debtPayments: DebtPayment[];  // abonos de esta quincena
  p2pRate: number | null;
  bcvRate: number | null;
};

/**
 * Calcula el saldo restante de una deuda sumando todos los abonos
 * registrados en todos los períodos históricos.
 */
export function getDebtBalance(
  debt: Debt,
  allPeriods: PeriodData[]
): number {
  const totalPaid = allPeriods.reduce((sum, period) => {
    return (
      sum +
      (period.debtPayments ?? []).reduce((s, dp) => {
        return dp.debtId === debt.id ? s + dp.amountUsd : s;
      }, 0)
    );
  }, 0);
  return Math.max(0, debt.totalAmountUsd - totalPaid);
}

/** Bolívares según cada tasa (null si falta la tasa). Solo para ingresos USDT. */
export type DualBs = { p2p: number | null; bcv: number | null };

export function usdtToBsDual(
  usdt: number,
  bcv: number | null,
  p2p: number | null
): DualBs {
  return {
    p2p: p2p && p2p > 0 ? usdt * p2p : null,
    bcv: bcv && bcv > 0 ? usdt * bcv : null,
  };
}

export function toUsdAtRate(
  amount: number,
  currency: Currency,
  rate: number
): number {
  if (currency === "USD") return amount;
  if (!rate || rate <= 0) return 0;
  return amount / rate;
}

export function toBsAtRate(
  amount: number,
  currency: Currency,
  rate: number
): number {
  if (currency === "BS") return amount;
  if (!rate || rate <= 0) return 0;
  return amount * rate;
}

type ObligationItem = {
  amount: number;
  currency: Currency;
  rateType: RateType;
};

function sumObligations(
  items: ObligationItem[],
  bcv: number,
  p2p: number
): {
  usdTotal: number;
  bsTotal: number;
  usdBcvOnly: number;
  usdP2pOnly: number;
  bsBcvOnly: number;
  bsP2pOnly: number;
} {
  return items.reduce(
    (acc, item) => {
      const rate =
        item.rateType === "p2p"
          ? p2p > 0
            ? p2p
            : 0
          : bcv > 0
            ? bcv
            : 0;
      if (!rate) return acc;

      const usd = toUsdAtRate(item.amount, item.currency, rate);
      const bs = toBsAtRate(item.amount, item.currency, rate);

      acc.usdTotal += usd;
      acc.bsTotal += bs;

      if (item.rateType === "p2p") {
        acc.usdP2pOnly += usd;
        acc.bsP2pOnly += bs;
      } else {
        acc.usdBcvOnly += usd;
        acc.bsBcvOnly += bs;
      }
      return acc;
    },
    {
      usdTotal: 0,
      bsTotal: 0,
      usdBcvOnly: 0,
      usdP2pOnly: 0,
      bsBcvOnly: 0,
      bsP2pOnly: 0,
    }
  );
}

/** $ a tasa BCV: bolívares ÷ BCV (unidad para llevar la cuenta). */
export function bsToBcvUsd(bs: number, bcv: number): number | null {
  if (!bcv || bcv <= 0) return null;
  return bs / bcv;
}

export function sumIncomes(incomes: CalcInput["incomes"]): number {
  return incomes.reduce((s, i) => s + i.amountUsd, 0);
}

export function sumPayments(
  items: Payment[],
  paid: boolean | null,
  bcv: number,
  p2p: number
) {
  const filtered =
    paid === null ? items : items.filter((p) => p.paid === paid);
  return sumObligations(filtered, bcv, p2p);
}

export function sumPurchases(
  items: Purchase[],
  bought: boolean | null,
  bcv: number,
  p2p: number
) {
  const filtered =
    bought === null ? items : items.filter((p) => p.bought === bought);
  return sumObligations(filtered, bcv, p2p);
}

export function getSummary(input: CalcInput) {
  const bcv = input.bcvRate ?? 0;
  const p2p = input.p2pRate ?? 0;
  const totalIncome = sumIncomes(input.incomes);
  const incomeBs = usdtToBsDual(totalIncome, bcv || null, p2p || null);

  const pendingPayments = sumPayments(input.payments, false, bcv, p2p);
  const pendingPurchases = sumPurchases(input.purchases, false, bcv, p2p);

  // Abonos a deudas de esta quincena (en Bs a tasa BCV)
  const totalDebtPaymentsUsd = (input.debtPayments ?? []).reduce(
    (s, dp) => s + dp.amountUsd,
    0
  );
  const totalDebtPaymentsBs = bcv > 0 ? totalDebtPaymentsUsd * bcv : 0;

  const obligationsBs =
    pendingPayments.bsTotal +
    pendingPurchases.bsTotal +
    totalDebtPaymentsBs;
  const obligationsBsBcv =
    pendingPayments.bsBcvOnly + pendingPurchases.bsBcvOnly;
  const obligationsBsP2p =
    pendingPayments.bsP2pOnly + pendingPurchases.bsP2pOnly;

  const availableBs =
    incomeBs.p2p !== null ? incomeBs.p2p - obligationsBs : null;

  const wealthBcvUsd =
    incomeBs.p2p !== null && bcv > 0 ? bsToBcvUsd(incomeBs.p2p, bcv) : null;
  const obligationsBcvUsd =
    bcv > 0 ? bsToBcvUsd(obligationsBs, bcv) : null;
  const availableBcvUsd =
    availableBs !== null && bcv > 0 ? bsToBcvUsd(availableBs, bcv) : null;

  const spreadPct =
    bcv > 0 && p2p > 0 ? ((p2p - bcv) / bcv) * 100 : null;

  const pendingP2pCount = input.payments.filter(
    (p) => !p.paid && p.rateType === "p2p"
  ).length;

  return {
    totalIncomeUsdt: totalIncome,
    incomeBs,
    pendingPayments,
    pendingPurchases,
    obligationsBs,
    obligationsBcvUsd,
    obligationsBsBcv,
    obligationsBsP2p,
    wealthBcvUsd,
    availableBs,
    availableBcvUsd,
    spreadPct,
    hasP2p: p2p > 0,
    hasBcv: bcv > 0,
    pendingP2pCount,
    totalDebtPaymentsUsd,
    totalDebtPaymentsBs,
  };
}
