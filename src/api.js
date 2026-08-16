const API_BASE = '/api'
const TOKEN_KEY = 'cdn_token'
const USER_KEY = 'cdn_user'
const REFRESH_TOKEN_KEY = 'cdn_refresh_token'
const AUTH_EXPIRED_EVENT = 'cdn:auth:expired'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

/** URL del archivo de una imagen (vista inline). */
export function imageUrl(id) {
  return `${API_BASE}/images/${id}/download`
}

/** URL del avatar de un usuario. */
export function avatarUrl(id) {
  return `${API_BASE}/users/${id}/avatar`
}

/** URL de descarga (attachment) de una imagen. */
export function imageDownloadUrl(id) {
  return `${API_BASE}/images/${id}/download?download=true`
}

async function performRequest(path, options, authenticated) {
  const headers = {}
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (authenticated) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers })
}

async function errorMessage(res) {
  try {
    const data = await res.json()
    if (data?.error) return data.error
  } catch {
    // cuerpo sin JSON
  }
  return `Error ${res.status}`
}

let refreshPromise = null

/** Renueva la sesión con el refresh token (una sola petición en vuelo). */
async function tryRefreshSession() {
  if (refreshPromise) return refreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('no refresh token')

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) throw new Error(await errorMessage(res))

    const data = await res.json()
    setToken(data.token)
    setRefreshToken(data.refreshToken)

    const stored = getStoredUser()
    if (stored) {
      setStoredUser({
        ...stored,
        nickname: data.nickname,
        username: data.username,
        role: data.role,
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
      })
    }
    return data
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}

async function request(path, options = {}, authenticated = false) {
  const isAuthRoute =
    path === '/auth/login' || path === '/auth/register' || path === '/auth/refresh'

  const res = await performRequest(path, options, authenticated)

  if (res.status === 401 && authenticated && !isAuthRoute) {
    try {
      await tryRefreshSession()
      const retry = await performRequest(path, options, true)
      if (!retry.ok) throw new ApiError(retry.status, await errorMessage(retry))
      if (retry.status === 204) return undefined
      return await retry.json()
    } catch {
      setToken(null)
      setRefreshToken(null)
      notifySessionExpired()
      throw new ApiError(401, 'La sesión expiró. Volvé a iniciar sesión.')
    }
  }

  if (!res.ok) throw new ApiError(res.status, await errorMessage(res))
  if (res.status === 204) return undefined
  return await res.json()
}

export const api = {
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getUsers: () => request('/users'),

  getUserByUsername: (username) => request(`/users/${username}`),

  checkUsername: (username, excludeId) => {
    const q = new URLSearchParams({ username })
    if (excludeId) q.set('excludeId', excludeId)
    return request(`/users/check-username?${q}`)
  },

  updateProfile: (id, data) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),

  updateAvatar: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(`/users/${id}/avatar`, { method: 'POST', body: form }, true)
  },

  getImages: (userId) =>
    request(`/images${userId ? `?userId=${userId}` : ''}`),

  getImage: (id) => request(`/images/${id}`),

  uploadImage: (data) => {
    const form = new FormData()
    if (data.name) form.append('name', data.name)
    if (data.description) form.append('description', data.description)
    form.append('file', data.file)
    return request('/images', { method: 'POST', body: form }, true)
  },

  deleteImage: (id) =>
    request(`/images/${id}`, { method: 'DELETE' }, true),

  getSavedImages: () => request('/saved', {}, true),

  saveImage: (id) => request(`/saved/${id}`, { method: 'POST' }, true),

  unsaveImage: (id) => request(`/saved/${id}`, { method: 'DELETE' }, true),
}
