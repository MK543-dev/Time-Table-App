import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('timeforge_user') || 'null')
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('timeforge_token')
    if (token) {
      authAPI.me()
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('timeforge_user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('timeforge_token')
          localStorage.removeItem('timeforge_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login(email, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('timeforge_token', access_token)
    localStorage.setItem('timeforge_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (data) => {
    const res = await authAPI.register(data)
    const { access_token, user: userData } = res.data
    localStorage.setItem('timeforge_token', access_token)
    localStorage.setItem('timeforge_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('timeforge_token')
    localStorage.removeItem('timeforge_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
