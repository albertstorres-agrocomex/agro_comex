// frontend/src/services/authService.ts
import { API_BASE_URL } from '../config/apiConfig'

export interface LoginResponse {
  access: string
  group: string
  primeiro_nome: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw { status: res.status }
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

function normalizeError(err: unknown): never {
  if (err && typeof err === 'object' && 'status' in err) throw err
  throw { status: 0 }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/token/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse<LoginResponse>(res)
  } catch (err) {
    normalizeError(err)
  }
}

export async function refreshToken(): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<LoginResponse>(res)
  } catch (err) {
    normalizeError(err)
  }
}

export async function logout(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<void>(res)
  } catch (err) {
    normalizeError(err)
  }
}
