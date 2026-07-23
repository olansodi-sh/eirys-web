import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehousesApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'

interface FormValues {
  name: string
  location?: string
  isQuality?: boolean
}

export default function WarehousesPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<FormValues>()

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list(),
  })

  const create = useMutation({
    mutationFn: (v: FormValues) => warehousesApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      setOpen(false)
      reset()
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Bodegas</h1>
        {can('inventory.write') && (
          <Button onClick={() => setOpen(true)}>Nueva bodega</Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="No hay bodegas registradas" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Ubicación</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {w.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {w.location || '—'}
                  </td>
                  <td className="px-5 py-3">
                    {w.isQuality ? <Badge>Calidad</Badge> : <Badge>Normal</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nueva bodega" onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
          <Input label="Ubicación" {...register('location')} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...register('isQuality')} />
            Bodega de calidad
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
