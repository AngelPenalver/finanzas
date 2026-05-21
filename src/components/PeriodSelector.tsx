"use client";

import {
  formatPeriodLabel,
  getCurrentPeriodId,
  isPeriodLocked,
} from "@/lib/period";
import type { FinanzasState } from "@/lib/types";
import { Card } from "./ui";

type Props = {
  state: FinanzasState;
  viewPeriodId: string;
  onSelect: (periodId: string) => void;
};

export function PeriodSelector({ state, viewPeriodId, onSelect }: Props) {
  const currentId = getCurrentPeriodId();
  const isViewingCurrent = viewPeriodId === currentId;

  return (
    <Card className="border-zinc-800">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Quincena
      </p>
      <div className="flex flex-wrap gap-2">
        {state.periods.map((period) => {
          const locked = isPeriodLocked(period.id);
          const active = period.id === viewPeriodId;
          return (
            <button
              key={period.id}
              type="button"
              onClick={() => onSelect(period.id)}
              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                active
                  ? locked
                    ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-500"
                    : "bg-emerald-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                {locked ? (
                  <span className="text-xs" aria-hidden>
                    🔒
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
                {formatPeriodLabel(period.id)}
              </span>
              {!locked && period.id === currentId ? (
                <span className="mt-0.5 block text-[10px] opacity-80">
                  Actual · editable
                </span>
              ) : locked ? (
                <span className="mt-0.5 block text-[10px] opacity-70">
                  Cerrada · solo lectura
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {!isViewingCurrent ? (
        <p className="mt-3 text-xs text-amber-400/90">
          Estás viendo una quincena pasada. No se puede editar.
        </p>
      ) : (
        <p className="mt-3 text-xs text-zinc-600">
          Al cambiar de quincena, la anterior queda guardada y bloqueada.
        </p>
      )}
    </Card>
  );
}
