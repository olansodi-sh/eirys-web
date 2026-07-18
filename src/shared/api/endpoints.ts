import { api } from './client'
import type {
  Category,
  LoginResponse,
  Product,
  Role,
  ThirdParty,
  User,
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
  remove: (id: string) =>
    api.delete(`/inventory/categories/${id}`).then((r) => r.data),
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
  brand?: string
  material?: string
  categoryId?: string
  variants?: {
    size: string
    color: string
    barcode?: string
    cost?: number
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
}
