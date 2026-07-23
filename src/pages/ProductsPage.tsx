import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, productsApi } from '@/shared/api/endpoints'
import type { ProductInput } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { useAuth } from '@/features/auth/AuthContext'

interface FormValues {
  sku: string
  name: string
  brand?: string
  material?: string
  categoryId?: string
  variants: { size: string; color: string; cost?: number }[]
}

export default function ProductsPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: { variants: [{ size: '', color: '', cost: 0 }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.list(search || undefined),
  })
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const create = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: ProductInput = {
        ...v,
        categoryId: v.categoryId || undefined,
        variants: v.variants
          .filter((x) => x.size && x.color)
          .map((x) => ({ ...x, cost: Number(x.cost) || 0 })),
      }
      return productsApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setOpen(false)
      reset({ variants: [{ size: '', color: '', cost: 0 }] })
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Productos</h1>
        {can('inventory.write') && (
          <Button onClick={() => setOpen(true)}>Nuevo producto</Button>
        )}
      </div>

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Buscar por nombre o SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        {isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !data?.length ? (
          <EmptyState message="No hay productos" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Marca</th>
                <th className="px-5 py-3 font-medium">Variantes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {p.sku}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {p.name}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.brand || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.variants?.length ? (
                        p.variants.map((v) => (
                          <Badge key={v.id}>
                            {v.size} · {v.color}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nuevo producto" onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" {...register('sku', { required: true })} />
            <Input label="Nombre" {...register('name', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marca" {...register('brand')} />
            <Input label="Material" {...register('material')} />
          </div>
          <Select label="Categoría" {...register('categoryId')}>
            <option value="">Sin categoría</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Variantes (talla / color)
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => append({ size: '', color: '', cost: 0 })}
              >
                + Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={f.id} className="flex items-end gap-2">
                  <Input
                    label={i === 0 ? 'Talla' : undefined}
                    placeholder="37"
                    {...register(`variants.${i}.size`)}
                  />
                  <Input
                    label={i === 0 ? 'Color' : undefined}
                    placeholder="Negro"
                    {...register(`variants.${i}.color`)}
                  />
                  <Input
                    label={i === 0 ? 'Costo' : undefined}
                    type="number"
                    placeholder="0"
                    {...register(`variants.${i}.cost`)}
                  />
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => remove(i)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>

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
