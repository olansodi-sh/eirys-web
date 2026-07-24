import { api } from './client'
import type {
  Brand,
  CashSession,
  Category,
  CreditNote,
  Dispatch,
  LoginResponse,
  Material,
  PaymentMethod,
  PriceList,
  Product,
  ProductImage,
  PurchaseDebitNote,
  PurchaseDocumentType,
  PurchaseInvoice,
  PurchaseOrder,
  Quote,
  RecurringInvoice,
  Role,
  Sale,
  ThirdParty,
  User,
  Voucher,
  Warehouse,
} from '@/shared/types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const usersApi = {
  list: () => api.get<User[]>('/users').then((r) => r.data),
  create: (dto: Partial<User> & { password: string }) =>
    api.post<User>('/users', dto).then((r) => r.data),
  update: (id: string, dto: Partial<User> & { password?: string }) =>
    api.patch<User>(`/users/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
}

export const rolesApi = {
  list: () => api.get<Role[]>('/roles').then((r) => r.data),
}

export const thirdPartiesApi = {
  list: (params?: { type?: string; search?: string }) =>
    api.get<ThirdParty[]>('/third-parties', { params }).then((r) => r.data),
  create: (dto: Partial<ThirdParty>) =>
    api.post<ThirdParty>('/third-parties', dto).then((r) => r.data),
  update: (id: string, dto: Partial<ThirdParty>) =>
    api.patch<ThirdParty>(`/third-parties/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete(`/third-parties/${id}`).then((r) => r.data),
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/inventory/categories').then((r) => r.data),
  create: (dto: { name: string; parentId?: string }) =>
    api.post<Category>('/inventory/categories', dto).then((r) => r.data),
  update: (id: string, dto: { name?: string; parentId?: string }) =>
    api.patch<Category>(`/inventory/categories/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/inventory/categories/${id}`).then((r) => r.data),
}

export const brandsApi = {
  list: () => api.get<Brand[]>('/inventory/brands').then((r) => r.data),
  create: (dto: { name: string; active?: boolean }) =>
    api.post<Brand>('/inventory/brands', dto).then((r) => r.data),
  update: (id: string, dto: { name?: string; active?: boolean }) =>
    api.patch<Brand>(`/inventory/brands/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/inventory/brands/${id}`).then((r) => r.data),
}

export const materialsApi = {
  list: () => api.get<Material[]>('/inventory/materials').then((r) => r.data),
  create: (dto: { name: string; active?: boolean }) =>
    api.post<Material>('/inventory/materials', dto).then((r) => r.data),
  update: (id: string, dto: { name?: string; active?: boolean }) =>
    api.patch<Material>(`/inventory/materials/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/inventory/materials/${id}`).then((r) => r.data),
}

export const warehousesApi = {
  list: () => api.get<Warehouse[]>('/inventory/warehouses').then((r) => r.data),
  create: (dto: Partial<Warehouse>) =>
    api.post<Warehouse>('/inventory/warehouses', dto).then((r) => r.data),
  update: (id: string, dto: Partial<Warehouse>) =>
    api.patch<Warehouse>(`/inventory/warehouses/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/inventory/warehouses/${id}`).then((r) => r.data),
}

export interface ProductInput {
  sku: string
  name: string
  description?: string
  characteristics?: Record<string, string>
  cuidados?: string
  brandId?: string
  materialId?: string
  categoryId?: string
  variants?: {
    id?: string
    size: string
    color: string
    barcode?: string
    cost?: number
    listPrice?: number
    discountPercent?: number
    stockQty?: number
  }[]
}

