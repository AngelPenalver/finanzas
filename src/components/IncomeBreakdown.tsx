"use client";

import { bsToBcvUsd, usdtToBsDual } from "@/lib/calc";
import { formatBcvUsd, formatBs, formatUsd } from "@/lib/format";

type Props = {
  usdt: number;
  bcv: number | null;
  p2p: number | null;
  compact?: boolean;
};

/**
 * USDT Binance → Bs P2P → $ BCV para llevar la cuenta (Bs ÷ tasa BCV).
 */
export function IncomeBreakdown({ usdt, bcv, p2p, compact }: Props) {
  const dual = usdtToBsDual(usdt, bcv, p2p);
  const cuentaBcv =
    dual.p2p !== null && bcv ? bsToBcvUsd(dual.p2p, bcv) : null;

  if (compact) {
    return (
      <div className="text-right">
        {cuentaBcv !== null ? (
          <p className="text-sm font-semibold text-emerald-300">
            {formatBcvUsd(cuentaBcv)}
            <span className="text-[10px] text-emerald-600"> BCV</span>
          </p>
        ) : null}
        {dual.p2p !== null ? (
          <p className="text-xs text-sky-400/90">{formatBs(dual.p2p)} P2P</p>
        ) : null}
        <p className="text-xs text-zinc-500">{formatUsd(usdt)} Binance</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-900/40 bg-sky-950/25 p-3 text-sm">
      <p className="text-xs text-zinc-500">
        Vendes en Binance:{" "}
        <span className="font-medium text-zinc-200">{formatUsd(usdt)} USDT</span>
      </p>
      {dual.p2p !== null ? (
        <p className="mt-2 text-base font-semibold text-sky-300">
          Te dan {formatBs(dual.p2p)}
          <span className="ml-1 text-xs font-normal text-sky-500/70">(P2P)</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-amber-400/90">Falta tasa P2P</p>
      )}
      {cuentaBcv !== null ? (
        <p className="mt-3 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-2 py-2">
          <span className="text-xs text-emerald-500/80">Para tu cuenta</span>
          <span className="mt-0.5 block text-xl font-bold text-emerald-300">
            {formatBcvUsd(cuentaBcv)}
            <span className="text-sm font-normal text-emerald-500/70">
              {" "}
              a $ BCV
            </span>
          </span>
          <span className="mt-1 block text-[10px] text-zinc-500">
            {formatBs(dual.p2p!)} ÷ BCV — no son {formatUsd(usdt)} USDT en libros
          </span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-600">Falta tasa BCV</p>
      )}
    </div>
  );
}
