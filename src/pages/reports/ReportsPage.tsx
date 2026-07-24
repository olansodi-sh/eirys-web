import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/shared/api/endpoints'
import { Card, EmptyState } from '@/shared/ui'
import { money } from '@/shared/utils/format'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </Card>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold text-gray-900">{title}</h2>
      {children}
    </Card>
  )
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const daily = useQuery({
    queryKey: ['report-daily', today],
    queryFn: () => reportsApi.daily(today),
  })
  const c360 = useQuery({
    queryKey: ['report-360'],
    queryFn: reportsApi.commercial360,
  })
  const byProduct = useQuery({
    queryKey: ['report-cost-product'],
    queryFn: reportsApi.costByProduct,
  })
  const byWarehouse = useQuery({
    queryKey: ['report-cost-warehouse'],
    queryFn: reportsApi.costByWarehouse,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>

      <section>
        <h2 className="mb-3 text-sm font-medium text-gray-500">
          Reporte del día
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Ventas" value={String(daily.data?.salesCount ?? '—')} />
          <Stat label="Total" value={money(daily.data?.total ?? 0)} />
          <Stat label="Cobrado" value={money(daily.data?.paid ?? 0)} />
          <Stat
            label="Ticket promedio"
            value={money(daily.data?.averageTicket ?? 0)}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Top productos">
          {!c360.data?.topProducts?.length ? (
            <EmptyState message="Sin datos" />
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {c360.data.topProducts.map(
                  (p: { name: string; units: number; total: number }) => (
                    <tr key={p.name} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{p.name}</td>
                      <td className="py-2 text-right text-gray-500">
                        {p.units} u
                      </td>
                      <td className="py-2 text-right font-medium text-gray-700">
                        {money(p.total)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Top clientes">
          {!c360.data?.topClients?.length ? (
            <EmptyState message="Sin datos" />
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {c360.data.topClients.map(
                  (c: { name: string; orders: number; total: number }) => (
                    <tr key={c.name} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{c.name}</td>
                      <td className="py-2 text-right text-gray-500">
                        {c.orders} ventas
                      </td>
                      <td className="py-2 text-right font-medium text-gray-700">
                        {money(c.total)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Costo de inventario por producto">
          {!byProduct.data?.length ? (
            <EmptyState message="Sin datos" />
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {byProduct.data.map(
                  (r: { name: string; units: number; value: number }) => (
                    <tr key={r.name} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{r.name}</td>
                      <td className="py-2 text-right text-gray-500">
                        {r.units} u
                      </td>
                      <td className="py-2 text-right font-medium text-gray-700">
                        {money(r.value)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Valorización por bodega">
          {!byWarehouse.data?.length ? (
            <EmptyState message="Sin datos" />
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {byWarehouse.data.map((r: { name: string; value: number }) => (
                  <tr key={r.name} className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">{r.name}</td>
                    <td className="py-2 text-right font-medium text-gray-700">
                      {money(r.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  )
}
