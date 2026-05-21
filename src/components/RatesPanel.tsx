"use client";

import { formatBs, formatDate, formatRate } from "@/lib/format";
import { Card, Button, Input, Label } from "./ui";

type Props = {
  bcv: number | null;
  p2p: number | null;
  bcvUpdatedAt: string | null;
  p2pUpdatedAt: string | null;
  readOnly?: boolean;
  bcvLoading: boolean;
  bcvError: string | null;
  p2pLoading: boolean;
  p2pError: string | null;
  onFetchBcv: () => void;
  onFetchP2p: () => void;
  onP2pChange: (rate: number | null) => void;
  onBcvManual: (rate: number | null) => void;
};

export function RatesPanel({
  bcv,
  p2p,
  bcvUpdatedAt,
  p2pUpdatedAt,
  readOnly,
  bcvLoading,
  bcvError,
  p2pLoading,
  p2pError,
  onFetchBcv,
  onFetchP2p,
  onP2pChange,
  onBcvManual,
}: Props) {
  const spread =
    bcv && p2p && bcv > 0 && p2p > bcv
      ? (((p2p - bcv) / bcv) * 100).toFixed(0)
      : null;
  const extraPer100 =
    bcv && p2p && p2p > bcv ? formatBs((p2p - bcv) * 100) : null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-zinc-200">
        Tasas {readOnly ? "(consulta)" : "de la quincena actual"}
      </h2>
      {readOnly ? (
        <p className="mb-3 text-xs text-amber-400/80">
          Quincena cerrada: se muestran las tasas guardadas al cerrar.
        </p>
      ) : null}
      <p className="mb-3 text-xs leading-relaxed text-zinc-500">
        <strong className="text-sky-300">P2P</strong>: cuánto te dan los $ de
        Binance. <strong className="text-emerald-400/80">BCV</strong>: cuánto
        serían esos mismos $ oficiales + todos los pagos y compras.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="order-1 rounded-xl border border-sky-800/60 bg-sky-950/30 p-3 sm:order-1">
          <Label>P2P Binance — Bs por 1 USDT (más alto)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 710"
              value={p2p ?? ""}
              disabled={readOnly}
              onChange={(e) =>
                onP2pChange(e.target.value ? Number(e.target.value) : null)
              }
            />
            <Button
              type="button"
              variant="ghost"
              onClick={onFetchP2p}
              disabled={p2pLoading || readOnly}
              className="shrink-0 whitespace-nowrap"
            >
              {p2pLoading ? "..." : "Ref."}
            </Button>
          </div>
          {p2pUpdatedAt && !readOnly ? (
            <p className="mt-1 text-xs text-zinc-500">
              Ref. mercado: {formatDate(p2pUpdatedAt)} — corrige con tu
              precio exacto del anuncio Binance
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">
              Pon el precio de tu venta P2P (suele ser 700+ Bs/USDT)
            </p>
          )}
          {p2pError ? (
            <p className="mt-1 text-xs text-red-400">{p2pError}</p>
          ) : null}
          {p2p ? (
            <p className="mt-1 text-sm font-medium text-sky-300">
              {formatRate(p2p)}
            </p>
          ) : null}
        </div>

        <div className="order-2 rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-3 sm:order-2">
          <Label>BCV oficial — Bs por 1 USD (más bajo)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 521"
              value={bcv ?? ""}
              disabled={readOnly}
              onChange={(e) =>
                onBcvManual(e.target.value ? Number(e.target.value) : null)
              }
            />
            <Button
              type="button"
              variant="ghost"
              onClick={onFetchBcv}
              disabled={bcvLoading || readOnly}
              className="shrink-0 whitespace-nowrap"
            >
              {bcvLoading ? "..." : "BCV"}
            </Button>
          </div>
          {bcvUpdatedAt && !readOnly ? (
            <p className="mt-1 text-xs text-zinc-500">
              Actualizado: {formatDate(bcvUpdatedAt)}
            </p>
          ) : null}
          {bcvError ? (
            <p className="mt-1 text-xs text-red-400">{bcvError}</p>
          ) : null}
          {bcv ? (
            <p className="mt-1 text-sm text-emerald-500/80">{formatRate(bcv)}</p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-600">
            Solo referencia legal; no es lo que te paga Binance P2P.
          </p>
        </div>
      </div>

      {bcv && p2p && p2p > bcv ? (
        <div className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm">
          <div className="flex items-end justify-between gap-2 text-xs text-zinc-500">
            <span>BCV {formatRate(bcv)}</span>
            <span className="text-sky-400">P2P {formatRate(p2p)}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="bg-emerald-700/80"
              style={{ width: `${(bcv / p2p) * 100}%` }}
            />
            <div className="flex-1 bg-sky-500" />
          </div>
          <p className="text-zinc-300">
            100 USDT en Binance P2P →{" "}
            <span className="font-semibold text-sky-300">
              {formatBs(100 * p2p)}
            </span>
          </p>
          <p className="text-zinc-500">
            Mismo monto solo a valor BCV → {formatBs(100 * bcv)}
            {extraPer100 ? (
              <span className="text-sky-400/90">
                {" "}
                (te faltarían {extraPer100} vs P2P)
              </span>
            ) : null}
          </p>
          {spread ? (
            <p className="text-xs text-amber-400/90">
              El P2P está ~{spread}% por encima del BCV — por eso tus ingresos
              en Bs son mayores usando la tasa P2P.
            </p>
          ) : null}
        </div>
      ) : bcv && p2p && p2p <= bcv ? (
        <p className="mt-3 text-xs text-amber-400">
          El P2P que ingresaste ({formatRate(p2p)}) no es mayor que el BCV (
          {formatRate(bcv)}). Revisa: en Binance P2P suele ser 700+ y BCV ~520.
        </p>
      ) : null}
    </Card>
  );
}
