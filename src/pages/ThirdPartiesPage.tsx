import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { thirdPartiesApi } from '@/shared/api/endpoints'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
} from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'
import type { ThirdPartyType } from '@/shared/types'

interface FormValues {
  type: ThirdPartyType
  name: string
  docType: string
  docNumber?: string
  email?: string
  phone?: string
  address?: string
}

export default function ThirdPartiesPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { type: 'client', docType: 'CC' },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['third-parties'],
    queryFn: () => thirdPartiesApi.list(),
  })

  const create = useMutation({
    mutationFn: (v: FormValues) => thirdPartiesApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['third-parties'] })
      setOpen(false)
      reset()
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Terceros</h1>
        {can('third_parties.write') && (
          <Button onClick={() => setOpen(true)}>Nuevo tercero</Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="No hay terceros registrados" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {t.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {t.docType} {t.docNumber || ''}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {t.phone || t.email || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>
                      {t.type === 'client' ? 'Cliente' : 'Proveedor'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nuevo tercero" onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" {...register('type')}>
              <option value="client">Cliente</option>
              <option value="supplier">Proveedor</option>
            </Select>
            <Select label="Tipo documento" {...register('docType')}>
              <option value="CC">CC</option>
              <option value="NIT">NIT</option>
              <option value="CE">CE</option>
              <option value="PASSPORT">Pasaporte</option>
            </Select>
          </div>
          <Input label="Número documento" {...register('docNumber')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" {...register('phone')} />
            <Input label="Correo" type="email" {...register('email')} />
          </div>
          <Input label="Dirección" {...register('address')} />
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
