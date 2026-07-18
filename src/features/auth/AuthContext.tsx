import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/shared/api/endpoints'
import { tokenStore } from '@/shared/api/client'
import type { AuthUser } from '@/shared/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  can: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokenStore.access) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((me) =>
        setUser({
          id: me.id,
          name: me.email,
          email: me.email,
          role: me.role,
          permissions: me.permissions,
        }),
      )
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password)
    tokenStore.set(res.accessToken, res.refreshToken)
    setUser(res.user)
  }

  function logout() {
    tokenStore.clear()
    setUser(null)
  }

  const can = (permission: string) =>
    user?.permissions.includes(permission) ?? false

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
