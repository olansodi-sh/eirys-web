import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { thirdPartiesApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState } from '@/shared/ui'
import { RowActions } from '@/shared/ui/RowActions'
import { useAuth } from '@/features/auth/AuthContext'
import type { ThirdParty } from '@/shared/types'
import { ThirdPartyFormModal } from './third-parties/ThirdPartyFormModal'

export default function ThirdPartiesPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ThirdParty | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['third-parties'],
    queryFn: () => thirdPartiesApi.list(),
  })

  const remove = useMutation({
    mutationFn: (id: string) => thirdPartiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['third-parties'] }),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Terceros</h1>
        {can('third_parties.write') && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setOpen(true)
            }}
          >
            Nuevo tercero
          </Button>
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
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {t.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {t.docType} {t.docNumber || ''}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {t.phone || t.email || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>
                      {t.type === 'client' ? 'Cliente' : 'Proveedor'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {can('third_parties.write') && (
                      <RowActions
                        onEdit={() => {
                          setEditing(t)
                          setOpen(true)
                        }}
                        onDelete={() => remove.mutate(t.id)}
                        deleteConfirm={`¿Eliminar a "${t.name}"?`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ThirdPartyFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
      />
    </div>
  )
}
