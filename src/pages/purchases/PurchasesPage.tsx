import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  productsApi,
  purchasesApi,
  thirdPartiesApi,
  warehousesApi,
  type PurchaseLineInput,
} from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import type { PurchaseDocumentType } from '@/shared/types'

type Tab = 'orders' | 'invoices' | 'debit'

interface DraftLine extends PurchaseLineInput {
  label: string
}

function useCommon() {
  const suppliers = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => thirdPartiesApi.list({ type: 'supplier' }),
  })
  const warehouses = useQuery({ queryKey: ['warehouses'], queryFn: warehousesApi.list })
  const products = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list() })
  const variantOptions = (products.data ?? []).flatMap((p) =>
    p.variants.map((v) => ({ id: v.id, label: `${p.name} · ${v.size}/${v.color}` })),
  )
  return { suppliers, warehouses, variantOptions }
}

function LineEditor({
  variantOptions,
  lines,
  setLines,
  costLabel = 'Costo',
}: {
  variantOptions: { id: string; label: string }[]
  lines: DraftLine[]
  setLines: (l: DraftLine[]) => void
  costLabel?: string
}) {
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [cost, setCost] = useState(0)

  function add() {
    const opt = variantOptions.find((o) => o.id === variantId)
    if (!opt || qty <= 0) return
    setLines([...lines, { variantId, label: opt.label, quantity: qty, unitCost: cost }])
    setVariantId('')
    setQty(1)
    setCost(0)
  }

  return (
    <div className="rounded-md border border-gray-300 p-3">
      <div className="grid grid-cols-[1fr_70px_90px_auto] items-end gap-2">
        <Select label="Variante" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          <option value="">Seleccionar…</option>
          {variantOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input label="Cant." type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <Input label={costLabel} type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        <Button type="button" variant="secondary" onClick={add}>
          +
        </Button>
      </div>
      <ul className="mt-3 divide-y divide-gray-100 text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between py-1.5">
            <span className="text-gray-700">
              {l.label} × {l.quantity}
            </span>
            <span className="font-medium">{money(l.quantity * l.unitCost)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PurchasesPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('orders')
  const { suppliers, warehouses, variantOptions } = useCommon()

  const [modal, setModal] = useState<Tab | null>(null)
  const [supplierId, setSupplierId] = useState('')
  const [docType, setDocType] = useState<PurchaseDocumentType>('invoice')
  const [supplierDoc, setSupplierDoc] = useState('')
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])

  const orders = useQuery({ queryKey: ['purchase-orders'], queryFn: purchasesApi.listOrders })
  const invoices = useQuery({ queryKey: ['purchase-invoices'], queryFn: purchasesApi.listInvoices })
  const debit = useQuery({ queryKey: ['purchase-debit'], queryFn: purchasesApi.listDebitNotes })

  const wh = () => warehouses.data?.[0]?.id ?? ''
  const reset = () => {
    setModal(null)
    setSupplierId('')
    setSupplierDoc('')
    setAmount(0)
    setReason('')
    setLines([])
  }

  const createOrder = useMutation({
    mutationFn: () =>
      purchasesApi.createOrder({
        supplierId,
        warehouseId: wh(),
        lines: lines.map(({ variantId, quantity, unitCost }) => ({ variantId, quantity, unitCost })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      reset()
    },
  })

  const createInvoice = useMutation({
    mutationFn: () =>
      purchasesApi.createInvoice({
        documentType: docType,
        supplierId,
        warehouseId: wh(),
        supplierDocNumber: supplierDoc || undefined,
        lines: lines.map(({ variantId, quantity, unitCost }) => ({ variantId, quantity, unitCost })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      reset()
    },
  })

  const createDebit = useMutation({
    mutationFn: () =>
      purchasesApi.createDebitNote({ supplierId, amount, reason: reason || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-debit'] })
      reset()
    },
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: 'orders', label: 'Órdenes de compra' },
    { key: 'invoices', label: 'Facturas / soporte' },
    { key: 'debit', label: 'Notas débito' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Compras y gastos</h1>
        <Button onClick={() => setModal(tab)}>
          {tab === 'orders'
            ? 'Nueva orden'
            : tab === 'invoices'
              ? 'Recibir compra'
              : 'Nueva nota débito'}
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              tab === t.key
                ? 'border-primary bg-primary-light text-primary'
                : 'border-gray-300 text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'orders' &&
          (!orders.data?.length ? (
            <EmptyState message="No hay órdenes de compra" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Número</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{o.number}</td>
                    <td className="px-5 py-3 text-gray-500">{o.supplier?.name ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-gray-700">{money(o.total)}</td>
                    <td className="px-5 py-3">
                      <Badge>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'invoices' &&
          (!invoices.data?.length ? (
            <EmptyState message="No hay facturas ni documentos de soporte" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Número</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium">Comprobante</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.data.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{f.number}</td>
                    <td className="px-5 py-3">
                      <Badge>
                        {f.documentType === 'invoice' ? 'Factura' : 'Doc. soporte'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{f.supplier?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{f.supplierDocNumber || '—'}</td>
                    <td className="px-5 py-3 font-medium text-gray-700">{money(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'debit' &&
          (!debit.data?.length ? (
            <EmptyState message="No hay notas débito" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Número</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {debit.data.map((n) => (
                  <tr key={n.id} className="border-b border-gray-100">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{n.number}</td>
                    <td className="px-5 py-3 font-medium text-gray-700">{money(n.amount)}</td>
                    <td className="px-5 py-3 text-gray-500">{n.reason || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{n.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </Card>

      {/* Modal órdenes / facturas */}
      <Modal
        open={modal === 'orders' || modal === 'invoices'}
        title={modal === 'orders' ? 'Nueva orden de compra' : 'Recibir compra'}
        onClose={reset}
      >
        <div className="space-y-4">
          <Select label="Proveedor" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Seleccionar proveedor…</option>
            {suppliers.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          {modal === 'invoices' && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Tipo de documento"
                value={docType}
                onChange={(e) => setDocType(e.target.value as PurchaseDocumentType)}
              >
                <option value="invoice">Factura de compra</option>
                <option value="support_document">Documento de soporte</option>
              </Select>
              <Input
                label="N.º comprobante"
                value={supplierDoc}
                onChange={(e) => setSupplierDoc(e.target.value)}
              />
            </div>
          )}
          <LineEditor variantOptions={variantOptions} lines={lines} setLines={setLines} />
          <p className="text-xs text-gray-500">
            {modal === 'invoices'
              ? 'Al recibir se aumenta el inventario y se actualiza el costo.'
              : 'La orden no mueve inventario hasta recibirse.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                modal === 'orders' ? createOrder.mutate() : createInvoice.mutate()
              }
              disabled={!supplierId || lines.length === 0}
            >
              {modal === 'orders' ? 'Crear orden' : 'Recibir'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nota débito */}
      <Modal open={modal === 'debit'} title="Nueva nota débito" onClose={reset}>
        <div className="space-y-4">
          <Select label="Proveedor" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Seleccionar proveedor…</option>
            {suppliers.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Input label="Monto" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>
              Cancelar
            </Button>
            <Button onClick={() => createDebit.mutate()} disabled={!supplierId || amount <= 0}>
              Registrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
