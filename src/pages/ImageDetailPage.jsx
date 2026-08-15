import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, imageDownloadUrl, imageUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import Masonry from '../components/Masonry'
import { DetailSkeleton } from '../components/Skeletons'
import { useFeed } from '../hooks/useFeed'
import { imageToMasonryItem } from '../utils/masonry'

function BookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ThreeDotsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4" />
      <path d="M15.4 6.5l-6.8 4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export function ImageDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { images, users, savedIds, toggleSave, removeImage } = useFeed()
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setImage(null)
    api
      .getImage(id)
      .then((img) => {
        if (active) setImage(img)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : t('detail.loadError'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-menu]')) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const ownerNames = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.nickname])),
    [users],
  )

  const currentId = Number(id)
  const canDeleteCurrent =
    image && (user?.userId === image.userId || user?.role === 'admin')

  const handleDelete = async (imgId) => {
    try {
      await removeImage(imgId)
      if (imgId === currentId) navigate('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : t('detail.deleteError'))
    }
  }

  const recommendationItems = useMemo(
    () =>
      (images ?? [])
        .filter((img) => img.id !== currentId)
        .slice(0, 12)
        .map((img) => ({
          ...imageToMasonryItem(img, ownerNames.get(img.userId)),
          saved: savedIds.has(img.id),
          onToggleSave: user ? toggleSave : undefined,
          canDelete: Boolean(
            user && (user.userId === img.userId || user.role === 'admin'),
          ),
          onDelete: user ? handleDelete : undefined,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, users, savedIds, currentId],
  )

  const handleToggleSave = async () => {
    try {
      await toggleSave(currentId)
    } catch {
      // toggleSave ya informa el error
    }
  }

  const handleDeleteCurrent = async () => {
    if (!window.confirm(t('detail.confirmDelete'))) return
    setMenuOpen(false)
    setDeleting(true)
    try {
      await handleDelete(currentId)
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async () => {
    setMenuOpen(false)
    try {
      const res = await fetch(imageDownloadUrl(currentId))
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${image?.name || 'imagen'}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl(currentId), '_blank')
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/images/${currentId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !image) {
    return (
      <main className="container">
        <p className="error">{error ?? t('detail.notFound')}</p>
        <p>
          <Link to="/" className="btn btn-primary">
            {t('common.backToHome')}
          </Link>
        </p>
      </main>
    )
  }

  const isSaved = savedIds.has(image.id)

  return (
    <main className="container">
      <p>
        <Link to="/" className="btn btn-primary">
          {t('common.backToHome')}
        </Link>
      </p>

      <section className="detail-hero">
        <div className="detail-image-wrap">
          <img className="detail-image" src={imageUrl(image.id)} alt={image.name} />
        </div>
        <div className="detail-meta">
          <h1>{image.name}</h1>
          {image.description && <p>{image.description}</p>}
          <p className="muted">
            {ownerNames.get(image.userId) ?? t('common.userFallback', { id: image.userId })} ·{' '}
            {new Date(image.createdAt).toLocaleDateString()}
          </p>
          <div className="image-actions">
            {user && (
              <button
                type="button"
                className={`btn ${isSaved ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleToggleSave}
              >
                <BookmarkIcon />
                {isSaved ? t('common.saved') : t('common.save')}
              </button>
            )}
            <div className="detail-menu" data-menu>
              <button
                type="button"
                className="masonry-menu-toggle"
                aria-label={t('detail.moreOptions')}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <ThreeDotsIcon />
              </button>
              {menuOpen && (
                <div className="masonry-dropdown">
                  <button type="button" onClick={handleDownload}>
                    <DownloadIcon />
                    {t('detail.download')}
                  </button>
                  <button type="button" onClick={handleShare}>
                    {copied ? <CheckIcon /> : <ShareIcon />}
                    {copied ? t('detail.copied') : t('detail.share')}
                  </button>
                  {canDeleteCurrent && (
                    <button
                      type="button"
                      className="danger"
                      disabled={deleting}
                      onClick={handleDeleteCurrent}
                    >
                      <TrashIcon />
                      {deleting ? t('detail.deleting') : t('detail.deleteImage')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>{t('detail.recommendations')}</h2>
        {recommendationItems.length === 0 ? (
          <p className="muted">{t('detail.noMoreImages')}</p>
        ) : (
          <Masonry
            items={recommendationItems}
            animateFrom="bottom"
            onItemClick={(item) => navigate(`/images/${item.id}`)}
          />
        )}
      </section>
    </main>
  )
}