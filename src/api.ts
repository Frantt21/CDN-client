import type { AuthResponse, ImageDto, UserDto } from './types'

const API_BASE = '/api'
const TOKEN_KEY = 'cdn_token'
const USER_KEY = 'cdn_user'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): AuthResponse | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthResponse
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthResponse | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

/** URL del archivo de una imagen (vista inline). */
export function imageUrl(id: number): string {
  return `${API_BASE}/images/${id}/download`
}

/** URL de descarga (attachment) de una imagen. */
export function imageDownloadUrl(id: number): string {
  return `${API_BASE}/images/${id}/download?download=true`
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (authenticated) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // cuerpo sin JSON
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface RegisterData {
  nickname: string
  username: string
  email: string
  password: string
  description?: string
}

export const api = {
  register: (data: RegisterData) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getUsers: () => request<UserDto[]>('/users'),

  getUserByUsername: (username: string) => request<UserDto>(`/users/${username}`),

  getImages: (userId?: number) =>
    request<ImageDto[]>(`/images${userId ? `?userId=${userId}` : ''}`),

  getImage: (id: number) => request<ImageDto>(`/images/${id}`),

  uploadImage: (data: { file: File; name?: string; description?: string }) => {
    const form = new FormData()
    if (data.name) form.append('name', data.name)
    if (data.description) form.append('description', data.description)
    form.append('file', data.file)
    return request<ImageDto>('/images', { method: 'POST', body: form }, true)
  },

  deleteImage: (id: number) =>
    request<void>(`/images/${id}`, { method: 'DELETE' }, true),
}
