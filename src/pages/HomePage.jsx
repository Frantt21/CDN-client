import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Masonry from '../components/Masonry'
import { MasonrySkeleton } from '../components/Skeletons'
import { useFeed } from '../hooks/useFeed'
import { imageToMasonryItem } from '../utils/masonry'

export function HomePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { images, users, loading, error, removeImage, savedIds, toggleSave } = useFeed()

  const handleDelete = async (id) => {
    try {
      await removeImage(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : t('feed.deleteError'))
    }
  }

  const ownerNames = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.nickname])),
    [users],
  )

  const items = useMemo(
    () =>
      (images ?? []).map((img) => ({
        ...imageToMasonryItem(img, ownerNames.get(img.userId)),
        saved: savedIds.has(img.id),
        onToggleSave: user ? toggleSave : undefined,
        canDelete: Boolean(user && (user.userId === img.userId || user.role === 'admin')),
        onDelete: user ? handleDelete : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, users, savedIds],
  )

  return (
    <main className="container">
      {error && <p className="error">{error}</p>}
      {loading ? (
        <MasonrySkeleton count={12} />
      ) : items.length === 0 ? (
        <p className="muted">
          {t('home.empty')} {user ? t('home.emptyLoggedIn') : t('home.emptyGuest')}
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
