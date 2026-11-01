import { imageThumbUrl } from '../api'
import { readCached, writeCached } from './cache'

const RATIO_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 días
const ratioCacheKey = (url) => `cdn_ratio_${url}`

/** Ratio (ancho / alto) usado mientras la imagen todavía no cargó: 4:5. */
export const DEFAULT_RATIO = 4 / 5

/** Ratio cacheado de una miniatura (se guarda al cargar la imagen). */
export function readCachedRatio(url) {
  const value = readCached(ratioCacheKey(url), RATIO_TTL_MS)
  return typeof value === 'number' && value > 0 ? value : null
}

export function writeCachedRatio(url, ratio) {
  if (Number.isFinite(ratio) && ratio > 0) writeCached(ratioCacheKey(url), ratio)
}

/** Convierte una imagen de la API en un item del grid Masonry.
 *  La altura de cada card sale del ratio real de la imagen (se mide al
 *  cargar y queda cacheado), así el layout respeta la proporción.
 *  Los grids usan la MINIATURA, no el archivo original. */
export function imageToMasonryItem(img, ownerName) {
  const thumb = imageThumbUrl(img.id)
  return {
    id: img.id,
    img: thumb,
    ratio: readCachedRatio(thumb),
    title: img.name,
    description: img.description,
    ownerName,
    userId: img.userId,
  }
}
