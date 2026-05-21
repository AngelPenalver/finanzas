"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { Currency, Purchase } from "@/lib/types";
import { ObligationAmountLine } from "./ObligationAmountLine";
import { Card, Button, Input, Label, Select } from "./ui";

type Props = {
  purchases: Purchase[];
  bcv: number | null;
  p2p: number | null;
  readOnly?: boolean;
  onAdd: (desc: string, amount: number, currency: Currency) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function PurchasesSection({
  purchases,
  bcv,
  p2p,
  readOnly,
  onAdd,
  onToggle,
  onRemove,
}: Props) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!desc.trim() || !n || n <= 0) return;
    onAdd(desc, n, currency);
    setDesc("");
    setAmount("");
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-zinc-200">
        Lista de compras
      </h2>
      <p className="mb-3 text-xs text-zinc-500">
        Presupuesto a <strong className="text-emerald-500/80">tasa BCV</strong>.
      </p>

      {!readOnly ? (
        <form onSubmit={handleSubmit} className="mb-4 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>Qué comprar</Label>
            <Input
              required
              placeholder="Arroz, gasolina..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div>
            <Label>Presupuesto</Label>
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
            <div className="flex gap-2">
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="USD">USD</option>
                <option value="BS">Bs</option>
              </Select>
              <Button type="submit" className="shrink-0">
                +
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mb-4 text-xs text-zinc-600 italic">
          Quincena cerrada — solo consulta.
        </p>
      )}

      <ul className="space-y-2">
        {purchases.length === 0 ? (
          <li className="text-sm text-zinc-500">Sin ítems en esta quincena.</li>
        ) : (
          purchases.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                p.bought
                  ? "border-zinc-800/50 bg-zinc-950/30 opacity-50"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <label
                className={`flex flex-1 items-center gap-3 ${readOnly ? "" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={p.bought}
                  disabled={readOnly}
                  onChange={() => onToggle(p.id)}
                  className="h-4 w-4 rounded accent-emerald-500 disabled:opacity-50"
                />
                <div>
                  <p
                    className={`text-sm ${p.bought ? "line-through text-zinc-500" : "text-zinc-200"}`}
                  >
                    {p.description}
                  </p>
                  <p className="text-xs text-zinc-600">{formatDate(p.date)}</p>
                </div>
              </label>
              <ObligationAmountLine
                amount={p.amount}
                currency={p.currency}
                rateType="bcv"
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
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
