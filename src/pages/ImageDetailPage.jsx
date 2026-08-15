import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, imageUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import Masonry from '../components/Masonry'
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

export function ImageDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { images, users, savedIds, toggleSave, removeImage } = useFeed()
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

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
        if (active) setError(err instanceof Error ? err.message : 'Error al cargar la imagen')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

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
      alert(err instanceof Error ? err.message : 'Error al borrar la imagen')
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
    setDeleting(true)
    try {
      await handleDelete(currentId)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="container">
        <p>Cargando…</p>
      </main>
    )
  }

  if (error || !image) {
    return (
      <main className="container">
        <p className="error">{error ?? 'Imagen no encontrada.'}</p>
        <p>
          <Link to="/">← Volver al inicio</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="container">
      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>

      <section className="detail-hero">
        <div className="detail-image-wrap">
          <img className="detail-image" src={imageUrl(image.id)} alt={image.name} />
        </div>
        <div className="detail-meta">
          <h1>{image.name}</h1>
          {image.description && <p>{image.description}</p>}
          <p className="muted">
            {ownerNames.get(image.userId) ?? `usuario #${image.userId}`} ·{' '}
            {new Date(image.createdAt).toLocaleDateString('es-AR')}
          </p>
          <div className="image-actions">
            {user && (
              <button
                type="button"
                className={`btn ${savedIds.has(image.id) ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleToggleSave}
              >
                <BookmarkIcon />
                {savedIds.has(image.id) ? 'Guardado' : 'Guardar'}
              </button>
            )}
            {canDeleteCurrent && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={handleDeleteCurrent}
              >
                {deleting ? 'Borrando…' : 'Eliminar imagen'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2>Recomendaciones</h2>
        {recommendationItems.length === 0 ? (
          <p className="muted">No hay más imágenes por ahora.</p>
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
