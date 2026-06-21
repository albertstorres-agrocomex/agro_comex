"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin, refreshToken as apiRefresh, logout as apiLogout } from '@/services/authService'
import { setAccessToken, clearAccessToken } from '@/authStore'

interface UserProfile {
  group: string
  primeiro_nome: string
}

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRefresh()
      .then((data) => {
        setAccessToken(data.access)
        setUser({ group: data.group, primeiro_nome: data.primeiro_nome })
      })
      .catch(() => {
        // sessao expirada ou inexistente — nao redirecionar aqui
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const data = await apiLogin(email, password)
    setAccessToken(data.access)
    setUser({ group: data.group, primeiro_nome: data.primeiro_nome })
  }

  async function logout(): Promise<void> {
    try {
      await apiLogout()
    } catch {
      // best-effort: ignorar erros do servidor
    } finally {
      clearAccessToken()
      sessionStorage.removeItem("mauro_abertura_feita")
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
