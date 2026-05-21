import { NextResponse } from "next/server";

export const revalidate = 900;

/** Referencia mercado (paralelo) — suele estar cerca del P2P Binance (~700+ Bs/USDT). */
export async function GET() {
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/paralelo", {
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error("P2P fetch failed");
    const data = await res.json();
    const rate = data.promedio ?? data.venta ?? data.compra;
    if (!rate || typeof rate !== "number") throw new Error("Invalid rate");
    return NextResponse.json({
      rate,
      updatedAt: data.fechaActualizacion ?? new Date().toISOString(),
      source: "Mercado paralelo (referencia P2P)",
      hint: "Ajusta al precio exacto de tu anuncio en Binance P2P si difiere.",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener referencia P2P" },
      { status: 502 }
    );
  }
}
