import { imageUrl } from '../api'
import { useAuth } from '../auth/AuthContext'

export function ImageCard({ image, ownerName, onDelete }) {
  const { user } = useAuth()
  const canDelete = user?.userId === image.userId || user?.role === 'admin'

  return (
    <figure className="image-card">
      <a href={imageUrl(image.id)} target="_blank" rel="noreferrer">
        <img src={imageUrl(image.id)} alt={image.name} loading="lazy" />
      </a>
      <figcaption>
        <strong>{image.name}</strong>
        {image.description && <p>{image.description}</p>}
        <div className="image-meta">
          <span className="muted">
            {ownerName ?? `usuario #${image.userId}`} ·{' '}
            {new Date(image.createdAt).toLocaleDateString('es-AR')}
          </span>
          {canDelete && onDelete && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(image.id)}>
              Borrar
            </button>
          )}
        </div>
      </figcaption>
    </figure>
  )
}
