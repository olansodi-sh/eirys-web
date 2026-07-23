import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  productsApi,
  recurringApi,
  warehousesApi,
} from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'

export default function RecurringPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly')
  const [nextRun, setNextRun] = useState('')
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)
  const [msg, setMsg] = useState('')

  const list = useQuery({ queryKey: ['recurring'], queryFn: recurringApi.list })
  const products = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list() })
  const warehouses = useQuery({ queryKey: ['warehouses'], queryFn: warehousesApi.list })

  const variantOptions = (products.data ?? []).flatMap((p) =>
    p.variants.map((v) => ({ id: v.id, label: `${p.name} · ${v.size}/${v.color}` })),
  )

  const create = useMutation({
    mutationFn: () =>
      recurringApi.create({
        name,
        warehouseId: warehouses.data?.[0]?.id ?? '',
        frequency,
        nextRun,
        lines: [{ variantId, quantity: qty, unitPrice: price }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      setOpen(false)
      setName('')
    },
  })

  const run = useMutation({
    mutationFn: recurringApi.run,
    onSuccess: (r) => {
      setMsg(
        r.generated
          ? `Generadas ${r.generated} facturas: ${r.numbers.join(', ')}`
          : 'No hay plantillas vencidas',
      )
      qc.invalidateQueries({ queryKey: ['recurring'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          Facturas recurrentes
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => run.mutate()}>
            Ejecutar vencidas
          </Button>
          <Button onClick={() => setOpen(true)}>Nueva plantilla</Button>
        </div>
      </div>

      {msg && <p className="mb-4 text-sm text-violet-700">{msg}</p>}

      <Card>
        {list.isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !list.data?.length ? (
          <EmptyState message="No hay plantillas recurrentes" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Frecuencia</th>
                <th className="px-5 py-3 font-medium">Próxima ejecución</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {r.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {r.frequency === 'monthly' ? 'Mensual' : 'Semanal'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{r.nextRun}</td>
                  <td className="px-5 py-3">
                    <Badge>{r.active ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nueva plantilla recurrente" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Frecuencia"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly')}
            >
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
            </Select>
            <Input
              label="Próxima ejecución"
              type="date"
              value={nextRun}
              onChange={(e) => setNextRun(e.target.value)}
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cantidad"
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <Input
              label="Precio"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!name || !nextRun || !variantId || create.isPending}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
