export function formatUsd(value: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/** Dólares a tasa BCV (cuenta oficial en $). */
export function formatBcvUsd(value: number): string {
  return formatUsd(value);
}

export function formatBs(value: number): string {
  return (
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " Bs"
  );
}

export function formatRate(value: number): string {
  return (
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value) + " Bs/USD"
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
