import { readCached, writeCached } from './cache'

const COLOR_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 días
const colorCacheKey = (url) => `cdn_color_${url}`

/**
 * Extrae el color dominante de una imagen (las URLs de la API son
 * same-origin, así que el canvas no se contamina y no hace falta proxy).
 * Devuelve un hex "#rrggbb" o null si falla. Resultado cacheado por URL.
 */
export async function extractDominantColor(imageUrl, { size = 24, quantize = 4 } = {}) {
  if (!imageUrl) return null

  const cached = readCached(colorCacheKey(imageUrl), COLOR_TTL_MS)
  if (cached) return cached

  try {
    const color = await computeDominantColor(imageUrl, size, quantize)
    if (color) writeCached(colorCacheKey(imageUrl), color)
    return color
  } catch {
    return null
  }
}

function computeDominantColor(imageUrl, size, quantize) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const w = size
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * size))
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)

        // Muestreo por frecuencia con cuantización (como FastChange): se agrupan
        // colores parecidos y se queda con el grupo más común.
        const buckets = new Map()
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 125) continue
          const key = `${data[i] >> quantize},${data[i + 1] >> quantize},${data[i + 2] >> quantize}`
          buckets.set(key, (buckets.get(key) ?? 0) + 1)
        }

        let bestKey = null
        let bestCount = 0
        for (const [key, count] of buckets) {
          if (count > bestCount) {
            bestKey = key
            bestCount = count
          }
        }

        if (!bestKey) {
          resolve(null)
          return
        }

        const [r, g, b] = bestKey.split(',').map((v) => (parseInt(v, 10) << quantize) + (1 << (quantize - 1)))
        const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
        resolve(hex)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}
