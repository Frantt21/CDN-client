import { createContext, useContext, useState, type ReactNode } from 'react'
import { api, getStoredUser, getToken, setStoredUser, setToken, type RegisterData } from '../api'
import type { AuthResponse } from '../types'

interface AuthContextValue {
  user: AuthResponse | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() =>
    getToken() ? getStoredUser() : null,
  )

  const persist = (res: AuthResponse) => {
    setToken(res.token)
    setStoredUser(res)
    setUser(res)
  }

  const login = async (email: string, password: string) => {
    persist(await api.login({ email, password }))
  }

  const register = async (data: RegisterData) => {
    persist(await api.register(data))
  }

  const logout = () => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
