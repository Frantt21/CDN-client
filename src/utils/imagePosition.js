// ── Helpers de posición de imagen ──
// Formato: JSON string { x: 0-100, y: 0-100, zoom: 1-3 }
// Legacy: "X% Y%" (sin zoom, default 1)

export function parseImagePosition(pos) {
  if (!pos) return { x: 50, y: 50, zoom: 1 }

  if (pos.startsWith('{')) {
    try {
      const parsed = JSON.parse(pos)
      return {
        x: typeof parsed.x === 'number' ? parsed.x : 50,
        y: typeof parsed.y === 'number' ? parsed.y : 50,
        zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 1,
      }
    } catch {
      // formato inválido: usa el default
    }
  }

  const legacy = String(pos).match(/(\d+(?:\.\d+)?)\s*%\s*(\d+(?:\.\d+)?)\s*%/)
  if (legacy) {
    return { x: parseFloat(legacy[1]), y: parseFloat(legacy[2]), zoom: 1 }
  }

  return { x: 50, y: 50, zoom: 1 }
}

/**
 * Estilos para renderizar una imagen posicionada (avatar) con <img>.
 * object-fit: contain muestra la imagen completa en su ratio original,
 * igual que el editor; width/height z*100% agranda el elemento para el
 * zoom y la combinación de object-position + translate centra el punto
 * elegido. El contenedor (overflow hidden + border-radius) clipea el resto.
 */
export function getImageStyle(positionStr) {
  const p = parseImagePosition(positionStr || '')
  const z = Math.max(p.zoom, 1)

  return {
    objectFit: 'contain',
    objectPosition: `${p.x}% ${p.y}%`,
    transformOrigin: 'center center',
    width: `${z * 100}%`,
    height: `${z * 100}%`,
    maxWidth: 'none',
    maxHeight: 'none',
    transform: `translate(${(50 - p.x * z) / z}%, ${(50 - p.y * z) / z}%)`,
  }
}

/**
 * Estilos para renderizar una imagen posicionada como fondo (banner).
 * backgroundSize z*100% (ancho = z*100% del contenedor, alto según el
 * ratio natural) + backgroundPosition x% y%, como el editor en
 * backgroundMode.
 */
export function getBackgroundStyle(positionStr) {
  const p = parseImagePosition(positionStr || '')
  const z = Math.max(p.zoom, 1.05)
  return {
    backgroundPosition: `${p.x}% ${p.y}%`,
    backgroundSize: `${z * 100}%`,
    backgroundRepeat: 'no-repeat',
  }
}
