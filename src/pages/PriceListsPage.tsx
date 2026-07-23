import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pricingApi, productsApi } from '@/shared/api/endpoints'
import type { ImportPriceListResult } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/shared/ui'
import { RowActions } from '@/shared/ui/RowActions'
import { InlineAlert } from '@/shared/ui/InlineAlert'
import { downloadBlob } from '@/shared/utils/download'
import { useAuth } from '@/features/auth/AuthContext'

export default function PriceListsPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingList, setEditingList] = useState<{ id: string; name: string } | undefined>(undefined)
  const [selected, setSelected] = useState<string>('')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const { register, handleSubmit, reset } = useForm<{
    name: string
    consumidorFinal?: boolean
  }>()
  const renameForm = useForm<{ name: string }>()

  const [importMode, setImportMode] = useState<'create' | 'update'>('create')
  const [importName, setImportName] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportPriceListResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lists = useQuery({ queryKey: ['price-lists'], queryFn: pricingApi.list })
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  })
  const selectedList = useQuery({
    queryKey: ['price-list', selected],
    queryFn: () => pricingApi.get(selected),
    enabled: !!selected,
  })

  useEffect(() => {
    if (!selected && lists.data?.length) setSelected(lists.data[0].id)
  }, [lists.data, selected])

  useEffect(() => {
    if (!selectedList.data) {
      setPrices({})
      return
    }
    setPrices(
      Object.fromEntries(
        (selectedList.data.items ?? []).map((i) => [i.variantId, Number(i.price)]),
      ),
    )
  }, [selectedList.data])

  const create = useMutation({
    mutationFn: (v: { name: string; consumidorFinal?: boolean }) =>
      pricingApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-lists'] })
      setOpen(false)
      reset()
    },
  })

  const rename = useMutation({
    mutationFn: (v: { name: string }) => pricingApi.update(editingList!.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-lists'] })
      setEditingList(undefined)
    },
  })

  const removeList = useMutation({
    mutationFn: (id: string) => pricingApi.remove(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['price-lists'] })
      if (selected === id) setSelected('')
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-list', selected] }),
  })

  const importExcel = useMutation({
    mutationFn: () => {
      if (!importFile) throw new Error('Selecciona un archivo')
      return pricingApi.importExcel(
        importFile,
        importName || undefined,
        importMode === 'update' ? selected : undefined,
      )
    },
    onSuccess: (result) => {
      setImportResult(result)
      qc.invalidateQueries({ queryKey: ['price-lists'] })
      qc.invalidateQueries({ queryKey: ['price-list', result.priceListId] })
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          Listas de precios
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              productsApi.export().then((blob) => downloadBlob(blob, 'productos.xlsx'))
            }
          >
            Descargar productos
          </Button>
          {can('pricing.write') && (
            <Button onClick={() => setOpen(true)}>Nueva lista</Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {lists.data?.map((l) => (
          <div
            key={l.id}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-sm font-medium ${
              selected === l.id
                ? 'border-violet-400 bg-violet-50 text-violet-700'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            <button onClick={() => setSelected(l.id)} className="px-1">
              {l.name} {l.consumidorFinal && <Badge>Consumidor final</Badge>}
            </button>
            {can('pricing.write') && (
              <RowActions
                onEdit={() => {
                  setEditingList({ id: l.id, name: l.name })
                  renameForm.reset({ name: l.name })
                }}
                onDelete={() => removeList.mutate(l.id)}
                deleteConfirm={`¿Eliminar la lista "${l.name}"?`}
              />
            )}
          </div>
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

      {can('pricing.write') && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Importar desde Excel
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Descarga el Excel de productos, asigna un precio en la columna
            "Precio" y súbelo aquí para crear o actualizar una lista de
            precios.
          </p>
          <div className="mb-3 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={importMode === 'create'}
                onChange={() => setImportMode('create')}
              />
              Crear nueva lista
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={importMode === 'update'}
                disabled={!selected}
                onChange={() => setImportMode('update')}
              />
              Actualizar la lista seleccionada
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={importMode === 'update' ? 'Nuevo nombre (opcional)' : 'Nombre de la lista'}
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Archivo (.xlsx)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => importExcel.mutate()}
              disabled={!importFile || importExcel.isPending}
            >
              {importExcel.isPending ? 'Importando…' : 'Importar'}
            </Button>
          </div>
          {importResult && (
            <div className="mt-4">
              <InlineAlert kind={importResult.skipped.length ? 'error' : 'success'}>
                Se aplicaron {importResult.applied} precios.{' '}
                {importResult.skipped.length > 0 &&
                  `${importResult.skipped.length} filas omitidas.`}
              </InlineAlert>
              {importResult.skipped.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-500">
                  {importResult.skipped.map((s, i) => (
                    <li key={i}>
                      Fila {s.row} ({s.sku} {s.size}/{s.color}): {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      <Modal open={open} title="Nueva lista de precios" onClose={() => setOpen(false)}>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...register('name', { required: true })} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...register('consumidorFinal')} />
            Marcar como lista de consumidor final
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

      <Modal
        open={!!editingList}
        title="Renombrar lista de precios"
        onClose={() => setEditingList(undefined)}
      >
        <form
          onSubmit={renameForm.handleSubmit((v) => rename.mutate(v))}
          className="space-y-4"
        >
          <Input label="Nombre" {...renameForm.register('name', { required: true })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingList(undefined)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={rename.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
