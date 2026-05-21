import { NextResponse } from "next/server";

export const revalidate = 1800;

export async function GET() {
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error("BCV fetch failed");
    const data = await res.json();
    const rate = data.promedio ?? data.venta ?? data.compra;
    if (!rate || typeof rate !== "number") throw new Error("Invalid rate");
    return NextResponse.json({
      rate,
      updatedAt: data.fechaActualizacion ?? new Date().toISOString(),
      source: "BCV (dolarapi.com)",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener la tasa BCV" },
      { status: 502 }
    );
  }
}
