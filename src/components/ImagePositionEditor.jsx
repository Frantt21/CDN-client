import { useCallback, useEffect, useRef, useState } from 'react'
import { parseImagePosition } from '../utils/imagePosition'

/**
 * ImagePositionEditor
 *
 * Editor de posicion y zoom para imagenes SIN librerias externas
 * (portado de FastChange).
 *
 * La imagen se muestra con object-fit: contain para que se vea COMPLETA
 * en su ratio original. El zoom se aplica agrandando el elemento
 * (width/height en vez de transform: scale), y translate() mueve el
 * elemento agrandado. El drag es 1:1 en pixeles.
 *
 * Props:
 *   imageUrl        - URL de la imagen a editar
 *   initialPosition - String JSON: {"x":50,"y":50,"zoom":1}
 *   aspectRatio     - Ratio del contenedor (1 para avatar, 3 para banner)
 *   circular        - true para mascara circular (avatar)
 *   backgroundMode  - true para el banner: el ancho de la imagen es
 *                     siempre z*100% del contenedor y el alto conserva
 *                     el ratio natural (como background-size/position)
 *   canvasWidth     - ancho fijo del canvas en px (ej. 128 para el avatar);
 *                     los controles (slider de zoom) ocupan todo el ancho
 *                     del editor, así el slider queda centrado.
 *   onPositionChange - callback(positionString)
 *   style           - estilo adicional para el contenedor
 */
