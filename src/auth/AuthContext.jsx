import { createContext, useContext, useEffect, useState } from 'react'
import {
  api,
  getStoredUser,
  getToken,
  setRefreshToken,
  setStoredUser,
  setToken,
} from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    getToken() ? getStoredUser() : null,
  )

  const clearSession = () => {
    setToken(null)
    setRefreshToken(null)
    setStoredUser(null)
    setUser(null)
  }

  const persist = (res) => {
    setToken(res.token)
    setRefreshToken(res.refreshToken)
    setStoredUser(res)
    setUser(res)
  }

  const login = async (email, password) => {
    persist(await api.login({ email, password }))
  }

  const register = async (data) => {
    persist(await api.register(data))
  }

  const logout = () => {
    clearSession()
  }

  const updateUser = (partial) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      setStoredUser(updated)
      return updated
    })
  }

  useEffect(() => {
    const onExpired = () => clearSession()
    window.addEventListener('cdn:auth:expired', onExpired)
    return () => window.removeEventListener('cdn:auth:expired', onExpired)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}