import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  brandsApi,
  categoriesApi,
  materialsApi,
  productsApi,
} from '@/shared/api/endpoints'
import type { ProductInput } from '@/shared/api/endpoints'
import type { Product } from '@/shared/types'
import { Button, Input, Modal, Select } from '@/shared/ui'
import { ProductImageGallery } from './ProductImageGallery'

interface FormValues {
  sku: string
  name: string
  description?: string
  cuidados?: string
  brandId?: string
  materialId?: string
  categoryId?: string
  variants: {
    id?: string
    size: string
    color: string
    cost?: number
    listPrice?: number
    discountPercent?: number
    stockQty?: number
  }[]
  characteristics: { key: string; value: string }[]
}

/** Precio final de venta = precio sin descuento menos el % de descuento, calculado en vivo. */
function VariantFinalPrice({ control, index }: { control: Control<FormValues>; index: number }) {
  const listPrice = useWatch({ control, name: `variants.${index}.listPrice` })
  const discountPercent = useWatch({ control, name: `variants.${index}.discountPercent` })
  const price = Number(listPrice) > 0 ? Number(listPrice) * (1 - (Number(discountPercent) || 0) / 100) : 0
  return (
    <Input
      label={index === 0 ? 'Precio' : undefined}
      type="text"
      readOnly
      value={price.toFixed(2)}
      className="cursor-not-allowed bg-gray-100 text-gray-500"
    />
  )
}

const emptyVariant = { size: '', color: '', cost: 0, listPrice: undefined, discountPercent: 0, stockQty: 0 }

const emptyValues: FormValues = {
  sku: '',
  name: '',
  description: '',
  cuidados: '',
  brandId: '',
  materialId: '',
  categoryId: '',
  variants: [emptyVariant],
  characteristics: [],
}

export function ProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product?: Product
}) {
  const qc = useQueryClient()
  const isEdit = !!product

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: emptyValues,
  })
  const variantFields = useFieldArray({ control, name: 'variants' })
  const charFields = useFieldArray({ control, name: 'characteristics' })

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() })
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => brandsApi.list() })
  const materials = useQuery({ queryKey: ['materials'], queryFn: () => materialsApi.list() })

  useEffect(() => {
    if (!open) return
    if (product) {
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        cuidados: product.cuidados ?? '',
        brandId: product.brandId ?? '',
        materialId: product.materialId ?? '',
        categoryId: product.categoryId ?? '',
        variants: product.variants?.length
          ? product.variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              cost: Number(v.cost) || 0,
              listPrice: v.listPrice !== null ? Number(v.listPrice) : undefined,
              discountPercent: Number(v.discountPercent) || 0,
              stockQty: v.stockQty ?? 0,
            }))
          : [emptyVariant],
        characteristics: Object.entries(product.characteristics ?? {}).map(
          ([key, value]) => ({ key, value }),
        ),
      })
    } else {
      reset(emptyValues)
    }
  }, [open, product, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: ProductInput = {
        sku: v.sku,
        name: v.name,
        description: v.description || undefined,
        cuidados: v.cuidados || undefined,
        brandId: v.brandId || undefined,
        materialId: v.materialId || undefined,
        categoryId: v.categoryId || undefined,
        characteristics: Object.fromEntries(
          v.characteristics
            .filter((c) => c.key.trim())
            .map((c) => [c.key.trim(), c.value]),
        ),
        variants: v.variants
          .filter((x) => x.size && x.color)
          .map((x) => ({
            ...x,
            cost: Number(x.cost) || 0,
            listPrice: x.listPrice !== undefined && x.listPrice !== null && `${x.listPrice}` !== '' ? Number(x.listPrice) : undefined,
            discountPercent: Number(x.discountPercent) || 0,
            stockQty: Number(x.stockQty) || 0,
          })),
      }
      return isEdit ? productsApi.update(product!.id, payload) : productsApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      size="4xl"
    >
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Input label="SKU" {...register('sku', { required: true })} />
          <Input label="Nombre" {...register('name', { required: true })} />
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Descripción</span>
          <textarea
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            rows={3}
            placeholder="Descripción para mostrar en el ecommerce…"
            {...register('description')}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Cuidados</span>
          <textarea
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            rows={2}
            placeholder="Instrucciones de cuidado del producto…"
            {...register('cuidados')}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Marca" {...register('brandId')}>
            <option value="">Sin marca</option>
            {brands.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select label="Material" {...register('materialId')}>
            <option value="">Sin material</option>
            {materials.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
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
            <span className="text-sm font-medium text-gray-700">
              Características (ficha técnica)
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => charFields.append({ key: '', value: '' })}
            >
              + Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {charFields.fields.map((f, i) => (
              <div key={f.id} className="flex items-end gap-2">
                <Input
                  label={i === 0 ? 'Atributo' : undefined}
                  placeholder="Material suela"
                  {...register(`characteristics.${i}.key`)}
                />
                <Input
                  label={i === 0 ? 'Valor' : undefined}
                  placeholder="Goma"
                  {...register(`characteristics.${i}.value`)}
                />
                <Button type="button" variant="danger" onClick={() => charFields.remove(i)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Variantes (talla / color)
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => variantFields.append(emptyVariant)}
            >
              + Agregar
            </Button>
          </div>
          <p className="mb-2 text-xs text-gray-500">
            El "Precio" se calcula automáticamente (Precio sin descuento − % Descuento) y se
            guarda como el precio de la variante en la lista "Consumidor final".
          </p>
          <div className="space-y-2">
            {variantFields.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_1fr_90px_90px_80px_70px_90px_auto] items-end gap-2">
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
                <Input
                  label={i === 0 ? 'Precio sin desc.' : undefined}
                  type="number"
                  placeholder="0"
                  {...register(`variants.${i}.listPrice`)}
                />
                <Input
                  label={i === 0 ? '% Desc.' : undefined}
                  type="number"
                  placeholder="0"
                  {...register(`variants.${i}.discountPercent`)}
                />
                <Input
                  label={i === 0 ? 'Stock' : undefined}
                  type="number"
                  placeholder="0"
                  {...register(`variants.${i}.stockQty`)}
                />
                <VariantFinalPrice control={control} index={i} />
                <Button type="button" variant="danger" onClick={() => variantFields.remove(i)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Imágenes por variante</span>
          </div>
          {!isEdit && (
            <p className="text-xs text-gray-500">
              Guarda el producto primero; luego podrás subir imágenes para cada variante.
            </p>
          )}
          {isEdit && product && (
            <div className="space-y-3">
              {product.variants.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Agrega y guarda al menos una variante para poder subirle imágenes.
                </p>
              ) : (
                product.variants.map((v) => (
                  <div key={v.id} className="rounded-md border border-gray-300 p-3">
                    <ProductImageGallery
                      productId={product.id}
                      variantId={v.id}
                      title={`${v.size} / ${v.color}`}
                      emptyLabel="Esta variante aún no tiene imágenes."
                      images={(product.images ?? []).filter((img) => img.variantId === v.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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