export default function ImagePositionEditor({
  imageUrl,
  initialPosition,
  aspectRatio = 3,
  circular = false,
  backgroundMode = false,
  canvasWidth,
  onPositionChange,
  style,
}) {
  const init = parseImagePosition(initialPosition)
  const [x, setX] = useState(init.x)
  const [y, setY] = useState(init.y)
  const [zoom, setZoom] = useState(init.zoom)
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 })

  const xRef = useRef(x)
  const yRef = useRef(y)
  const zoomRef = useRef(zoom)
  const imgNaturalRef = useRef({ w: 1, h: 1 })
  useEffect(() => { xRef.current = x }, [x])
  useEffect(() => { yRef.current = y }, [y])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { imgNaturalRef.current = imgNaturalSize }, [imgNaturalSize])

  const dragging = useRef(false)
  const dragStart = useRef({ clientX: 0, clientY: 0, translateX: 0, translateY: 0 })
  const translateRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const onPositionChangeRef = useRef(onPositionChange)
  useEffect(() => { onPositionChangeRef.current = onPositionChange }, [onPositionChange])

  const containerSizeRef = useRef({ width: 1, height: 1 })
  const containerCallbackRef = useCallback((node) => {
    containerRef.current = node
    if (node) {
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        containerSizeRef.current = { width: rect.width, height: rect.height }
      }
    }
  }, [])

  const getContainedLayout = useCallback((elemW, elemH, natW, natH) => {
    if (!natW || !natH || natW <= 0 || natH <= 0) {
      return { w: elemW, h: elemH, ox: 0, oy: 0 }
    }
    const fitScale = Math.min(elemW / natW, elemH / natH)
    return {
      w: natW * fitScale,
      h: natH * fitScale,
      ox: (elemW - natW * fitScale) / 2,
      oy: (elemH - natH * fitScale) / 2,
    }
  }, [])

  const posToTranslate = useCallback((posX, posY, z) => {
    const { width: cw, height: ch } = containerSizeRef.current
    const nat = imgNaturalRef.current
    if (backgroundMode) {
      const elemW = z * cw
      const elemH = nat.w > 0 ? elemW * (nat.h / nat.w) : z * ch
      return {
        x: (cw - elemW) * (posX / 100),
        y: (ch - elemH) * (posY / 100),
      }
    }
    const elemW = z * cw
    const elemH = z * ch
    const layout = getContainedLayout(elemW, elemH, nat.w, nat.h)
    return {
      x: (cw / 2) - layout.ox - (posX * layout.w) / 100,
      y: (ch / 2) - layout.oy - (posY * layout.h) / 100,
    }
  }, [backgroundMode, getContainedLayout])

  const translateToPos = useCallback((tx, ty, z) => {
    const { width: cw, height: ch } = containerSizeRef.current
    const nat = imgNaturalRef.current
    if (backgroundMode) {
      const elemW = z * cw
      const elemH = nat.w > 0 ? elemW * (nat.h / nat.w) : z * ch
      return {
        x: Math.abs(cw - elemW) < 0.5 ? 50 : Math.round((tx * 100) / (cw - elemW)),
        y: Math.abs(ch - elemH) < 0.5 ? 50 : Math.round((ty * 100) / (ch - elemH)),
      }
    }
    const elemW = z * cw
    const elemH = z * ch
    const layout = getContainedLayout(elemW, elemH, nat.w, nat.h)
    const posX = layout.w > 0 ? ((cw / 2) - tx - layout.ox) * 100 / layout.w : 50
    const posY = layout.h > 0 ? ((ch / 2) - ty - layout.oy) * 100 / layout.h : 50
    return { x: Math.round(posX), y: Math.round(posY) }
  }, [backgroundMode, getContainedLayout])

  const clampTranslate = useCallback((tx, ty, z) => {
    const { width: cw, height: ch } = containerSizeRef.current
    const nat = imgNaturalRef.current
    const M = 1
    if (backgroundMode) {
      const elemW = z * cw
      const elemH = nat.w > 0 ? elemW * (nat.h / nat.w) : z * ch
      const clampX = (v) => Math.max(M - elemW, Math.min(cw - M, v))
      const clampY = (v) => Math.max(M - elemH, Math.min(ch - M, v))
      return { x: clampX(tx), y: clampY(ty) }
    }
    const layout = getContainedLayout(z * cw, z * ch, nat.w, nat.h)
    const clampX = (v) => Math.max(-layout.ox - layout.w + M, Math.min(cw - layout.ox - M, v))
    const clampY = (v) => Math.max(-layout.oy - layout.h + M, Math.min(ch - layout.oy - M, v))
    return { x: clampX(tx), y: clampY(ty) }
  }, [backgroundMode, getContainedLayout])

  const applyTransform = useCallback((tx, ty) => {
    if (!imgRef.current) return
    imgRef.current.style.transform = `translate(${tx}px, ${ty}px)`
    translateRef.current = { x: tx, y: ty }
  }, [])

  const panTo = useCallback((posX, posY, z) => {
    const t = posToTranslate(posX, posY, z)
    const c = clampTranslate(t.x, t.y, z)
    applyTransform(c.x, c.y)
    const pos = translateToPos(c.x, c.y, z)
    xRef.current = pos.x
    yRef.current = pos.y
  }, [posToTranslate, clampTranslate, translateToPos, applyTransform])

  const handleImgLoad = useCallback(() => {
    if (imgRef.current) {
      const nw = imgRef.current.naturalWidth || 1
      const nh = imgRef.current.naturalHeight || 1
      setImgNaturalSize({ w: nw, h: nh })
      imgNaturalRef.current = { w: nw, h: nh }
    }
    panTo(xRef.current, yRef.current, zoomRef.current)
  }, [panTo])

  // Re-medir el contenedor cuando se vuelve visible (el editor vive dentro
  // de un <dialog> que arranca oculto) y re-aplicar el pan con el tamano real.
  useEffect(() => {
    let raf = 0
    let observer = null
    let lastKey = ''
    let stableFrames = 0

    const applyPan = () => {
      const el = containerRef.current
      if (!el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w > 0 && h > 0) {
        containerSizeRef.current = { width: w, height: h }
        panTo(xRef.current, yRef.current, zoomRef.current)
      }
    }

    const applyIfStable = () => {
      const el = containerRef.current
      if (!el) return false
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w > 0 && h > 0) {
        const key = `${w}x${h}`
        if (key === lastKey) {
          stableFrames += 1
          if (stableFrames >= 2) {
            applyPan()
            return true
          }
        } else {
          lastKey = key
          stableFrames = 0
        }
      }
      return false
    }

    const tick = () => {
      if (!applyIfStable()) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => applyPan())
      observer.observe(containerRef.current)
    }

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [panTo])

  const notify = useCallback(() => {
    const payload = JSON.stringify({
      x: xRef.current,
      y: yRef.current,
      zoom: Math.round(zoomRef.current * 10) / 10,
    })
    onPositionChangeRef.current?.(payload)
  }, [])

  const updateDrag = useCallback((clientX, clientY) => {
    const d = dragStart.current
    const dx = clientX - d.clientX
    const dy = clientY - d.clientY
    const newTx = d.translateX + dx
    const newTy = d.translateY + dy
    const z = zoomRef.current
    const c = clampTranslate(newTx, newTy, z)
    applyTransform(c.x, c.y)
    const pos = translateToPos(c.x, c.y, z)
    xRef.current = pos.x
    yRef.current = pos.y
  }, [applyTransform, clampTranslate, translateToPos])

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return
    updateDrag(e.clientX, e.clientY)
  }, [updateDrag])

  const handleMouseUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    setX(xRef.current)
    setY(yRef.current)
    notify()
  }, [handleMouseMove, notify])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      translateX: translateRef.current.x,
      translateY: translateRef.current.y,
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, handleMouseUp])

  const handleTouchMove = useCallback((e) => {
    if (!dragging.current || e.touches.length !== 1) return
    e.preventDefault()
    updateDrag(e.touches[0].clientX, e.touches[0].clientY)
  }, [updateDrag])

  const handleTouchEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    setX(xRef.current)
    setY(yRef.current)
    notify()
  }, [handleTouchMove, notify])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    dragging.current = true
    dragStart.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      translateX: translateRef.current.x,
      translateY: translateRef.current.y,
    }
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
  }, [handleTouchMove, handleTouchEnd])

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Reset cuando cambia la imagen
  const prevUrlRef = useRef(imageUrl)
  useEffect(() => {
    if (imageUrl !== prevUrlRef.current) {
      prevUrlRef.current = imageUrl
      const z0 = backgroundMode ? 1.05 : 1
      setX(50)
      setY(50)
      setZoom(z0)
      xRef.current = 50
      yRef.current = 50
      zoomRef.current = z0
      if (imgRef.current) {
        imgRef.current.style.transform = ''
        translateRef.current = { x: 0, y: 0 }
      }
    }
  }, [imageUrl, backgroundMode])

  const handleZoomChange = useCallback((e) => {
    const z = parseFloat(e.target.value)
    setZoom(z)
    zoomRef.current = z
    panTo(xRef.current, yRef.current, z)
  }, [panTo])

  const handleZoomCommit = useCallback(() => {
    notify()
  }, [notify])

  const handleReset = useCallback(() => {
    const z0 = backgroundMode ? 1.05 : 1
    setX(50)
    setY(50)
    setZoom(z0)
    xRef.current = 50
    yRef.current = 50
    zoomRef.current = z0
    panTo(50, 50, z0)
    notify()
  }, [backgroundMode, panTo, notify])

  if (!imageUrl) return null

  const borderRadius = circular ? '50%' : 'var(--radius, 12px)'
  const MIN_ZOOM = backgroundMode ? 1.05 : 1
  const z = zoom

  return (
    <div className="imgpos-editor" style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      <div
        ref={containerCallbackRef}
        className="imgpos-canvas"
        style={{
          position: 'relative',
          width: canvasWidth ? `${canvasWidth}px` : '100%',
          margin: canvasWidth ? '0 auto' : undefined,
          aspectRatio: String(aspectRatio),
          overflow: 'hidden',
          lineHeight: 0,
          borderRadius,
          background: 'var(--color-surface-hover, #252525)',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Position preview"
          draggable={false}
          style={{
            display: 'block',
            width: `${z * 100}%`,
            height: backgroundMode ? 'auto' : `${z * 100}%`,
            aspectRatio: backgroundMode && imgNaturalSize.w > 0
              ? `${imgNaturalSize.w} / ${imgNaturalSize.h}`
              : undefined,
            maxWidth: 'none',
            maxHeight: 'none',
            objectFit: backgroundMode ? 'fill' : 'contain',
            transformOrigin: 'center center',
            pointerEvents: 'none',
          }}
          onLoad={handleImgLoad}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

      <div className="imgpos-controls" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg className="imgpos-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min={MIN_ZOOM}
          max="8"
          step="0.1"
          value={zoom}
          onChange={handleZoomChange}
          onMouseUp={handleZoomCommit}
          onTouchEnd={handleZoomCommit}
          className="imgpos-range"
          style={{ flex: 1 }}
        />
        <svg className="imgpos-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="imgpos-value" style={{ minWidth: 36, fontSize: '0.75rem', opacity: 0.7 }}>
          {zoom.toFixed(1)}x
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-glass btn-sm"
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
