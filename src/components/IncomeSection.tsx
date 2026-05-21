"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { Income } from "@/lib/types";
import { IncomeBreakdown } from "./IncomeBreakdown";
import { Card, Button, Input, Label } from "./ui";

type Props = {
  incomes: Income[];
  bcv: number | null;
  p2p: number | null;
  readOnly?: boolean;
  onAdd: (amount: number, note: string) => void;
  onRemove: (id: string) => void;
};

export function IncomeSection({
  incomes,
  bcv,
  p2p,
  readOnly,
  onAdd,
  onRemove,
}: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    onAdd(n, note);
    setAmount("");
    setNote("");
  }

  const previewUsdt =
    amount && parseFloat(amount) > 0 ? parseFloat(amount) : null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-zinc-200">
        Lo que ganas en Binance (USDT)
      </h2>
      <p className="mb-4 text-xs text-zinc-500">
        $ de Binance → Bs (P2P) → $ BCV para tu cuenta.
      </p>

      {!readOnly ? (
        <>
          <form
            onSubmit={handleSubmit}
            className="mb-4 grid gap-3 sm:grid-cols-3"
          >
            <div>
              <Label>$ USDT en Binance</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="150"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Nota (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Venta P2P"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button type="submit" className="shrink-0">
                  Agregar
                </Button>
              </div>
            </div>
          </form>
          {previewUsdt ? (
            <div className="mb-4">
              <IncomeBreakdown usdt={previewUsdt} bcv={bcv} p2p={p2p} />
            </div>
          ) : null}
        </>
      ) : (
        <p className="mb-4 text-xs text-zinc-600 italic">
          Quincena cerrada — no se pueden agregar ingresos.
        </p>
      )}

      <ul className="space-y-3">
        {incomes.length === 0 ? (
          <li className="text-sm text-zinc-500">Sin ingresos en esta quincena.</li>
        ) : (
          incomes.map((i) => (
            <li
              key={i.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">{i.note}</p>
                <p className="text-xs text-zinc-600">{formatDate(i.date)}</p>
                <div className="mt-2">
                  <IncomeBreakdown usdt={i.amountUsd} bcv={bcv} p2p={p2p} />
                </div>
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => onRemove(i.id)}
                  className="shrink-0 text-xs text-zinc-500 hover:text-red-400"
                >
                  Eliminar
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
