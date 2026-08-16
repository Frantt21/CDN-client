import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './Masonry.css'

/** Cantidad de columnas según el ancho de pantalla (matchMedia nativo). */
const useMedia = (queries, values, defaultValue) => {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue
    return values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue
  }

  const [value, setValue] = useState(get)

  useEffect(() => {
    const handler = () => setValue(get)
    queries.forEach((q) => matchMedia(q).addEventListener('change', handler))
    return () =>
      queries.forEach((q) => matchMedia(q).removeEventListener('change', handler))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries])

  return value
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

function BookmarkIcon() {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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

/**
 * Masonry 100% nativo con CSS Grid: sin mediciones JS (ResizeObserver),
 * sin virtualización por scroll ni posicionamiento absoluto.
 *
 * El grid usa filas de 1px (`grid-auto-rows: 1px`) y cada card ocupa
 * `span` filas según su altura pseudo-determinística (estable entre
 * renders), así el layout no depende del ancho medido del contenedor y
 * las cards nunca "desaparecen" al alternar tabs o re-renderizar.
 */
const Masonry = ({ items, scaleOnHover = true, hoverScale = 0.95, onItemClick }) => {
  const { t } = useTranslation()
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    1,
  )
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => {
    setOpenMenuId(null)
  }, [items])

  useEffect(() => {
    if (openMenuId === null) return
    const handler = (e) => {
      if (!e.target.closest('[data-menu]')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="masonry-list" style={{ '--masonry-cols': columns }}>
      {items.map((item) => {
        const span = Math.max(1, Math.round((item.height ?? 300) / 2))
        const hasActions = Boolean(item.onToggleSave) || Boolean(item.canDelete && item.onDelete)

        return (
          <div
            key={item.id}
            className="item-wrapper"
            style={{
              '--hover-scale': scaleOnHover ? hoverScale : 1,
              gridRowEnd: `span ${span}`,
            }}
            onClick={() => {
              if (onItemClick) onItemClick(item)
            }}
          >
            <div className="item-img" style={{ backgroundImage: `url(${item.img})` }}>
              <div className="item-overlay">
                <div className="item-caption">
                  <strong className="item-title">{item.title}</strong>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  {item.ownerName && <span className="item-owner">{item.ownerName}</span>}
                </div>

                {hasActions && (
                  <div className="masonry-menu" data-menu>
                    <button
                      type="button"
                      className="masonry-menu-toggle"
                      aria-label={t('masonry.moreOptions')}
                      aria-expanded={openMenuId === item.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMenu(item.id)
                      }}
                    >
                      <ThreeDotsIcon />
                    </button>

                    {openMenuId === item.id && (
                      <div className="masonry-dropdown">
                        {item.onToggleSave && (
                          <button
                            type="button"
                            className={item.saved ? 'active' : ''}
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              item.onToggleSave(item.id)
                            }}
                          >
                            <BookmarkIcon />
                            {item.saved ? t('masonry.saved') : t('masonry.save')}
                          </button>
                        )}
                        {item.canDelete && item.onDelete && (
                          <button
                            type="button"
                            className="danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              item.onDelete(item.id)
                            }}
                          >
                            <TrashIcon />
                            {t('masonry.delete')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Masonry
