import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesApi, usersApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { RowActions } from '@/shared/ui/RowActions'
import type { User } from '@/shared/types'

interface FormValues {
  name: string
  email: string
  password?: string
  roleId?: string
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>(undefined)
  const { register, handleSubmit, reset } = useForm<FormValues>()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.list() })

  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? { name: editing.name, email: editing.email, password: '', roleId: editing.roleId ?? '' }
        : { name: '', email: '', password: '', roleId: '' },
    )
  }, [open, editing, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const dto = { ...v, roleId: v.roleId || null, password: v.password || undefined }
      return editing ? usersApi.update(editing.id, dto) : usersApi.create({ ...dto, password: v.password! })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Usuarios</h1>
        <Button
          onClick={() => {
            setEditing(undefined)
            setOpen(true)
          }}
        >
          Nuevo usuario
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="No hay usuarios" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Correo</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {u.role?.name || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{u.active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <RowActions
                      onEdit={() => {
                        setEditing(u)
                        setOpen(true)
                      }}
                      onDelete={() => remove.mutate(u.id)}
                      deleteConfirm={`¿Eliminar al usuario "${u.name}"?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
          <Input
            label="Correo"
            type="email"
            {...register('email', { required: true })}
          />
          <Input
            label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            type="password"
            {...register('password', { required: !editing, minLength: 6 })}
          />
          <Select label="Rol" {...register('roleId')}>
            <option value="">Sin rol</option>
            {roles.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
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
