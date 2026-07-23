import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/shared/api/endpoints'
import type { ProductImage } from '@/shared/types'
import { Button } from '@/shared/ui'

export function ProductImageGallery({
  productId,
  variantId = null,
  title = 'Imágenes',
  emptyLabel = 'Aún no hay imágenes.',
  images,
}: {
  productId: string
  variantId?: string | null
  title?: string
  emptyLabel?: string
  images: ProductImage[]
}) {
  const qc = useQueryClient()
  const addInputRef = useRef<HTMLInputElement>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['products'] })

  const upload = useMutation({
    mutationFn: (file: File) => productsApi.uploadImage(productId, file, variantId),
    onSuccess: () => {
      invalidate()
      if (addInputRef.current) addInputRef.current.value = ''
    },
  })

  const replace = useMutation({
    mutationFn: ({ imageId, file }: { imageId: string; file: File }) =>
      productsApi.replaceImage(productId, imageId, file),
    onSuccess: () => {
      invalidate()
      setReplacingId(null)
      if (replaceInputRef.current) replaceInputRef.current.value = ''
    },
  })

  const remove = useMutation({
    mutationFn: (imageId: string) => productsApi.removeImage(productId, imageId),
    onSuccess: () => invalidate(),
  })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <label className="cursor-pointer text-sm font-medium text-violet-600 hover:underline">
          + Subir imagen
          <input
            ref={addInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload.mutate(file)
            }}
          />
        </label>
      </div>

      {!images.length ? (
        <p className="text-xs text-slate-400">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
              <img src={img.url} alt="" className="h-24 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-2 !py-1 text-xs"
                  onClick={() => {
                    setReplacingId(img.id)
                    replaceInputRef.current?.click()
                  }}
                >
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="!px-2 !py-1 text-xs"
                  onClick={() => {
                    if (window.confirm('¿Eliminar esta imagen?')) remove.mutate(img.id)
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && replacingId) replace.mutate({ imageId: replacingId, file })
        }}
      />
    </div>
  )
}
