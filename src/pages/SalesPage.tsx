import { useQuery } from '@tanstack/react-query'
import { salesApi } from '@/shared/api/endpoints'
import { Badge, Card, EmptyState } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import type { SaleStatus } from '@/shared/types'

const STATUS_LABEL: Record<SaleStatus, string> = {
  confirmed: 'Pendiente',
  partial: 'Abono',
  paid: 'Pagada',
  cancelled: 'Anulada',
}

export default function SalesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: salesApi.list,
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Ventas</h1>
      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="Aún no hay ventas registradas" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Factura</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {s.number}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(s.date).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {s.thirdParty?.name ?? 'Consumidor final'}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {money(s.total)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
