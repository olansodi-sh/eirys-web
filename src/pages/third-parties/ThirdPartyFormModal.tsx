import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { thirdPartiesApi } from '@/shared/api/endpoints'
import { Button, Input, Modal, Select } from '@/shared/ui'
import type { ThirdParty, ThirdPartyType } from '@/shared/types'

interface FormValues {
  type: ThirdPartyType
  name: string
  docType: string
  docNumber?: string
  email?: string
  phone?: string
  address?: string
}

export function ThirdPartyFormModal({
  open,
  onClose,
  editing,
  defaultType = 'client',
  lockType = false,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  editing?: ThirdParty
  defaultType?: ThirdPartyType
  lockType?: boolean
  onSaved?: (thirdParty: ThirdParty) => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { type: defaultType, docType: 'CC' },
  })

  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            type: editing.type,
            name: editing.name,
            docType: editing.docType,
            docNumber: editing.docNumber ?? '',
            email: editing.email ?? '',
            phone: editing.phone ?? '',
            address: editing.address ?? '',
          }
        : { type: defaultType, docType: 'CC' },
    )
  }, [open, editing, defaultType, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      editing ? thirdPartiesApi.update(editing.id, v) : thirdPartiesApi.create(v),
    onSuccess: (thirdParty) => {
      qc.invalidateQueries({ queryKey: ['third-parties'] })
      onSaved?.(thirdParty)
      onClose()
    },
  })

  return (
    <Modal open={open} title={editing ? 'Editar tercero' : 'Nuevo tercero'} onClose={onClose}>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Input label="Nombre" {...register('name', { required: true })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" disabled={lockType} {...register('type')}>
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
