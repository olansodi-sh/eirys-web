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
}

export interface Product {
  id: string
  sku: string
  name: string
  brand?: string
  material?: string
  unit: string
  active: boolean
  categoryId: string | null
  category?: Category | null
  variants: ProductVariant[]
}
