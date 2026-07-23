import { useQuery } from '@tanstack/react-query'
import {
  productsApi,
  thirdPartiesApi,
  warehousesApi,
} from '@/shared/api/endpoints'
import { Card } from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-800">{value}</p>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, can } = useAuth()
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
    enabled: can('inventory.read'),
  })
  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list(),
    enabled: can('inventory.read'),
  })
  const thirds = useQuery({
    queryKey: ['third-parties'],
    queryFn: () => thirdPartiesApi.list(),
    enabled: can('third_parties.read'),
  })

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-800">
        Hola, {user?.email}
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Resumen del sistema · rol {user?.role}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Productos" value={products.data?.length ?? '—'} />
        <Stat label="Bodegas" value={warehouses.data?.length ?? '—'} />
        <Stat label="Terceros" value={thirds.data?.length ?? '—'} />
      </div>
    </div>
  )
}
