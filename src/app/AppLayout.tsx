import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

interface NavItem {
  to: string
  label: string
  permission?: string
}

const NAV: NavItem[] = [
  { to: '/', label: 'Panel' },
  { to: '/pos', label: 'Punto de venta', permission: 'sales.write' },
  { to: '/ventas', label: 'Ventas', permission: 'sales.read' },
  { to: '/caja', label: 'Caja', permission: 'cash.manage' },
  { to: '/listas-precios', label: 'Listas de precios', permission: 'pricing.read' },
  { to: '/productos', label: 'Productos', permission: 'inventory.read' },
  { to: '/categorias', label: 'Categorías', permission: 'inventory.read' },
  { to: '/bodegas', label: 'Bodegas', permission: 'inventory.read' },
  { to: '/terceros', label: 'Terceros', permission: 'third_parties.read' },
  { to: '/usuarios', label: 'Usuarios', permission: 'users.manage' },
]

export default function AppLayout() {
  const { user, logout, can } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 font-bold text-white">
            E
          </div>
          <span className="text-lg font-semibold text-slate-800">Eirys</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((i) => !i.permission || can(i.permission)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="text-sm font-medium text-slate-700">{user?.email}</p>
          <p className="mb-2 text-xs text-slate-400">{user?.role}</p>
          <button
            onClick={logout}
            className="text-xs font-medium text-red-500 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
