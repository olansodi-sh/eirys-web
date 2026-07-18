import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dispatchApi, productsApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'

export default function DispatchPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'in' | 'out'>('out')
  const [reference, setReference] = useState('')
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)

  const list = useQuery({ queryKey: ['dispatch'], queryFn: dispatchApi.list })
  const products = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list() })

  const variantOptions = (products.data ?? []).flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      label: `${p.name} · ${v.size}/${v.color}`,
    })),
  )

  const create = useMutation({
    mutationFn: () => {
      const opt = variantOptions.find((o) => o.id === variantId)
      return dispatchApi.create({
        type,
        reference: reference || undefined,
        lines: opt
          ? [{ variantId, description: opt.label, quantity: qty }]
          : [],
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatch'] })
      setOpen(false)
      setReference('')
      setVariantId('')
    },
  })

  const done = useMutation({
    mutationFn: (id: string) => dispatchApi.markDone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispatch'] }),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Despacho</h1>
        {can('dispatch.write') && (
          <Button onClick={() => setOpen(true)}>Nuevo despacho</Button>
        )}
      </div>

      <Card>
        {list.isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !list.data?.length ? (
          <EmptyState message="No hay despachos" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Referencia</th>
                <th className="px-5 py-3 font-medium">Ítems</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((d) => (
                <tr key={d.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {d.number}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{d.type === 'out' ? 'Salida' : 'Entrada'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {d.reference || '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{d.lines.length}</td>
                  <td className="px-5 py-3">
                    <Badge>
                      {d.status === 'pending' ? 'Pendiente' : 'Completado'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {d.status === 'pending' && can('dispatch.write') && (
                      <Button
                        variant="secondary"
                        onClick={() => done.mutate(d.id)}
                      >
                        Marcar completado
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nuevo despacho" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={type}
              onChange={(e) => setType(e.target.value as 'in' | 'out')}
            >
              <option value="out">Salida</option>
              <option value="in">Entrada</option>
            </Select>
            <Input
              label="Referencia"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <Select
            label="Variante"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {variantOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Cantidad"
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!variantId || create.isPending}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