export const productsApi = {
  list: (search?: string) =>
    api
      .get<Product[]>('/inventory/products', { params: { search } })
      .then((r) => r.data),
  create: (dto: ProductInput) =>
    api.post<Product>('/inventory/products', dto).then((r) => r.data),
  update: (id: string, dto: Partial<ProductInput>) =>
    api.patch<Product>(`/inventory/products/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/inventory/products/${id}`).then((r) => r.data),
  export: (priceListId?: string) =>
    api
      .get('/inventory/products/export', {
        params: { priceListId },
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
  importExcel: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api
      .post<ImportProductsResult>('/inventory/products/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  uploadImage: (productId: string, file: File, variantId?: string | null) => {
    const fd = new FormData()
    fd.append('file', file)
    if (variantId) fd.append('variantId', variantId)
    return api
      .post<ProductImage>(`/inventory/products/${productId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  replaceImage: (productId: string, imageId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api
      .patch<ProductImage>(`/inventory/products/${productId}/images/${imageId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  removeImage: (productId: string, imageId: string) =>
    api
      .delete(`/inventory/products/${productId}/images/${imageId}`)
      .then((r) => r.data),
}

export interface ImportProductsResult {
  created: number
  updated: number
  skipped: { row: number; sku: string; reason: string }[]
}

export interface ImportPriceListResult {
  priceListId: string
  applied: number
  skipped: { row: number; sku: string; size: string; color: string; reason: string }[]
}

export const pricingApi = {
  list: () =>
    api.get<PriceList[]>('/pricing/price-lists').then((r) => r.data),
  get: (id: string) =>
    api.get<PriceList>(`/pricing/price-lists/${id}`).then((r) => r.data),
  create: (dto: { name: string; consumidorFinal?: boolean }) =>
    api.post<PriceList>('/pricing/price-lists', dto).then((r) => r.data),
  update: (id: string, dto: { name?: string; consumidorFinal?: boolean; active?: boolean }) =>
    api.patch<PriceList>(`/pricing/price-lists/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/pricing/price-lists/${id}`).then((r) => r.data),
  setPrices: (
    id: string,
    items: { variantId: string; price: number }[],
  ) =>
    api
      .post(`/pricing/price-lists/${id}/prices`, { items })
      .then((r) => r.data),
  getPrice: (variantId: string, priceListId?: string) =>
    api
      .get<{ variantId: string; price: number }>('/pricing/price-lists/price', {
        params: { variantId, priceListId },
      })
      .then((r) => r.data),
  importExcel: (file: File, name?: string, priceListId?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (name) fd.append('name', name)
    if (priceListId) fd.append('priceListId', priceListId)
    return api
      .post<ImportPriceListResult>('/pricing/price-lists/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}

export const cashApi = {
  current: () =>
    api.get<CashSession | null>('/cash/current').then((r) => r.data),
  open: (openingAmount: number) =>
    api.post<CashSession>('/cash/open', { openingAmount }).then((r) => r.data),
  close: (countedAmount: number) =>
    api.post<CashSession>('/cash/close', { countedAmount }).then((r) => r.data),
  movementIn: (concept: string, amount: number) =>
    api.post('/cash/movements/in', { concept, amount }).then((r) => r.data),
  movementOut: (concept: string, amount: number) =>
    api.post('/cash/movements/out', { concept, amount }).then((r) => r.data),
  movements: (sessionId: string) =>
    api.get(`/cash/${sessionId}/movements`).then((r) => r.data),
}

export interface SalePayload {
  warehouseId: string
  thirdPartyId?: string
  priceListId?: string
  lines: {
    variantId: string
    quantity: number
    unitPrice: number
    discount?: number
  }[]
  payment?: { method: PaymentMethod; amount: number }
}

export interface SalesFilter {
  search?: string
  from?: string
  to?: string
}

export const salesApi = {
  list: (params?: SalesFilter) =>
    api.get<Sale[]>('/sales', { params }).then((r) => r.data),
  get: (id: string) => api.get<Sale>(`/sales/${id}`).then((r) => r.data),
  create: (dto: SalePayload) =>
    api.post<Sale>('/sales', dto).then((r) => r.data),
}

export interface QuoteLineInput {
  variantId: string
  quantity: number
  unitPrice: number
}

export const quotesApi = {
  list: () => api.get<Quote[]>('/quotes').then((r) => r.data),
  get: (id: string) => api.get<Quote>(`/quotes/${id}`).then((r) => r.data),
  create: (dto: {
    thirdPartyId?: string
    validUntil?: string
    lines: QuoteLineInput[]
  }) => api.post<Quote>('/quotes', dto).then((r) => r.data),
  update: (
    id: string,
    dto: { thirdPartyId?: string; validUntil?: string; lines?: QuoteLineInput[] },
  ) => api.patch<Quote>(`/quotes/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete(`/quotes/${id}`).then((r) => r.data),
  convert: (id: string, warehouseId: string) =>
    api
      .post<Sale>(`/quotes/${id}/convert`, { warehouseId })
      .then((r) => r.data),
}

export const vouchersApi = {
  list: () => api.get<Voucher[]>('/vouchers').then((r) => r.data),
  create: (dto: { amount: number; reason?: string; thirdPartyId?: string }) =>
    api.post<Voucher>('/vouchers', dto).then((r) => r.data),
  redeem: (code: string, amount: number) =>
    api.post<Voucher>(`/vouchers/${code}/redeem`, { amount }).then((r) => r.data),
}

export const creditNotesApi = {
  list: () => api.get<CreditNote[]>('/credit-notes').then((r) => r.data),
  create: (dto: {
    saleId: string
    type: 'partial' | 'total'
    amount?: number
    reason?: string
    restock?: boolean
    generateVoucher?: boolean
  }) => api.post<CreditNote>('/credit-notes', dto).then((r) => r.data),
}

export const recurringApi = {
  list: () =>
    api.get<RecurringInvoice[]>('/recurring').then((r) => r.data),
  create: (dto: {
    name: string
    warehouseId: string
    thirdPartyId?: string
    frequency: 'weekly' | 'monthly'
    nextRun: string
    lines: QuoteLineInput[]
  }) => api.post<RecurringInvoice>('/recurring', dto).then((r) => r.data),
  run: () =>
    api
      .post<{ generated: number; numbers: string[] }>('/recurring/run')
      .then((r) => r.data),
}

export const dispatchApi = {
  list: () => api.get<Dispatch[]>('/dispatch').then((r) => r.data),
  create: (dto: {
    type: 'in' | 'out'
    reference?: string
    notes?: string
    lines: { variantId: string; description: string; quantity: number }[]
  }) => api.post<Dispatch>('/dispatch', dto).then((r) => r.data),
  markDone: (id: string) =>
    api.patch<Dispatch>(`/dispatch/${id}/done`).then((r) => r.data),
}

export interface PurchaseLineInput {
  variantId: string
  quantity: number
  unitCost: number
}

export const purchasesApi = {
  listOrders: () =>
    api.get<PurchaseOrder[]>('/purchases/orders').then((r) => r.data),
  createOrder: (dto: {
    supplierId: string
    warehouseId: string
    lines: PurchaseLineInput[]
  }) => api.post<PurchaseOrder>('/purchases/orders', dto).then((r) => r.data),

  listInvoices: () =>
    api.get<PurchaseInvoice[]>('/purchases/invoices').then((r) => r.data),
  createInvoice: (dto: {
    documentType: PurchaseDocumentType
    supplierId: string
    warehouseId: string
    purchaseOrderId?: string
    supplierDocNumber?: string
    lines: PurchaseLineInput[]
  }) =>
    api.post<PurchaseInvoice>('/purchases/invoices', dto).then((r) => r.data),

  listDebitNotes: () =>
    api.get<PurchaseDebitNote[]>('/purchases/debit-notes').then((r) => r.data),
  createDebitNote: (dto: {
    supplierId: string
    purchaseInvoiceId?: string
    amount: number
    reason?: string
  }) =>
    api
      .post<PurchaseDebitNote>('/purchases/debit-notes', dto)
      .then((r) => r.data),
}

export const reportsApi = {
  daily: (date?: string) =>
    api.get('/reports/daily', { params: { date } }).then((r) => r.data),
  commercial360: () =>
    api.get('/reports/commercial-360').then((r) => r.data),
  costByProduct: () =>
    api.get('/reports/cost-by-product').then((r) => r.data),
  costByWarehouse: () =>
    api.get('/reports/cost-by-warehouse').then((r) => r.data),
  journal: (from: string, to: string) =>
    api.get('/reports/journal', { params: { from, to } }).then((r) => r.data),
}

export interface BoardColumn {
  id: string
  name: string
  order: number
  tasks: {
    id: string
    title: string
    description?: string
    columnId: string
    order: number
  }[]
}

export const tasksApi = {
  board: () => api.get<BoardColumn[]>('/tasks/board').then((r) => r.data),
  createTask: (dto: {
    title: string
    description?: string
    columnId: string
  }) => api.post('/tasks', dto).then((r) => r.data),
  move: (id: string, columnId: string, order: number) =>
    api.patch(`/tasks/${id}/move`, { columnId, order }).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
}
