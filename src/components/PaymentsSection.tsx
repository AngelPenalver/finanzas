"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { Currency, Payment, RateType } from "@/lib/types";
import { ObligationAmountLine } from "./ObligationAmountLine";
import { Card, Button, Input, Label, Select } from "./ui";

type Props = {
  payments: Payment[];
  bcv: number | null;
  p2p: number | null;
  readOnly?: boolean;
  onAdd: (
    desc: string,
    amount: number,
    currency: Currency,
    rateType: RateType
  ) => void;
  onToggle: (id: string) => void;
  onToggleRate: (id: string) => void;
  onRemove: (id: string) => void;
};

export function PaymentsSection({
  payments,
  bcv,
  p2p,
  readOnly,
  onAdd,
  onToggle,
  onToggleRate,
  onRemove,
}: Props) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isQuincena, setIsQuincena] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!desc.trim() || !n || n <= 0) return;
    const rateType: RateType =
      isQuincena || /quincena/i.test(desc) ? "p2p" : "bcv";
    onAdd(desc, n, currency, rateType);
    setDesc("");
    setAmount("");
    setIsQuincena(false);
  }

  const pending = payments.filter((p) => !p.paid);
  const paid = payments.filter((p) => p.paid);

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-zinc-200">Pagos</h2>
      <p className="mb-3 text-xs text-zinc-500">
        Montos a <strong className="text-emerald-500/80">tasa BCV</strong>. La
        quincena en P2P si aplica.
      </p>

      {!readOnly ? (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label>Qué pagar</Label>
              <Input
                required
                placeholder="Alquiler, internet, quincena..."
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  if (/quincena/i.test(e.target.value)) setIsQuincena(true);
                }}
              />
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="USD">USD</option>
                <option value="BS">Bs</option>
              </Select>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isQuincena}
              onChange={(e) => setIsQuincena(e.target.checked)}
              className="h-4 w-4 rounded accent-sky-500"
            />
            Es mi quincena (tasa Binance P2P)
          </label>
          <Button type="submit" className="w-full sm:w-auto">
            Agregar pago
          </Button>
        </form>
      ) : (
        <p className="mb-4 text-xs text-zinc-600 italic">
          Quincena cerrada — solo consulta.
        </p>
      )}

      <SectionList
        title={`Pendientes (${pending.length})`}
        items={pending}
        bcv={bcv}
        p2p={p2p}
        readOnly={readOnly}
        onToggle={onToggle}
        onToggleRate={onToggleRate}
        onRemove={onRemove}
      />
      {paid.length > 0 ? (
        <div className="mt-4 opacity-60">
          <SectionList
            title={`Pagados (${paid.length})`}
            items={paid}
            bcv={bcv}
            p2p={p2p}
            readOnly={readOnly}
            onToggle={onToggle}
            onToggleRate={onToggleRate}
            onRemove={onRemove}
          />
        </div>
      ) : null}
    </Card>
  );
}

function SectionList({
  title,
  items,
  bcv,
  p2p,
  readOnly,
  onToggle,
  onToggleRate,
  onRemove,
}: {
  title: string;
  items: Payment[];
  bcv: number | null;
  p2p: number | null;
  readOnly?: boolean;
  onToggle: (id: string) => void;
  onToggleRate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase text-zinc-500">{title}</p>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-zinc-600">Nada aquí.</li>
        ) : (
          items.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2.5"
            >
              <label
                className={`flex flex-1 items-center gap-3 ${readOnly ? "" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={p.paid}
                  disabled={readOnly}
                  onChange={() => onToggle(p.id)}
                  className="h-4 w-4 rounded border-zinc-600 accent-emerald-500 disabled:opacity-50"
                />
                <div>
                  <p
                    className={`text-sm ${p.paid ? "line-through text-zinc-500" : "text-zinc-200"}`}
                  >
                    {p.description}
                  </p>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleRate(p.id);
                      }}
                      className={`mt-0.5 text-[10px] uppercase tracking-wide underline-offset-2 hover:underline ${
                        p.rateType === "p2p"
                          ? "text-sky-400"
                          : "text-emerald-500/80"
                      }`}
                    >
                      {p.rateType === "p2p" ? "Binance P2P" : "BCV"} — cambiar
                    </button>
                  ) : (
                    <p
                      className={`mt-0.5 text-[10px] uppercase ${
                        p.rateType === "p2p"
                          ? "text-sky-500/70"
                          : "text-emerald-500/60"
                      }`}
                    >
                      {p.rateType === "p2p" ? "Binance P2P" : "BCV"}
                    </p>
                  )}
                  <p className="text-xs text-zinc-600">{formatDate(p.date)}</p>
                </div>
              </label>
              <div className="flex items-center gap-3">
                <ObligationAmountLine
                  amount={p.amount}
                  currency={p.currency}
                  rateType={p.rateType}
                  bcv={bcv}
                  p2p={p2p}
                />
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
