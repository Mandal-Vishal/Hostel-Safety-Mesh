import { createContext, useState, useEffect } from 'react'
import { login as loginService, logout as logoutService, getCurrentUser } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const loggedInUser = await loginService(email, password)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function logout() {
    await logoutService()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
