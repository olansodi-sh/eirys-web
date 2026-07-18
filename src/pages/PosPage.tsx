import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cashApi,
  pricingApi,
  productsApi,
  salesApi,
  thirdPartiesApi,
  warehousesApi,
  type SalePayload,
} from '@/shared/api/endpoints'
import { Badge, Button, Card, Input, Select } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import type { PaymentMethod, Product, ProductVariant } from '@/shared/types'

interface CartItem {
  variantId: string
  label: string
  sku: string
  unitPrice: number
  quantity: number
}

export default function PosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [thirdPartyId, setThirdPartyId] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paid, setPaid] = useState<number | ''>('')
  const [message, setMessage] = useState('')

  const cash = useQuery({ queryKey: ['cash-current'], queryFn: cashApi.current })
  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehousesApi.list,
  })
  const thirds = useQuery({
    queryKey: ['third-parties'],
    queryFn: () => thirdPartiesApi.list({ type: 'client' }),
  })
  const products = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.list(search || undefined),
  })

  const total = useMemo(
    () => cart.reduce((a, i) => a + i.unitPrice * i.quantity, 0),
    [cart],
  )
  const effectiveWarehouse = warehouseId || warehouses.data?.[0]?.id || ''

  async function addVariant(product: Product, variant: ProductVariant) {
    const existing = cart.find((c) => c.variantId === variant.id)
    if (existing) {
      setCart((c) =>
        c.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      )
      return
    }
    const { price } = await pricingApi.getPrice(variant.id)
    setCart((c) => [
      ...c,
      {
        variantId: variant.id,
        label: `${product.name} · ${variant.size}/${variant.color}`,
        sku: product.sku,
        unitPrice: price || Number(variant.cost) || 0,
        quantity: 1,
      },
    ])
  }

  function setQty(variantId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((c) => c.filter((i) => i.variantId !== variantId))
    } else {
      setCart((c) =>
        c.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
      )
    }
  }

  function setPrice(variantId: string, unitPrice: number) {
    setCart((c) =>
      c.map((i) => (i.variantId === variantId ? { ...i, unitPrice } : i)),
    )
  }

  const sale = useMutation({
    mutationFn: () => {
      const payload: SalePayload = {
        warehouseId: effectiveWarehouse,
        thirdPartyId: thirdPartyId || undefined,
        lines: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        payment:
          paid !== '' && Number(paid) > 0
            ? { method, amount: Number(paid) }
            : undefined,
      }
      return salesApi.create(payload)
    },
    onSuccess: (s) => {
      setMessage(`Venta ${s.number} registrada (${money(s.total)})`)
      setCart([])
      setPaid('')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message ?? 'Error al registrar la venta')
    },
  })

  const needsCash = method === 'cash' && Number(paid) > 0
  const cashBlocked = needsCash && !cash.data

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Punto de venta</h1>
        {cash.data ? (
          <Badge>Caja abierta</Badge>
        ) : (
          <span className="text-sm text-amber-600">Caja cerrada</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Catálogo */}
        <div>
          <div className="mb-4">
            <Input
              placeholder="Buscar producto por nombre o SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {products.data?.map((p) => (
              <Card key={p.id} className="p-4">
                <p className="font-medium text-slate-800">{p.name}</p>
                <p className="mb-2 font-mono text-xs text-slate-400">{p.sku}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.variants?.length ? (
                    p.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => addVariant(p, v)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-violet-400 hover:bg-violet-50"
                      >
                        {v.size} · {v.color}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Sin variantes</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <Card className="flex h-fit flex-col p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Venta actual</h2>
          <div className="mb-3 space-y-3">
            <Select
              label="Bodega"
              value={effectiveWarehouse}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.data?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <Select
              label="Cliente (opcional)"
              value={thirdPartyId}
              onChange={(e) => setThirdPartyId(e.target.value)}
            >
              <option value="">Consumidor final</option>
              {thirds.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mb-3 divide-y divide-slate-100 border-y border-slate-100">
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Agrega productos del catálogo
              </p>
            ) : (
              cart.map((i) => (
                <div key={i.variantId} className="py-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{i.label}</span>
                    <button
                      onClick={() => setQty(i.variantId, 0)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={i.quantity}
                      onChange={(e) =>
                        setQty(i.variantId, Number(e.target.value))
                      }
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-slate-400">×</span>
                    <input
                      type="number"
                      value={i.unitPrice}
                      onChange={(e) =>
                        setPrice(i.variantId, Number(e.target.value))
                      }
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                    <span className="ml-auto text-sm font-medium text-slate-700">
                      {money(i.unitPrice * i.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-slate-500">Total</span>
            <span className="text-2xl font-semibold text-slate-800">
              {money(total)}
            </span>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <Select
              label="Método"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="credit">Crédito</option>
            </Select>
            <Input
              label="Pagado"
              type="number"
              value={paid}
              onChange={(e) =>
                setPaid(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder={String(total)}
            />
          </div>

          {cashBlocked && (
            <p className="mb-2 text-xs text-amber-600">
              Abre una sesión de caja para cobrar en efectivo.
            </p>
          )}
          {message && (
            <p className="mb-2 text-sm text-violet-700">{message}</p>
          )}

          <Button
            className="w-full"
            disabled={
              cart.length === 0 ||
              !effectiveWarehouse ||
              cashBlocked ||
              sale.isPending
            }
            onClick={() => sale.mutate()}
          >
            {sale.isPending ? 'Procesando…' : 'Registrar venta'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
