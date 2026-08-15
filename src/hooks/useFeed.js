import { useCallback, useEffect, useRef, useState } from 'react'
import { api, getStoredUser, getToken } from '../api'
import i18n from '../i18n'
import { readCached, writeCached } from '../utils/cache'

const CACHE_KEY = 'cdn_feed_cache'
const POLL_INTERVAL_MS = 15_000
const SAVED_TTL_MS = 7 * 24 * 60 * 60 * 1000

function savedCacheKey() {
  const id = getStoredUser()?.id
  return `cdn_saved_${id ?? 'anon'}`
}

function readSavedCache() {
  const value = readCached(savedCacheKey(), SAVED_TTL_MS)
  if (!Array.isArray(value)) return null
  return new Set(value)
}

function writeSavedCache(ids) {
  writeCached(savedCacheKey(), [...ids])
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.images) || !Array.isArray(parsed.users)) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(images, users) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ images, users, fetchedAt: Date.now() }),
    )
  } catch {
    // almacenamiento no disponible (cuota/privado): se ignora
  }
}

export function useFeed() {
  const [images, setImages] = useState(null)
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [savedIds, setSavedIds] = useState(() => {
    if (!getToken()) return new Set()
    return readSavedCache() ?? new Set()
  })
  const latest = useRef({ images: [], users: [] })
  const latestSaved = useRef(new Set())
  const firstSavedRender = useRef(true)

  useEffect(() => {
    latest.current = { images: images ?? [], users: users ?? [] }
  }, [images, users])

  useEffect(() => {
    latestSaved.current = savedIds
  }, [savedIds])

  useEffect(() => {
    if (firstSavedRender.current) {
      firstSavedRender.current = false
      return
    }
    writeSavedCache(savedIds)
  }, [savedIds])

  const loadSaved = useCallback(async () => {
    if (!getToken()) {
      setSavedIds(new Set())
      return
    }
    try {
      const imgs = await api.getSavedImages()
      setSavedIds(new Set(imgs.map((i) => i.id)))
    } catch {
      // los guardados no bloquean el feed principal
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [imgs, usrs] = await Promise.all([api.getImages(), api.getUsers()])
      setImages(imgs)
      setUsers(usrs)
      writeCache(imgs, usrs)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('feed.loadError'))
    }
  }, [])

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setImages(cached.images)
      setUsers(cached.users)
    }

    void refresh()
    void loadSaved()

    const poll = setInterval(() => void refresh(), POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, loadSaved])

  const toggleSave = useCallback(async (imageId) => {
    const isSaved = latestSaved.current.has(imageId)
    try {
      if (isSaved) {
        await api.unsaveImage(imageId)
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.delete(imageId)
          return next
        })
      } else {
        await api.saveImage(imageId)
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.add(imageId)
          return next
        })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : i18n.t('feed.saveError'))
    }
  }, [])

  const removeImage = useCallback(async (id) => {
    try {
      await api.deleteImage(id)
      setImages((prev) => {
        const next = (prev ?? []).filter((img) => img.id !== id)
        writeCache(next, latest.current.users)
        return next
      })
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error(i18n.t('feed.deleteError'))
    }
  }, [])

  const loading = images === null

  return { images, users, loading, error, refresh, removeImage, savedIds, toggleSave }
}
