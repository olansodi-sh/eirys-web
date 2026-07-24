import { useEffect, useMemo, useState } from 'react'
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
import { SearchableSelect } from '@/shared/ui/SearchableSelect'
import { money } from '@/shared/utils/format'
import type { PaymentMethod, Product, ProductVariant, ThirdParty } from '@/shared/types'
import { ThirdPartyFormModal } from './third-parties/ThirdPartyFormModal'

const STORAGE_KEY = 'eirys-pos-order'

interface CartItem {
  variantId: string
  label: string
  sku: string
  unitPrice: number
  quantity: number
  originalPrice: number | null
  discountPercent: number
}

interface StoredOrder {
  cart: CartItem[]
  warehouseId: string
  thirdPartyId: string
}

function loadStoredOrder(): StoredOrder {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { cart: [], warehouseId: '', thirdPartyId: '' }
    const parsed = JSON.parse(raw)
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      warehouseId: parsed.warehouseId ?? '',
      thirdPartyId: parsed.thirdPartyId ?? '',
    }
  } catch {
    return { cart: [], warehouseId: '', thirdPartyId: '' }
  }
}

interface CatalogTile {
  key: string
  product: Product
  variant: ProductVariant
  imageUrl: string | null
}

function buildCatalog(products: Product[] | undefined, categoryId: string): CatalogTile[] {
  if (!products) return []
  const tiles: CatalogTile[] = []
  for (const p of products) {
    if (categoryId && p.categoryId !== categoryId) continue
    for (const v of p.variants ?? []) {
      const image =
        p.images?.find((img) => img.variantId === v.id) ??
        p.images?.find((img) => img.variantId === null)
      tiles.push({ key: v.id, product: p, variant: v, imageUrl: image?.url ?? null })
    }
  }
  return tiles
}

/** Imagen por defecto para productos sin foto: silueta de zapato. */
function ImagePlaceholder() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className="h-10 w-10 text-gray-300"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 44c0-5 3-8 7-10l16-8c3-1.5 5-4 6-7l1-3c3 0 5 2 5 5v6c0 3 1 5 3 7l7 6c2 2 3 4 3 7v3H8v-6z" />
      <path d="M8 44h48" />
    </svg>
  )
}

