# Mis Finanzas VE

App sencilla para controlar finanzas personales en Venezuela:

- **Ingresos** en USD/USDT (Binance P2P)
- **Dos tasas separadas**: **P2P Binance** (~700+ Bs/USDT, más alto) y **BCV** (~520 Bs/USD, referencia oficial más baja)
- Conversión a bolívares con ambas tasas visibles lado a lado
- **Pagos** pendientes y pagados (USD o Bs)
- **Lista de compras** con presupuesto estimado
- **Resumen**: cuánto ingresaste, cuánto debes pagar/comprar y cuánto te queda

Los datos se guardan en **localStorage** del navegador, **organizados por quincena** (1.ª = días 1–15, 2.ª = 16–fin de mes). Las quincenas pasadas quedan **bloqueadas** (solo lectura); solo la quincena actual se puede editar.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Desplegar en Vercel

No hace falta base de datos ni variables de entorno.

### Opción A — CLI (rápida)

En la carpeta del proyecto:

```bash
npx vercel login
npm run deploy
```

La primera vez pregunta nombre del proyecto y confirma. Al terminar verás la URL (ej. `https://finanzas-xxx.vercel.app`).

### Opción B — GitHub + Vercel

1. Crea un repo en GitHub y sube el código (`git push`).
2. Entra en [vercel.com/new](https://vercel.com/new) → importa el repo.
3. Framework: **Next.js** (auto). **Deploy**.

Cada `git push` a `main` puede redeplegar si activas eso en Vercel.

## Tasa BCV

La app consulta `https://ve.dolarapi.com/v1/dolares/oficial` vía la ruta `/api/bcv`. Puedes editar la tasa manualmente si la API falla.

## Notas

- **Ingresos USDT** → tasa **P2P** (Binance).
- **Pagos y compras** → tasa **BCV**, salvo la **quincena** (marcar como P2P).
- **Disponible** = ingresos USDT − obligaciones (cada ítem con su tasa).
- Si abres la app en otro dispositivo o navegador, los datos no se sincronizan (por diseño, sin backend).
