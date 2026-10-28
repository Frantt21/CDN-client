import { useTranslation } from 'react-i18next'
import { imageThumbUrl, imageUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import { HiBookmark } from 'react-icons/hi'

export function ImageCard({ image, ownerName, onDelete, saved = false, onToggleSave }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const canDelete = user?.userId === image.userId || user?.role === 'admin'

  return (
    <figure className="image-card">
      <a href={imageUrl(image.id)} target="_blank" rel="noreferrer">
        <img src={imageThumbUrl(image.id)} alt={image.name} loading="lazy" decoding="async" />
      </a>
      <figcaption>
        <strong>{image.name}</strong>
        {image.description && <p>{image.description}</p>}
        <div className="image-meta">
          <span className="muted">
            {ownerName ?? t('common.userFallback', { id: image.userId })} ·{' '}
            {new Date(image.createdAt).toLocaleDateString()}
          </span>
          <div className="image-actions">
            {user && onToggleSave && (
              <button
                type="button"
                className={`btn btn-icon bookmark-btn${saved ? ' saved' : ''}`}
                onClick={() => onToggleSave(image.id)}
                aria-label={saved ? t('common.saved') : t('common.save')}
                aria-pressed={saved}
              >
                <HiBookmark />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(image.id)}
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        </div>
      </figcaption>
    </figure>
  )
}
