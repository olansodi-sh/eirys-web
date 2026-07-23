import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  productsApi,
  quotesApi,
  thirdPartiesApi,
  warehousesApi,
  type QuoteLineInput,
} from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import { useAuth } from '@/features/auth/AuthContext'
import type { QuoteStatus } from '@/shared/types'

interface Line extends QuoteLineInput {
  label: string
}

const STATUS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  converted: 'Convertida',
}

export default function QuotesPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [thirdPartyId, setThirdPartyId] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [variantSel, setVariantSel] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)

  const quotes = useQuery({ queryKey: ['quotes'], queryFn: quotesApi.list })
  const products = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list() })
  const thirds = useQuery({
    queryKey: ['third-parties'],
    queryFn: () => thirdPartiesApi.list({ type: 'client' }),
  })
  const warehouses = useQuery({ queryKey: ['warehouses'], queryFn: warehousesApi.list })

  const variantOptions = (products.data ?? []).flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      label: `${p.name} · ${v.size}/${v.color}`,
    })),
  )

  function addLine() {
    const opt = variantOptions.find((o) => o.id === variantSel)
    if (!opt || qty <= 0) return
    setLines((l) => [
      ...l,
      { variantId: opt.id, label: opt.label, quantity: qty, unitPrice: price },
    ])
    setVariantSel('')
    setQty(1)
    setPrice(0)
  }

  const create = useMutation({
    mutationFn: () =>
      quotesApi.create({
        thirdPartyId: thirdPartyId || undefined,
        lines: lines.map(({ variantId, quantity, unitPrice }) => ({
          variantId,
          quantity,
          unitPrice,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      setOpen(false)
      setLines([])
      setThirdPartyId('')
    },
  })

  const convert = useMutation({
    mutationFn: (id: string) =>
      quotesApi.convert(id, warehouses.data?.[0]?.id ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const total = lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Cotizaciones</h1>
        {can('quotes.write') && (
          <Button onClick={() => setOpen(true)}>Nueva cotización</Button>
        )}
      </div>

      <Card>
        {quotes.isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !quotes.data?.length ? (
          <EmptyState message="No hay cotizaciones" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.data.map((q) => (
                <tr key={q.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {q.number}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {q.thirdParty?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {money(q.total)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{STATUS[q.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {q.status !== 'converted' && can('sales.write') && (
                      <Button
                        variant="secondary"
                        onClick={() => convert.mutate(q.id)}
                        disabled={convert.isPending}
                      >
                        Convertir a factura
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nueva cotización" onClose={() => setOpen(false)}>
        <div className="space-y-4">
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

          <div className="rounded-lg border border-slate-200 p-3">
            <div className="grid grid-cols-[1fr_70px_90px_auto] items-end gap-2">
              <Select
                label="Variante"
                value={variantSel}
                onChange={(e) => setVariantSel(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {variantOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Cant."
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <Input
                label="Precio"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              <Button type="button" variant="secondary" onClick={addLine}>
                +
              </Button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {lines.map((l, i) => (
                <li key={i} className="flex justify-between py-1.5">
                  <span className="text-slate-600">
                    {l.label} × {l.quantity}
                  </span>
                  <span className="font-medium">
                    {money(l.quantity * l.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Total</span>
            <span className="text-xl font-semibold">{money(total)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={lines.length === 0 || create.isPending}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
