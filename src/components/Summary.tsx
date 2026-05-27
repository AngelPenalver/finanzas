"use client";

import { getSummary, type CalcInput } from "@/lib/calc";
import { formatBcvUsd, formatBs, formatUsd } from "@/lib/format";
import { formatPeriodLabel, isPeriodLocked } from "@/lib/period";
import { Card } from "./ui";

type Props = {
  periodId: string;
  data: CalcInput;
};

export function Summary({ periodId, data }: Props) {
  const s = getSummary(data);
  const locked = isPeriodLocked(periodId);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-zinc-500">{formatPeriodLabel(periodId)}</p>
        {locked ? (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
            🔒 Cerrada
          </span>
        ) : (
          <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] text-emerald-400">
            En curso
          </span>
        )}
      </div>

      <Card className="sm:col-span-2 border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-zinc-900/80">
        <p className="text-xs uppercase tracking-wide text-emerald-400/80">
          Tienes (a $ BCV)
        </p>
        {s.wealthBcvUsd !== null ? (
          <p className="mt-1 text-3xl font-bold text-emerald-300">
            {formatBcvUsd(s.wealthBcvUsd)}
            <span className="ml-1 text-sm font-normal text-emerald-500/70">
              BCV
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-400/90">
            Configura tasas P2P y BCV
          </p>
        )}
        {s.incomeBs.p2p !== null ? (
          <p className="mt-1 text-sm text-sky-300/90">
            {formatBs(s.incomeBs.p2p)} recibidos en P2P
          </p>
        ) : null}
        <p className="mt-1 text-xs text-zinc-500">
          Vendiste {formatUsd(s.totalIncomeUsdt)} USDT en Binance
        </p>
      </Card>

      <Card>
        <p className="text-xs uppercase text-zinc-500">Por pagar y comprar</p>
        <p className="mt-0.5 text-[10px] text-emerald-500/70">A tasa BCV</p>
        {s.obligationsBcvUsd !== null ? (
          <>
            <p className="mt-2 text-xl font-semibold text-amber-300">
              {formatBcvUsd(s.obligationsBcvUsd)}
              <span className="ml-1 text-xs font-normal text-amber-500/60">
                BCV
              </span>
            </p>
            <p className="text-sm text-zinc-500">{formatBs(s.obligationsBs)}</p>
            {s.totalDebtPaymentsUsd > 0 && (
              <p className="mt-1 text-xs text-red-400/80">
                incl. {formatUsd(s.totalDebtPaymentsUsd)} en abonos de deudas
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-amber-400/90">Configura tasa BCV</p>
        )}
        <p className="mt-2 text-xs text-zinc-600">
          {data.payments.filter((p) => !p.paid).length} pagos +{" "}
          {data.purchases.filter((p) => !p.bought).length} compras
          {(data.debtPayments ?? []).length > 0 &&
            ` + ${data.debtPayments.length} abono${data.debtPayments.length !== 1 ? "s" : ""} a deudas`}
        </p>
      </Card>

      <Card className="border-emerald-900/40">
        <p className="text-xs uppercase text-zinc-500">Te queda</p>
        <p className="mt-0.5 text-[10px] text-emerald-500/70">En $ BCV</p>
        {s.availableBcvUsd !== null ? (
          <>
            <p
              className={`mt-1 text-2xl font-bold ${
                s.availableBcvUsd >= 0 ? "text-emerald-300" : "text-red-400"
              }`}
            >
              {formatBcvUsd(s.availableBcvUsd)}
              <span className="text-sm font-normal text-emerald-500/70">
                {" "}
                BCV
              </span>
            </p>
            {s.availableBs !== null ? (
              <p className="text-sm text-zinc-400">{formatBs(s.availableBs)}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-amber-400/90">Configura tasas</p>
        )}
      </Card>
    </div>
  );
}
