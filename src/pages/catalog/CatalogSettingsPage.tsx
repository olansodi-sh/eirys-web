import { useState } from 'react'
import { brandsApi, categoriesApi, materialsApi } from '@/shared/api/endpoints'
import { Tabs } from '@/shared/ui/Tabs'
import { SimpleCatalogTab } from './SimpleCatalogTab'

const TABS = [
  { key: 'categories', label: 'Categorías' },
  { key: 'brands', label: 'Marcas' },
  { key: 'materials', label: 'Materiales' },
]

export default function CatalogSettingsPage() {
  const [tab, setTab] = useState('categories')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Catálogo</h1>
        <p className="text-sm text-gray-500">
          Configura categorías, marcas y materiales para tus productos.
        </p>
      </div>

      <div className="mb-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'categories' && (
        <SimpleCatalogTab
          api={categoriesApi}
          queryKey="categories"
          label="Categoría"
          supportsParent
        />
      )}
      {tab === 'brands' && (
        <SimpleCatalogTab api={brandsApi} queryKey="brands" label="Marca" />
      )}
      {tab === 'materials' && (
        <SimpleCatalogTab api={materialsApi} queryKey="materials" label="Material" />
      )}
    </div>
  )
}
