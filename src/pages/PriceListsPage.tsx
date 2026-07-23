import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pricingApi, productsApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'

export default function PriceListsPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>('')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const { register, handleSubmit, reset } = useForm<{
    name: string
    isDefault?: boolean
  }>()

  const lists = useQuery({ queryKey: ['price-lists'], queryFn: pricingApi.list })
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  })

  useEffect(() => {
    if (!selected && lists.data?.length) setSelected(lists.data[0].id)
  }, [lists.data, selected])

  const create = useMutation({
    mutationFn: (v: { name: string; isDefault?: boolean }) =>
      pricingApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-lists'] })
      setOpen(false)
      reset()
    },
  })

  const savePrices = useMutation({
    mutationFn: () =>
      pricingApi.setPrices(
        selected,
        Object.entries(prices)
          .filter(([, p]) => p > 0)
          .map(([variantId, price]) => ({ variantId, price })),
      ),
    onSuccess: () => setPrices({}),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          Listas de precios
        </h1>
        {can('pricing.write') && (
          <Button onClick={() => setOpen(true)}>Nueva lista</Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {lists.data?.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelected(l.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              selected === l.id
                ? 'border-violet-400 bg-violet-50 text-violet-700'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            {l.name} {l.isDefault && <Badge>Default</Badge>}
          </button>
        ))}
      </div>

      <Card>
        {!products.data?.length ? (
          <EmptyState message="No hay productos para tarifar" />
        ) : !selected ? (
          <EmptyState message="Crea o selecciona una lista de precios" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Variante</th>
                <th className="px-5 py-3 font-medium">Precio</th>
              </tr>
            </thead>
            <tbody>
              {products.data.flatMap((p) =>
                p.variants.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50">
                    <td className="px-5 py-2 text-slate-600">{p.name}</td>
                    <td className="px-5 py-2 text-slate-500">
                      {v.size} / {v.color}
                    </td>
                    <td className="px-5 py-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={prices[v.id] ?? ''}
                        onChange={(e) =>
                          setPrices((prev) => ({
                            ...prev,
                            [v.id]: Number(e.target.value),
                          }))
                        }
                        className="w-32 rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
      </Card>

      {can('pricing.write') && selected && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => savePrices.mutate()}
            disabled={
              Object.keys(prices).length === 0 || savePrices.isPending
            }
          >
            {savePrices.isPending ? 'Guardando…' : 'Guardar precios'}
          </Button>
        </div>
      )}

      <Modal open={open} title="Nueva lista de precios" onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...register('isDefault')} />
            Marcar como lista por defecto
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
