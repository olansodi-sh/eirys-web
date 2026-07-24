import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import type { Sale, SaleStatus } from '@/shared/types'
import { SaleInvoiceModal } from './sales/SaleInvoiceModal'

const STATUS_LABEL: Record<SaleStatus, string> = {
  confirmed: 'Pendiente',
  partial: 'Abono',
  paid: 'Pagada',
  cancelled: 'Anulada',
}

export default function SalesPage() {
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [viewing, setViewing] = useState<Sale | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', search, from, to],
    queryFn: () =>
      salesApi.list({
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Ventas</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input
            label="Buscar"
            placeholder="Factura o cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          label="Desde"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="Hasta"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        {(search || from || to) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setFrom('')
              setTo('')
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="No hay ventas que coincidan con el filtro" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Factura</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">
                    {s.number}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(s.date).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {s.clientName ?? 'Consumidor final'}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {money(s.total)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" onClick={() => setViewing(s)}>
                      Ver factura
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <SaleInvoiceModal sale={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
