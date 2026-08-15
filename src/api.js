const API_BASE = '/api'
const TOKEN_KEY = 'cdn_token'
const USER_KEY = 'cdn_user'

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

/** URL de descarga (attachment) de una imagen. */
export function imageDownloadUrl(id) {
  return `${API_BASE}/images/${id}/download?download=true`
}

async function request(path, options = {}, authenticated = false) {
  const headers = {}
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
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      // cuerpo sin JSON
    }
    throw new ApiError(res.status, message)
  }

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

  updateProfile: (id, data) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),

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
}
