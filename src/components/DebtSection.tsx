"use client";

import { useState } from "react";
import { getDebtBalance } from "@/lib/calc";
import { formatUsd, formatBs } from "@/lib/format";
import { type Debt, type DebtPayment, type PeriodData } from "@/lib/types";
import { Button, Card, Input, Label } from "./ui";

type Props = {
  debts: Debt[];
  allPeriods: PeriodData[];
  /** Abonos de la quincena que se está viendo */
  currentDebtPayments: DebtPayment[];
  bcvRate: number | null;
  readOnly: boolean;
  onAddDebt: (description: string, totalAmountUsd: number) => void;
  onRemoveDebt: (id: string) => void;
  onToggleDebtPaid: (id: string) => void;
  onAddDebtPayment: (debtId: string, amountUsd: number) => void;
  onRemoveDebtPayment: (debtId: string) => void;
};

function DebtProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 100
      ? "bg-emerald-500"
      : clamped >= 60
        ? "bg-sky-500"
        : clamped >= 30
          ? "bg-amber-400"
          : "bg-red-500";

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

type DebtCardProps = {
  debt: Debt;
  balance: number;
  currentPayment: DebtPayment | undefined;
  bcvRate: number | null;
  readOnly: boolean;
  onRemove: () => void;
  onTogglePaid: () => void;
  onAddPayment: (amount: number) => void;
  onRemovePayment: () => void;
};

