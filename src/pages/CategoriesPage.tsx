import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/shared/api/endpoints'
import { Button, Card, EmptyState, Input, Modal } from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'

export default function CategoriesPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ name: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const create = useMutation({
    mutationFn: (v: { name: string }) => categoriesApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setOpen(false)
      reset()
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Categorías</h1>
        {can('inventory.write') && (
          <Button onClick={() => setOpen(true)}>Nueva categoría</Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="No hay categorías" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {data.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="font-medium text-slate-700">{c.name}</span>
                {can('inventory.write') && (
                  <Button variant="danger" onClick={() => remove.mutate(c.id)}>
                    Eliminar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} title="Nueva categoría" onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
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
