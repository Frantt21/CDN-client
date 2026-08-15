import { useTranslation } from 'react-i18next'
import { imageUrl } from '../api'
import { useAuth } from '../auth/AuthContext'

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

export function ImageCard({ image, ownerName, onDelete, saved = false, onToggleSave }) {
  const { user } = useAuth()
  const { t } = useTranslation()
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
                <BookmarkIcon />
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
