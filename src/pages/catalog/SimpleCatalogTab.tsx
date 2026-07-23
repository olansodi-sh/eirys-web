import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { RowActions } from '@/shared/ui/RowActions'
import { useAuth } from '@/features/auth/AuthContext'

interface CatalogItem {
  id: string
  name: string
  parentId?: string | null
}

interface CatalogApi {
  list: () => Promise<CatalogItem[]>
  create: (dto: { name: string; parentId?: string }) => Promise<unknown>
  update: (id: string, dto: { name?: string; parentId?: string }) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
}

interface FormValues {
  name: string
  parentId?: string
}

export function SimpleCatalogTab({
  api,
  queryKey,
  label,
  supportsParent = false,
}: {
  api: CatalogApi
  queryKey: string
  label: string
  supportsParent?: boolean
}) {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | undefined>(undefined)
  const { register, handleSubmit, reset } = useForm<FormValues>()

  const { data, isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.list })

  useEffect(() => {
    if (!open) return
    reset(editing ? { name: editing.name, parentId: editing.parentId ?? '' } : { name: '', parentId: '' })
  }, [open, editing, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const dto = { name: v.name, parentId: v.parentId || undefined }
      return editing ? api.update(editing.id, dto) : api.create(dto)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] })
      setOpen(false)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {data?.length ?? 0} {label.toLowerCase()}(s)
        </span>
        {can('inventory.write') && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setOpen(true)
            }}
          >
            Nuevo/a {label.toLowerCase()}
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message={`No hay ${label.toLowerCase()}s`} />
        ) : (
          <ul className="divide-y divide-slate-50">
            {data.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-3">
                <span className="font-medium text-slate-700">{item.name}</span>
                {can('inventory.write') && (
                  <RowActions
                    onEdit={() => {
                      setEditing(item)
                      setOpen(true)
                    }}
                    onDelete={() => remove.mutate(item.id)}
                    deleteConfirm={`¿Eliminar "${item.name}"?`}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? `Editar ${label.toLowerCase()}` : `Nuevo/a ${label.toLowerCase()}`}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <Input label="Nombre" {...register('name', { required: true })} />
          {supportsParent && (
            <Select label="Categoría padre" {...register('parentId')}>
              <option value="">Sin categoría padre</option>
              {data
                ?.filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
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
