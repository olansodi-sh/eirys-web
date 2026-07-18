import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from './AppLayout'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductsPage from '@/pages/ProductsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import WarehousesPage from '@/pages/WarehousesPage'
import ThirdPartiesPage from '@/pages/ThirdPartiesPage'
import UsersPage from '@/pages/UsersPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'productos', element: <ProductsPage /> },
      { path: 'categorias', element: <CategoriesPage /> },
      { path: 'bodegas', element: <WarehousesPage /> },
      { path: 'terceros', element: <ThirdPartiesPage /> },
      { path: 'usuarios', element: <UsersPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
