import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from './AppLayout'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PosPage from '@/pages/PosPage'
import SalesPage from '@/pages/SalesPage'
import CashPage from '@/pages/CashPage'
import PriceListsPage from '@/pages/PriceListsPage'
import QuotesPage from '@/pages/QuotesPage'
import VouchersPage from '@/pages/VouchersPage'
import CreditNotesPage from '@/pages/CreditNotesPage'
import RecurringPage from '@/pages/RecurringPage'
import DispatchPage from '@/pages/DispatchPage'
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
      { path: 'pos', element: <PosPage /> },
      { path: 'ventas', element: <SalesPage /> },
      { path: 'cotizaciones', element: <QuotesPage /> },
      { path: 'vales', element: <VouchersPage /> },
      { path: 'notas-credito', element: <CreditNotesPage /> },
      { path: 'recurrentes', element: <RecurringPage /> },
      { path: 'despacho', element: <DispatchPage /> },
      { path: 'caja', element: <CashPage /> },
      { path: 'listas-precios', element: <PriceListsPage /> },
      { path: 'productos', element: <ProductsPage /> },
      { path: 'categorias', element: <CategoriesPage /> },
      { path: 'bodegas', element: <WarehousesPage /> },
      { path: 'terceros', element: <ThirdPartiesPage /> },
      { path: 'usuarios', element: <UsersPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
