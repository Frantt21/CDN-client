import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Masonry from '../components/Masonry'
import { MasonrySkeleton } from '../components/Skeletons'
import { imageToMasonryItem } from '../utils/masonry'

/** Página con todas las imágenes guardadas por el usuario logueado. */
export function SavedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [images, setImages] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [imgs, usrs] = await Promise.all([api.getSavedImages(), api.getUsers()])
        if (!active) return
        setImages(imgs)
        setUsers(usrs)
      } catch (err) {
        if (active) {
          setImages([])
          setError(err instanceof Error ? err.message : t('feed.loadError'))
        }
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ownerNames = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.nickname])),
    [users],
  )

  // Quitar de guardados desde el menú de la card: se saca de la lista al vuelo.
  const handleToggleSave = async (id) => {
    try {
      await api.unsaveImage(id)
      setImages((prev) => (prev ?? []).filter((img) => img.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : t('feed.saveError'))
    }
  }

  const items = useMemo(
    () =>
      (images ?? []).map((img) => ({
        ...imageToMasonryItem(img, ownerNames.get(img.userId)),
        saved: true,
        onToggleSave: handleToggleSave,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, users],
  )

  const loading = images === null

  return (
    <main className="container">
      <h1>{t('nav.saved')}</h1>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <MasonrySkeleton count={8} />
      ) : items.length === 0 ? (
        <p className="muted">
          {t('profile.noSavedYet')} {t('profile.savedHint')}
        </p>
      ) : (
        <Masonry
          items={items}
          animateFrom="bottom"
          onItemClick={(item) => navigate(`/images/${item.id}`)}
        />
      )}
    </main>
  )
}
