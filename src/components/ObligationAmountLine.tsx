"use client";

import { bsToBcvUsd, toBsAtRate } from "@/lib/calc";
import { formatBcvUsd, formatBs, formatUsd } from "@/lib/format";
import type { Currency, RateType } from "@/lib/types";

type Props = {
  amount: number;
  currency: Currency;
  rateType: RateType;
  bcv: number | null;
  p2p: number | null;
};

/** Pagos/compras: monto en Bs o $ y equivalente en $ BCV para la cuenta. */
export function ObligationAmountLine({
  amount,
  currency,
  rateType,
  bcv,
  p2p,
}: Props) {
  const rate =
    rateType === "p2p" ? (p2p ?? 0) : (bcv ?? 0);
  const label = rateType === "p2p" ? "Binance P2P" : "BCV";
  const labelClass =
    rateType === "p2p" ? "text-sky-500/80" : "text-emerald-500/70";

  const bs = rate > 0 ? toBsAtRate(amount, currency, rate) : null;
  const bcvUsd =
    bs !== null && bcv && bcv > 0 ? bsToBcvUsd(bs, bcv) : null;

  return (
    <div className="text-right text-sm">
      {bcvUsd !== null && rateType === "bcv" ? (
        <p className="font-semibold text-emerald-300/90">
          {formatBcvUsd(bcvUsd)}
          <span className="text-[10px] text-emerald-600"> BCV</span>
        </p>
      ) : null}
      <p className="font-medium text-zinc-100">
        {currency === "USD" ? formatUsd(amount) : formatBs(amount)}
      </p>
      {bs !== null && currency === "USD" ? (
        <p className="text-xs text-zinc-500">≈ {formatBs(bs)}</p>
      ) : null}
      {rateType === "p2p" && bcvUsd !== null && bcv ? (
        <p className="text-xs text-zinc-500">
          ≈ {formatBcvUsd(bcvUsd)} en $ BCV
        </p>
      ) : null}
      <p className={`text-[10px] uppercase tracking-wide ${labelClass}`}>
        {label}
      </p>
    </div>
  );
}
