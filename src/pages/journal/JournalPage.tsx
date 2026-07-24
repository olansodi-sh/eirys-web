import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/shared/api/endpoints'
import { Badge, Card, EmptyState, Input } from '@/shared/ui'
import { money } from '@/shared/utils/format'

function monthStart(): string {
  const d = new Date()
  return `${d.toISOString().slice(0, 8)}01`
}

interface Entry {
  date: string
  type: string
  reference: string
  income: number
  expense: number
}

export default function JournalPage() {
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))

  const journal = useQuery({
    queryKey: ['journal', from, to],
    queryFn: () => reportsApi.journal(from, to),
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Libro diario
      </h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
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
        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-gray-500">
            Ingresos{' '}
            <span className="font-semibold text-success">
              {money(journal.data?.totalIncome ?? 0)}
            </span>
          </span>
          <span className="text-gray-500">
            Egresos{' '}
            <span className="font-semibold text-danger">
              {money(journal.data?.totalExpense ?? 0)}
            </span>
          </span>
        </div>
      </div>

      <Card>
        {!journal.data?.entries?.length ? (
          <EmptyState message="Sin movimientos en el rango" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Referencia</th>
                <th className="px-5 py-3 text-right font-medium">Ingreso</th>
                <th className="px-5 py-3 text-right font-medium">Egreso</th>
              </tr>
            </thead>
            <tbody>
              {(journal.data.entries as Entry[]).map((e, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-5 py-2 text-gray-500">{e.date}</td>
                  <td className="px-5 py-2">
                    <Badge>{e.type}</Badge>
                  </td>
                  <td className="px-5 py-2 font-mono text-xs text-gray-700">
                    {e.reference}
                  </td>
                  <td className="px-5 py-2 text-right text-success">
                    {e.income ? money(e.income) : '—'}
                  </td>
                  <td className="px-5 py-2 text-right text-danger">
                    {e.expense ? money(e.expense) : '—'}
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
