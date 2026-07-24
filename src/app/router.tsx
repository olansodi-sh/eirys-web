import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from './AppLayout'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import PosPage from '@/pages/pos/PosPage'
import SalesPage from '@/pages/sales/SalesPage'
import CashPage from '@/pages/cash/CashPage'
import PriceListsPage from '@/pages/price-lists/PriceListsPage'
import QuotesPage from '@/pages/quotes/QuotesPage'
import VouchersPage from '@/pages/vouchers/VouchersPage'
import CreditNotesPage from '@/pages/credit-notes/CreditNotesPage'
import RecurringPage from '@/pages/recurring/RecurringPage'
import DispatchPage from '@/pages/dispatch/DispatchPage'
import PurchasesPage from '@/pages/purchases/PurchasesPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import JournalPage from '@/pages/journal/JournalPage'
import TasksPage from '@/pages/tasks/TasksPage'
import ProductsPage from '@/pages/products/ProductsPage'
import CatalogSettingsPage from '@/pages/catalog/CatalogSettingsPage'
import WarehousesPage from '@/pages/warehouses/WarehousesPage'
import ThirdPartiesPage from '@/pages/third-parties/ThirdPartiesPage'
import UsersPage from '@/pages/users/UsersPage'

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
      { path: 'compras', element: <PurchasesPage /> },
      { path: 'caja', element: <CashPage /> },
      { path: 'listas-precios', element: <PriceListsPage /> },
      { path: 'reportes', element: <ReportsPage /> },
      { path: 'libro-diario', element: <JournalPage /> },
      { path: 'tareas', element: <TasksPage /> },
      { path: 'productos', element: <ProductsPage /> },
      { path: 'categorias', element: <CatalogSettingsPage /> },
      { path: 'bodegas', element: <WarehousesPage /> },
      { path: 'terceros', element: <ThirdPartiesPage /> },
      { path: 'usuarios', element: <UsersPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
