export interface AuthUser {
  id: string
  name: string
  email: string
  role: string | null
  permissions: string[]
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions?: { id: string; code: string }[]
}

export interface User {
  id: string
  name: string
  email: string
  active: boolean
  roleId: string | null
  role?: Role | null
  createdAt: string
}

export type ThirdPartyType = 'client' | 'supplier'

export interface ThirdParty {
  id: string
  type: ThirdPartyType
  name: string
  docType: string
  docNumber?: string
  email?: string
  phone?: string
  address?: string
  balance: string
  active: boolean
}

export interface Category {
  id: string
  name: string
  parentId: string | null
}

export interface Brand {
  id: string
  name: string
  active?: boolean
}

export interface Material {
  id: string
  name: string
  active?: boolean
}

export interface Warehouse {
  id: string
  name: string
  location?: string
  isQuality: boolean
  active: boolean
}

export interface ProductVariant {
  id: string
  size: string
  color: string
  barcode?: string
  cost: string
  listPrice: string | null
  discountPercent: string
  stockQty: number
}

export interface ProductImage {
  id: string
  productId: string
  variantId: string | null
  url: string
  order: number
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string | null
  characteristics?: Record<string, string> | null
  cuidados?: string | null
  brandId: string | null
  brand?: Brand | null
  materialId: string | null
  material?: Material | null
  unit: string
  active: boolean
  categoryId: string | null
  category?: Category | null
  variants: ProductVariant[]
  images?: ProductImage[]
}

export interface PriceListItem {
  id: string
  variantId: string
  variant?: ProductVariant
  price: string
}

export interface PriceList {
  id: string
  name: string
  consumidorFinal: boolean
  active: boolean
  items?: PriceListItem[]
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'voucher' | 'credit'

export interface CashMovement {
  id: string
  type: 'in' | 'out'
  amount: string
  concept: string
  createdAt: string
}

export interface CashSession {
  id: string
  status: 'open' | 'closed'
  openingAmount: string
  countedAmount: string | null
  expectedAmount: string | null
  difference: string | null
  openedAt: string
  closedAt: string | null
}

export interface SaleLine {
  id: string
  variantId?: string
  description: string
  quantity: string
  unitPrice: string
  discount: string
  total: string
}

export type SaleStatus = 'confirmed' | 'partial' | 'paid' | 'cancelled'

export interface Sale {
  id: string
  number: string
  thirdParty?: ThirdParty | null
  /** Nombre del cliente al momento de la venta (no cambia si el tercero se edita después). */
  clientName: string | null
  clientDocType: string | null
  clientDocNumber: string | null
  total: string
  paidAmount: string
  status: SaleStatus
  date: string
  lines: SaleLine[]
}

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'converted'

export interface Quote {
  id: string
  number: string
  thirdParty?: ThirdParty | null
  status: QuoteStatus
  total: string
  validUntil: string | null
  saleId: string | null
  lines: SaleLine[]
}

export interface Voucher {
  id: string
  code: string
  amount: string
  balance: string
  status: 'active' | 'redeemed' | 'expired'
  reason?: string
  thirdParty?: ThirdParty | null
}

export interface CreditNote {
  id: string
  number: string
  saleId: string
  type: 'partial' | 'total'
  amount: string
  reason?: string
  restock: boolean
  voucherId: string | null
}

export interface RecurringInvoice {
  id: string
  name: string
  frequency: 'weekly' | 'monthly'
  nextRun: string
  active: boolean
  warehouseId: string
}

export interface Dispatch {
  id: string
  number: string
  type: 'in' | 'out'
  reference?: string
  status: 'pending' | 'done'
  notes?: string
  lines: { variantId: string; description: string; quantity: number }[]
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'received'
  | 'cancelled'

export interface PurchaseOrder {
  id: string
  number: string
  supplier?: ThirdParty | null
  status: PurchaseOrderStatus
  total: string
  date: string
  warehouseId: string
  lines: {
    variantId: string
    description: string
    quantity: string
    unitCost: string
    total: string
  }[]
}

export type PurchaseDocumentType = 'invoice' | 'support_document'

export interface PurchaseInvoice {
  id: string
  number: string
  documentType: PurchaseDocumentType
  supplier?: ThirdParty | null
  supplierDocNumber?: string
  total: string
  date: string
}

export interface PurchaseDebitNote {
  id: string
  number: string
  supplierId: string
  amount: string
  reason?: string
  date: string
}
