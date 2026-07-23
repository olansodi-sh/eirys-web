import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/shared/api/endpoints'
import type { ImportProductsResult } from '@/shared/api/endpoints'
import type { Product } from '@/shared/types'
import { Badge, Button, Card, EmptyState, Input } from '@/shared/ui'
import { RowActions } from '@/shared/ui/RowActions'
import { InlineAlert } from '@/shared/ui/InlineAlert'
import { downloadBlob } from '@/shared/utils/download'
import { useAuth } from '@/features/auth/AuthContext'
import { ProductFormModal } from './products/ProductFormModal'

export default function ProductsPage() {
  const { can } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportProductsResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.list(search || undefined),
  })

  const remove = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const exportExcel = useMutation({
    mutationFn: () => productsApi.export(),
    onSuccess: (blob) => downloadBlob(blob, 'productos.xlsx'),
  })

  const importExcel = useMutation({
    mutationFn: () => {
      if (!importFile) throw new Error('Selecciona un archivo')
      return productsApi.importExcel(importFile)
    },
    onSuccess: (result) => {
      setImportResult(result)
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['brands'] })
      qc.invalidateQueries({ queryKey: ['materials'] })
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Productos</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportExcel.mutate()} disabled={exportExcel.isPending}>
            Descargar Excel
          </Button>
          {can('inventory.write') && (
            <Button
              onClick={() => {
                setEditing(undefined)
                setOpen(true)
              }}
            >
              Nuevo producto
            </Button>
          )}
        </div>
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
                <th className="px-5 py-3 font-medium">Material</th>
                <th className="px-5 py-3 font-medium">Variantes</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
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
                  <td className="px-5 py-3 text-slate-500">{p.brand?.name || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{p.material?.name || '—'}</td>
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
                  <td className="px-5 py-3">
                    {can('inventory.write') && (
                      <RowActions
                        onEdit={() => {
                          setEditing(p)
                          setOpen(true)
                        }}
                        onDelete={() => remove.mutate(p.id)}
                        deleteConfirm={`¿Eliminar el producto "${p.name}"?`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {can('inventory.write') && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Cargue masivo desde Excel
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Descarga el Excel de productos, complétalo (agrega filas nuevas
            con SKU nuevo para crear productos, o edita filas existentes para
            actualizarlos) y súbelo aquí. Categoría, Marca y Material se
            crean automáticamente si no existen. Características va como texto
            "clave: valor" separado por punto y coma, ej:{' '}
            <code>Suela: PVC; Tacón: 5.5cm</code>.
          </p>
          <div className="flex items-end gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-medium text-slate-600">Archivo (.xlsx)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            </label>
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
                {importResult.created} productos creados, {importResult.updated} actualizados.{' '}
                {importResult.skipped.length > 0 &&
                  `${importResult.skipped.length} filas omitidas.`}
              </InlineAlert>
              {importResult.skipped.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-500">
                  {importResult.skipped.map((s, i) => (
                    <li key={i}>
                      Fila {s.row} ({s.sku}): {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      <ProductFormModal open={open} onClose={() => setOpen(false)} product={editing} />
    </div>
  )
}
