# Eirys Web

Frontend del sistema POS **Eirys**. React 19 + TypeScript + Vite + TailwindCSS.

## Fase 1 — implementado

- **Login** con JWT y refresco automático de token (interceptor axios).
- **Rutas protegidas** y menú filtrado por permisos del usuario.
- **Shell** con barra lateral y layout.
- Pantallas CRUD: **Panel**, **Productos** (con variantes talla/color), **Categorías**, **Bodegas**, **Terceros**, **Usuarios**.

## Fase 2 — implementado (POS core)

- **Punto de venta**: catálogo, carrito, precios desde la lista por defecto, cobro (efectivo/tarjeta/transferencia/crédito).
- **Caja**: apertura, egresos, cierre con arqueo (esperado/contado/diferencia) y movimientos.
- **Listas de precios**: gestión y edición de precios por variante.
- **Ventas**: historial de facturas con estado.

## Fase 3 — implementado (complementos de venta)

- **Cotizaciones**: creación con líneas y conversión a factura.
- **Vales**: emisión y redención con saldo.
- **Notas crédito**: sobre factura, con restock y generación de vale.
- **Recurrentes**: plantillas y ejecución de las vencidas.
- **Despacho**: entradas/salidas a demanda con estado.

## Requisitos

Necesita la **API** (`eirys-api`) corriendo en `http://localhost:3000`.
Vite hace proxy de `/api` hacia ese destino (ver `vite.config.ts`).

## Puesta en marcha

```bash
yarn install
yarn dev        # http://localhost:5173
```

Ingresa con el usuario sembrado por la API: `admin@eirys.local` / `admin123`.

## Estructura

```
src/
├── app/            # router, layout, ruta protegida
├── features/auth/  # contexto de autenticación + login
├── pages/          # pantallas (dashboard, productos, terceros, ...)
└── shared/
    ├── api/         # cliente axios + endpoints tipados
    ├── types/       # tipos del dominio
    └── ui/          # componentes reutilizables (Button, Input, Modal, ...)
```
