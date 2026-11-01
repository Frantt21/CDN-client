import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { extractDominantColor } from '../utils/colors'
import { DEFAULT_RATIO, writeCachedRatio } from '../utils/masonry'
import { HiDotsVertical, HiPencil, HiBookmark, HiTrash } from 'react-icons/hi'
import './Masonry.css'

/** Padding interno de cada card (.item-wrapper): 6px a cada lado. */
const CARD_PADDING = 12
/** Altura usada mientras no se pudo medir la columna. */
const FALLBACK_IMG_HEIGHT = 260

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

const ThreeDotsIcon = HiDotsVertical
const PencilIcon = HiPencil
const BookmarkIcon = HiBookmark
const TrashIcon = HiTrash

/**
 * Masonry 100% nativo con CSS Grid: sin posicionamiento absoluto ni
 * virtualización por scroll.
 *
 * El grid usa filas de 1px (`grid-auto-rows: 1px`) y cada card ocupa
 * `span` filas igual a su altura en px. La altura sale del RATIO real de
 * la imagen (medido al cargar y cacheado), así cada card respeta la
 * proporción de su foto en vez de una altura aleatoria.
 */
const Masonry = ({ items, onItemClick }) => {
  const { t } = useTranslation()
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    1,
  )
  const [openMenuId, setOpenMenuId] = useState(null)
  // Color dominante por card (extraído del thumbnail, cacheado en localStorage):
  // se usa como fondo del contenedor para el efecto hover.
  const [cardColors, setCardColors] = useState({})
  // Ancho de columna medido (una sola medición por resize, no por card) y
  // ratio real de cada imagen medido al cargar.
  const listRef = useRef(null)
  const [colWidth, setColWidth] = useState(0)
  const [ratios, setRatios] = useState({})

  useEffect(() => {
    const el = listRef.current
    if (!el) return undefined
    const measure = () => setColWidth(el.clientWidth / columns)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [columns])

  // Al cargar la imagen se guarda su ratio (para esta sesión y para las
  // siguientes visitas), y la card ajusta su altura a la proporción real.
  const handleImageLoad = (item) => (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    if (!naturalWidth || !naturalHeight) return
    const ratio = naturalWidth / naturalHeight
    writeCachedRatio(item.img, ratio)
    setRatios((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: ratio }))
  }

  useEffect(() => {
    setOpenMenuId(null)
  }, [items])

  const handleHover = (item) => {
    if (cardColors[item.id] !== undefined) return
    extractDominantColor(item.img).then((color) => {
      if (!color) return
      setCardColors((prev) =>
        prev[item.id] !== undefined ? prev : { ...prev, [item.id]: color },
      )
    })
  }

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
    <div className="masonry-list" ref={listRef} style={{ '--masonry-cols': columns }}>
      {items.map((item) => {
        // Alto de la imagen según el ratio real; la card suma el padding.
        const ratio = ratios[item.id] ?? item.ratio ?? DEFAULT_RATIO
        const imgHeight =
          colWidth > CARD_PADDING ? (colWidth - CARD_PADDING) / ratio : FALLBACK_IMG_HEIGHT
        const span = Math.max(1, Math.ceil(imgHeight + CARD_PADDING))
        const hasActions =
          Boolean(item.onToggleSave) ||
          Boolean(item.onEdit) ||
          Boolean(item.canDelete && item.onDelete)

        return (
          <div
            key={item.id}
            className="item-wrapper"
            style={{
              '--item-color': cardColors[item.id],
              gridRowEnd: `span ${span}`,
            }}
            onMouseEnter={() => handleHover(item)}
            onClick={() => {
              if (onItemClick) onItemClick(item)
            }}
          >
            <div className="item-img">
              <img
                className="item-image"
                src={item.img}
                alt={item.title}
                loading="lazy"
                decoding="async"
                onLoad={handleImageLoad(item)}
              />
              <div className="item-overlay">
                <div className="item-caption">
                  <strong className="item-title">{item.title}</strong>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  {item.ownerName && <span className="item-owner">{item.ownerName}</span>}
                </div>
              </div>
            </div>

            {/* Fuera de .item-img (que recorta con overflow: hidden) para
                que el dropdown no se corte contra el borde de la card. */}
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
                    {item.onEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(null)
                          item.onEdit(item.id)
                        }}
                      >
                        <PencilIcon />
                        {t('masonry.edit')}
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
        )
      })}
    </div>
  )
}

export default Masonry
