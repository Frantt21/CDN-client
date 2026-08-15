import { createContext, useContext, useState } from 'react'
import { api, getStoredUser, getToken, setStoredUser, setToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    getToken() ? getStoredUser() : null,
  )

  const persist = (res) => {
    setToken(res.token)
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
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }

  const updateUser = (partial) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      setStoredUser(updated)
      return updated
    })
  }

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
