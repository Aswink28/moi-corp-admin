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
    // Validate the session on load.
    api
      .get('/auth/me')
      .then((res) => setUser((u) => ({ ...u, ...res.data.data })))
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
