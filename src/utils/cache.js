/** Lee una entrada de caché de localStorage si no expiró. */
export function readCached(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !('value' in parsed)) return null
    if (Date.now() - parsed.fetchedAt > ttlMs) return null
    return parsed.value
  } catch {
    return null
  }
}

/** Escribe una entrada de caché de localStorage. */
export function writeCached(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, fetchedAt: Date.now() }))
  } catch {
    // almacenamiento no disponible (cuota/privado): se ignora
  }
}