function DebtCard({
  debt,
  balance,
  currentPayment,
  bcvRate,
  readOnly,
  onRemove,
  onTogglePaid,
  onAddPayment,
  onRemovePayment,
}: DebtCardProps) {
  const [inputAmt, setInputAmt] = useState(
    currentPayment ? String(currentPayment.amountUsd) : ""
  );
  const [editing, setEditing] = useState(false);

  const paidPct =
    debt.totalAmountUsd > 0
      ? ((debt.totalAmountUsd - balance) / debt.totalAmountUsd) * 100
      : 100;

  const isSaldada = balance <= 0 || debt.paid;
  const balanceBs = bcvRate && bcvRate > 0 ? balance * bcvRate : null;

  function handleSavePayment() {
    const val = parseFloat(inputAmt.replace(",", "."));
    if (!isNaN(val) && val > 0) {
      onAddPayment(Math.min(val, balance));
      setEditing(false);
    }
  }

  return (
    <Card
      className={`transition-opacity ${isSaldada ? "opacity-60" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-zinc-100 truncate">
              {debt.description}
            </p>
            {isSaldada && (
              <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] text-emerald-400 shrink-0">
                ✓ Saldada
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Total original: {formatUsd(debt.totalAmountUsd)}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          {!isSaldada && (
            <button
              type="button"
              onClick={onTogglePaid}
              title="Marcar como saldada"
              className="rounded-lg px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-900/30 transition"
            >
              ✓
            </button>
          )}
          {isSaldada && debt.paid && (
            <button
              type="button"
              onClick={onTogglePaid}
              title="Desmarcar"
              className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 transition"
            >
              ↩
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            title="Eliminar deuda"
            className="rounded-lg px-2 py-1 text-xs text-red-400/70 hover:bg-red-900/30 hover:text-red-300 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Saldo restante */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Saldo restante
          </p>
          <p
            className={`text-xl font-bold ${isSaldada ? "text-emerald-400" : "text-amber-300"}`}
          >
            {formatUsd(balance)}
          </p>
          {balanceBs !== null && (
            <p className="text-xs text-zinc-500">{formatBs(balanceBs)}</p>
          )}
        </div>
        <p className="text-sm font-semibold text-zinc-400">
          {paidPct.toFixed(0)}%
        </p>
      </div>

      <DebtProgressBar pct={paidPct} />

      {/* Abono de esta quincena */}
      {!isSaldada && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">
            Abono esta quincena
          </p>

          {readOnly ? (
            // Vista de solo lectura
            currentPayment ? (
              <p className="text-sm text-sky-300">
                {formatUsd(currentPayment.amountUsd)} abonados
              </p>
            ) : (
              <p className="text-xs text-zinc-600">Sin abono registrado</p>
            )
          ) : editing || !currentPayment ? (
            // Formulario de edición
            <div className="flex gap-2">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00 USD"
                value={inputAmt}
                onChange={(e) => setInputAmt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSavePayment()}
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={handleSavePayment}
                className="shrink-0"
              >
                {currentPayment ? "Actualizar" : "Abonar"}
              </Button>
              {currentPayment && (
                <Button
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  className="shrink-0"
                >
                  Cancelar
                </Button>
              )}
            </div>
          ) : (
            // Muestra el abono con opción de editar/quitar
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-sky-300">
                  {formatUsd(currentPayment.amountUsd)}
                </span>
                <span className="ml-1 text-xs text-zinc-500">abonados</span>
                {bcvRate && bcvRate > 0 && (
                  <p className="text-xs text-zinc-600">
                    {formatBs(currentPayment.amountUsd * bcvRate)}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setInputAmt(String(currentPayment.amountUsd));
                    setEditing(true);
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={onRemovePayment}
                  className="rounded-lg px-2 py-1 text-xs text-red-400/70 hover:bg-red-900/30 transition"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Formulario nueva deuda ────────────────────────────────────────────────────

function AddDebtForm({ onAdd }: { onAdd: (desc: string, amt: number) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");

  function handleSubmit() {
    const val = parseFloat(amt.replace(",", "."));
    if (!desc.trim() || isNaN(val) || val <= 0) return;
    onAdd(desc, val);
    setDesc("");
    setAmt("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition"
      >
        <span className="text-lg leading-none">＋</span>
        Nueva deuda
      </button>
    );
  }

  return (
    <Card className="border-zinc-700">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Nueva deuda
      </p>
      <div className="space-y-3">
        <div>
          <Label>Descripción</Label>
          <Input
            type="text"
            placeholder="Ej: Préstamo banco, tarjeta…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div>
          <Label>Monto total (USD)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            Crear deuda
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DebtSection({
  debts,
  allPeriods,
  currentDebtPayments,
  bcvRate,
  readOnly,
  onAddDebt,
  onRemoveDebt,
  onToggleDebtPaid,
  onAddDebtPayment,
  onRemoveDebtPayment,
}: Props) {
  const activeDebts = debts.filter((d) => !d.paid && getDebtBalance(d, allPeriods) > 0);
  const settledDebts = debts.filter((d) => d.paid || getDebtBalance(d, allPeriods) <= 0);

  const totalBalance = activeDebts.reduce(
    (sum, d) => sum + getDebtBalance(d, allPeriods),
    0
  );
  const totalBalanceBs =
    bcvRate && bcvRate > 0 ? totalBalance * bcvRate : null;

  return (
    <div className="space-y-3">
      {/* Resumen de deudas activas */}
      {activeDebts.length > 0 && (
        <Card className="border-red-900/40 bg-gradient-to-br from-red-950/30 to-zinc-900/80">
          <p className="text-xs uppercase tracking-wide text-red-400/80">
            Deuda total pendiente
          </p>
          <p className="mt-1 text-2xl font-bold text-red-300">
            {formatUsd(totalBalance)}
          </p>
          {totalBalanceBs !== null && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {formatBs(totalBalanceBs)}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-600">
            {activeDebts.length} deuda{activeDebts.length !== 1 ? "s" : ""} activa
            {activeDebts.length !== 1 ? "s" : ""}
          </p>
        </Card>
      )}

      {debts.length === 0 && (
        <p className="px-1 text-sm text-zinc-600">
          No tienes deudas registradas.
        </p>
      )}

      {/* Deudas activas */}
      {activeDebts.map((debt) => {
        const balance = getDebtBalance(debt, allPeriods);
        const currentPayment = currentDebtPayments.find(
          (dp) => dp.debtId === debt.id
        );
        return (
          <DebtCard
            key={debt.id}
            debt={debt}
            balance={balance}
            currentPayment={currentPayment}
            bcvRate={bcvRate}
            readOnly={readOnly}
            onRemove={() => onRemoveDebt(debt.id)}
            onTogglePaid={() => onToggleDebtPaid(debt.id)}
            onAddPayment={(amt) => onAddDebtPayment(debt.id, amt)}
            onRemovePayment={() => onRemoveDebtPayment(debt.id)}
          />
        );
      })}

      {/* Nueva deuda (solo en quincena activa) */}
      {!readOnly && <AddDebtForm onAdd={onAddDebt} />}

      {/* Deudas saldadas */}
      {settledDebts.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none list-none px-1 text-xs text-zinc-600 hover:text-zinc-400 transition">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>
            {" "}{settledDebts.length} deuda{settledDebts.length !== 1 ? "s" : ""} saldada
            {settledDebts.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {settledDebts.map((debt) => {
              const balance = getDebtBalance(debt, allPeriods);
              const currentPayment = currentDebtPayments.find(
                (dp) => dp.debtId === debt.id
              );
              return (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  balance={balance}
                  currentPayment={currentPayment}
                  bcvRate={bcvRate}
                  readOnly={readOnly}
                  onRemove={() => onRemoveDebt(debt.id)}
                  onTogglePaid={() => onToggleDebtPaid(debt.id)}
                  onAddPayment={(amt) => onAddDebtPayment(debt.id, amt)}
                  onRemovePayment={() => onRemoveDebtPayment(debt.id)}
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
