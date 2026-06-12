// frontend/src/services/authService.ts
import { API_BASE_URL } from '../config/apiConfig'
import { getAccessToken, setAccessToken } from '../authStore'

function _doFetch(url: string, init: RequestInit): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(init.headers as HeadersInit | undefined)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const resolvedUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url
  return fetch(resolvedUrl, { ...init, credentials: 'include', headers })
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const res = await _doFetch(url, init)
  if (res.status !== 401) return res

  // Token expirado — tenta refresh silencioso via cookie httpOnly
  try {
    const refreshRes = await fetch(`${API_BASE_URL}/api/v1/authentication/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!refreshRes.ok) return res
    const { access } = await refreshRes.json()
    setAccessToken(access)
    return _doFetch(url, init)
  } catch {
    return res
  }
}

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
    const res = await fetch(`${API_BASE_URL}/api/v1/authentication/token/`, {
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
    const res = await fetch(`${API_BASE_URL}/api/v1/authentication/token/refresh/`, {
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
    const res = await apiFetch(`${API_BASE_URL}/api/v1/authentication/logout/`, {
      method: 'POST',
    })
    return handleResponse<void>(res)
  } catch (err) {
    normalizeError(err)
  }
}