export default function PosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [initialOrder] = useState(loadStoredOrder)
  const [cart, setCart] = useState<CartItem[]>(initialOrder.cart)
  const [warehouseId, setWarehouseId] = useState(initialOrder.warehouseId)
  const [thirdPartyId, setThirdPartyId] = useState(initialOrder.thirdPartyId)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paid, setPaid] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [newClientOpen, setNewClientOpen] = useState(false)

  useEffect(() => {
    const order: StoredOrder = { cart, warehouseId, thirdPartyId }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [cart, warehouseId, thirdPartyId])

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

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products.data ?? []) {
      if (p.category) map.set(p.category.id, p.category.name)
    }
    return [...map.entries()]
  }, [products.data])

  const catalog = useMemo(
    () => buildCatalog(products.data, categoryId),
    [products.data, categoryId],
  )
  const cartQtyByVariant = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of cart) map.set(i.variantId, i.quantity)
    return map
  }, [cart])

  const clientOptions = useMemo(
    () =>
      (thirds.data ?? []).map((t) => ({
        id: t.id,
        label: t.name,
        sublabel: t.docNumber ? `${t.docType} ${t.docNumber}` : t.docType,
      })),
    [thirds.data],
  )

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
    const originalPrice = variant.listPrice !== null ? Number(variant.listPrice) : null
    const discountPercent = Number(variant.discountPercent) || 0
    setCart((c) => [
      ...c,
      {
        variantId: variant.id,
        label: `${product.name} · ${variant.size}/${variant.color}`,
        sku: product.sku,
        unitPrice: price || Number(variant.cost) || 0,
        quantity: 1,
        originalPrice,
        discountPercent,
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

  const sale = useMutation({
    mutationFn: () => {
      const payload: SalePayload = {
        warehouseId: effectiveWarehouse,
        thirdPartyId: thirdPartyId || undefined,
        lines: cart.map((i) => {
          const hasDiscount = i.discountPercent > 0 && i.originalPrice !== null
          return {
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: hasDiscount ? i.originalPrice! : i.unitPrice,
            discount: hasDiscount
              ? Math.round(Math.max(0, (i.originalPrice! - i.unitPrice) * i.quantity) * 100) /
                100
              : 0,
          }
        }),
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
      localStorage.removeItem(STORAGE_KEY)
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
  const change = paid !== '' && Number(paid) > total ? Number(paid) - total : 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Punto de venta</h1>
        {cash.data ? (
          <Badge>Caja abierta</Badge>
        ) : (
          <span className="text-sm text-warning">Caja cerrada</span>
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

          {categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryId('')}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  categoryId === ''
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos
              </button>
              {categories.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setCategoryId(id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    categoryId === id
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {!catalog.length ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No hay productos con variantes para vender
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {catalog.map((tile) => {
                const qty = cartQtyByVariant.get(tile.variant.id) ?? 0
                const listPrice =
                  tile.variant.listPrice !== null ? Number(tile.variant.listPrice) : null
                const discountPercent = Number(tile.variant.discountPercent) || 0
                const finalPrice =
                  listPrice !== null && discountPercent > 0
                    ? listPrice * (1 - discountPercent / 100)
                    : listPrice
                const outOfStock = tile.variant.stockQty <= 0
                return (
                  <button
                    key={tile.key}
                    onClick={() => addVariant(tile.product, tile.variant)}
                    disabled={outOfStock}
                    className="group relative text-left disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Card className="overflow-hidden p-0 transition group-hover:border-primary">
                      <div className="flex aspect-square items-center justify-center bg-gray-100">
                        {tile.imageUrl ? (
                          <img
                            src={tile.imageUrl}
                            alt={tile.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlaceholder />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {tile.product.name}
                        </p>
                        <p className="mb-1.5 text-xs text-gray-500">
                          {tile.variant.size} · {tile.variant.color}
                        </p>
                        {discountPercent > 0 ? (
                          <div className="mb-1 flex items-baseline gap-1.5">
                            <span className="text-xs text-gray-400 line-through">
                              {listPrice !== null ? money(listPrice) : ''}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {finalPrice !== null ? money(finalPrice) : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="mb-1 block text-sm font-semibold text-gray-900">
                            {finalPrice !== null ? money(finalPrice) : '—'}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          {discountPercent > 0 ? (
                            <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-xs font-semibold text-danger">
                              -{discountPercent}%
                            </span>
                          ) : (
                            <span />
                          )}
                          <span
                            className={`text-xs ${outOfStock ? 'text-danger' : 'text-gray-500'}`}
                          >
                            {outOfStock ? 'Agotado' : `Stock: ${tile.variant.stockQty}`}
                          </span>
                        </div>
                      </div>
                    </Card>
                    {qty > 0 && (
                      <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white shadow-sm">
                        {qty}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Carrito */}
        <Card className="flex h-fit flex-col p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Venta actual</h2>
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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Cliente
                </span>
                <SearchableSelect
                  options={clientOptions}
                  value={thirdPartyId}
                  onChange={setThirdPartyId}
                  placeholder="Buscar por documento o nombre…"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setNewClientOpen(true)}
                title="Crear cliente nuevo"
              >
                + Cliente
              </Button>
            </div>
          </div>

          <div className="mb-3 divide-y divide-gray-100 border-y border-gray-100">
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                Agrega productos del catálogo
              </p>
            ) : (
              cart.map((i) => (
                <div key={i.variantId} className="py-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{i.label}</span>
                    <button
                      onClick={() => setQty(i.variantId, 0)}
                      className="text-gray-500 hover:text-danger"
                    >
                      ✕
                    </button>
                  </div>
                  {i.discountPercent > 0 && (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {i.originalPrice !== null && (
                        <span className="text-xs text-gray-400 line-through">
                          {money(i.originalPrice)}
                        </span>
                      )}
                      <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-xs font-semibold text-danger">
                        -{i.discountPercent}%
                      </span>
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={i.quantity}
                      onChange={(e) =>
                        setQty(i.variantId, Number(e.target.value))
                      }
                      className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="w-24 rounded-md border border-gray-100 bg-gray-100 px-2 py-1 text-sm text-gray-700">
                      {money(i.unitPrice)}
                    </span>
                    <span className="ml-auto text-sm font-medium text-gray-700">
                      {money(i.unitPrice * i.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-gray-500">Total</span>
            <span className="text-2xl font-semibold text-gray-900">
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

          {change > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-md bg-success-bg px-3 py-2">
              <span className="text-sm font-medium text-success">Vueltos</span>
              <span className="text-lg font-semibold text-success">{money(change)}</span>
            </div>
          )}

          {cashBlocked && (
            <p className="mb-2 text-xs text-warning">
              Abre una sesión de caja para cobrar en efectivo.
            </p>
          )}
          {message && (
            <p className="mb-2 text-sm text-primary">{message}</p>
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

      <ThirdPartyFormModal
        open={newClientOpen}
        onClose={() => setNewClientOpen(false)}
        defaultType="client"
        lockType
        onSaved={(t: ThirdParty) => setThirdPartyId(t.id)}
      />
    </div>
  )
}
