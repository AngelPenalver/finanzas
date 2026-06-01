"use client";

import { useState } from "react";
import { getDebtBalance } from "@/lib/calc";
import { formatUsd, formatBs } from "@/lib/format";
import { type Debt, type DebtPayment, type PeriodData } from "@/lib/types";
import { Button, Card, Input, Label } from "./ui";

type Props = {
  debts: Debt[];
  allPeriods: PeriodData[];
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

// ── Card de deuda con abono siempre visible ───────────────────────────────────

type DebtCardProps = {
  debt: Debt;
  balance: number;
  currentPayment: DebtPayment | undefined;
  bcvRate: number | null;
  readOnly: boolean;
  onRemove: () => void;
  onTogglePaid: () => void;
  onSavePayment: (amount: number) => void;
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
  onSavePayment,
  onRemovePayment,
}: DebtCardProps) {
  // El input siempre muestra el abono registrado (o vacío si no hay)
  const [inputAmt, setInputAmt] = useState(
    currentPayment ? String(currentPayment.amountUsd) : ""
  );

  const paidPct =
    debt.totalAmountUsd > 0
      ? ((debt.totalAmountUsd - balance) / debt.totalAmountUsd) * 100
      : 100;

  const isSaldada = balance <= 0 || debt.paid;
  const balanceBs = bcvRate && bcvRate > 0 ? balance * bcvRate : null;

  const abonoNum = parseFloat(inputAmt.replace(",", "."));
  const abonoValido = !isNaN(abonoNum) && abonoNum > 0;
  const abonoBs =
    abonoValido && bcvRate && bcvRate > 0 ? abonoNum * bcvRate : null;

  // ¿El valor del input es distinto al guardado?
  const changed =
    abonoValido &&
    (currentPayment === undefined || currentPayment.amountUsd !== abonoNum);

  function handleGuardar() {
    if (!abonoValido) return;
    onSavePayment(Math.min(abonoNum, balance));
  }

  function handleQuitar() {
    setInputAmt("");
    onRemovePayment();
  }

  return (
    <Card className={isSaldada ? "opacity-60" : ""}>
      {/* Cabecera: nombre + acciones */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-zinc-100">
              {debt.description}
            </p>
            {isSaldada && (
              <span className="shrink-0 rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] text-emerald-400">
                ✓ Saldada
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Deuda original: {formatUsd(debt.totalAmountUsd)}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          {!isSaldada && (
            <button
              type="button"
              onClick={onTogglePaid}
              title="Marcar como saldada"
              className="rounded-lg px-2 py-1 text-xs text-emerald-400 transition hover:bg-emerald-900/30"
            >
              ✓
            </button>
          )}
          {isSaldada && debt.paid && (
            <button
              type="button"
              onClick={onTogglePaid}
              title="Reactivar deuda"
              className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-800"
            >
              ↩
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            title="Eliminar deuda"
            className="rounded-lg px-2 py-1 text-xs text-red-400/70 transition hover:bg-red-900/30 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Saldo restante + barra */}
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

      {/* ── Sección de abono ── */}
      {!isSaldada && (
        <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-800/40 p-3">
          <p className="mb-2 text-sm font-medium text-zinc-300">
            ¿Cuánto abonará a esta deuda esta quincena?
          </p>

          {readOnly ? (
            // Solo lectura: muestra lo que se abonó en esa quincena
            currentPayment ? (
              <div>
                <p className="text-base font-semibold text-sky-300">
                  {formatUsd(currentPayment.amountUsd)}{" "}
                  <span className="text-xs font-normal text-zinc-500">
                    abonados
                  </span>
                </p>
                {bcvRate && bcvRate > 0 && (
                  <p className="text-xs text-zinc-600">
                    {formatBs(currentPayment.amountUsd * bcvRate)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Sin abono en esta quincena</p>
            )
          ) : (
            // Editable: input siempre visible
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00 USD"
                  value={inputAmt}
                  onChange={(e) => setInputAmt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
                />
                <Button
                  variant="primary"
                  onClick={handleGuardar}
                  disabled={!abonoValido || !changed}
                  className="shrink-0"
                >
                  {currentPayment ? "Actualizar" : "Abonar"}
                </Button>
                {currentPayment && (
                  <button
                    type="button"
                    onClick={handleQuitar}
                    className="shrink-0 rounded-xl px-3 text-xs text-red-400/70 transition hover:bg-red-900/30"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {/* Preview en Bs */}
              {abonoBs !== null && (
                <p className="text-xs text-zinc-500">
                  = {formatBs(abonoBs)} a tasa BCV · saldrá de tu balance esta quincena
                </p>
              )}

              {/* Indicador si ya hay abono guardado */}
              {currentPayment && !changed && (
                <p className="text-xs text-emerald-500/80">
                  ✓ Abono registrado: {formatUsd(currentPayment.amountUsd)}
                </p>
              )}
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
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
  const activeDebts = debts.filter(
    (d) => !d.paid && getDebtBalance(d, allPeriods) > 0
  );
  const settledDebts = debts.filter(
    (d) => d.paid || getDebtBalance(d, allPeriods) <= 0
  );

  const totalBalance = activeDebts.reduce(
    (sum, d) => sum + getDebtBalance(d, allPeriods),
    0
  );
  const totalBalanceBs = bcvRate && bcvRate > 0 ? totalBalance * bcvRate : null;

  const totalAbonoEstaQuincena = currentDebtPayments.reduce(
    (s, dp) => s + dp.amountUsd,
    0
  );

  return (
    <div className="space-y-3">
      {/* Resumen global */}
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
          <div className="mt-2 flex items-center gap-3">
            <p className="text-xs text-zinc-600">
              {activeDebts.length} deuda{activeDebts.length !== 1 ? "s" : ""} activa
              {activeDebts.length !== 1 ? "s" : ""}
            </p>
            {totalAbonoEstaQuincena > 0 && (
              <p className="text-xs text-sky-400">
                · {formatUsd(totalAbonoEstaQuincena)} abonados esta quincena
              </p>
            )}
          </div>
        </Card>
      )}

      {debts.length === 0 && (
        <p className="px-1 text-sm text-zinc-600">
          No tienes deudas registradas.
        </p>
      )}

      {/* Lista de deudas activas con abono */}
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
            onSavePayment={(amt) => onAddDebtPayment(debt.id, amt)}
            onRemovePayment={() => onRemoveDebtPayment(debt.id)}
          />
        );
      })}

      {/* Botón nueva deuda */}
      {!readOnly && <AddDebtForm onAdd={onAddDebt} />}

      {/* Deudas saldadas colapsadas */}
      {settledDebts.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none list-none px-1 text-xs text-zinc-600 transition hover:text-zinc-400">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>{" "}
            {settledDebts.length} deuda{settledDebts.length !== 1 ? "s" : ""}{" "}
            saldada{settledDebts.length !== 1 ? "s" : ""}
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
                  onSavePayment={(amt) => onAddDebtPayment(debt.id, amt)}
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
