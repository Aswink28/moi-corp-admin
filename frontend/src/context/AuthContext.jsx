import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ca_user') || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ca_token')
    if (!token) {
      setLoading(false)
      return
    }
    // Validate the session on load and refresh role + screen access.
    api
      .get('/auth/me')
      .then((res) => setUser((u) => {
        const next = { ...u, ...res.data.data }
        localStorage.setItem('ca_user', JSON.stringify(next))
        return next
      }))
      .catch(() => {
        localStorage.removeItem('ca_token')
        localStorage.removeItem('ca_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: u } = res.data.data
    localStorage.setItem('ca_token', token)
    localStorage.setItem('ca_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  function logout() {
    localStorage.removeItem('ca_token')
    localStorage.removeItem('ca_user')
    setUser(null)
  }

  // True if the user may access a given Admin-Portal screen. A super_admin
  // implicitly has every screen; everyone else uses their assigned `screens`.
  const hasScreen = (key) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    return Array.isArray(user.screens) && user.screens.includes(key)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasScreen }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
