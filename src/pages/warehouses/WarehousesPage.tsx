import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehousesApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/shared/ui'
import { RowActions } from '@/shared/ui/RowActions'
import { useAuth } from '@/features/auth/AuthContext'
import type { Warehouse } from '@/shared/types'

interface FormValues {
  name: string
  location?: string
  isQuality?: boolean
}

export default function WarehousesPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | undefined>(undefined)
  const { register, handleSubmit, reset } = useForm<FormValues>()

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list(),
  })

  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? { name: editing.name, location: editing.location ?? '', isQuality: editing.isQuality }
        : { name: '', location: '', isQuality: false },
    )
  }, [open, editing, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      editing ? warehousesApi.update(editing.id, v) : warehousesApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      setOpen(false)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => warehousesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Bodegas</h1>
        {can('inventory.write') && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setOpen(true)
            }}
          >
            Nueva bodega
          </Button>
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
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Ubicación</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id} className="border-b border-gray-100">
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {w.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {w.location || '—'}
                  </td>
                  <td className="px-5 py-3">
                    {w.isQuality ? <Badge>Calidad</Badge> : <Badge>Normal</Badge>}
                  </td>
                  <td className="px-5 py-3">
                    {can('inventory.write') && (
                      <RowActions
                        onEdit={() => {
                          setEditing(w)
                          setOpen(true)
                        }}
                        onDelete={() => remove.mutate(w.id)}
                        deleteConfirm={`¿Eliminar la bodega "${w.name}"?`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title={editing ? 'Editar bodega' : 'Nueva bodega'} onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
          <Input label="Ubicación" {...register('location')} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
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
            <Button type="submit" disabled={save.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
