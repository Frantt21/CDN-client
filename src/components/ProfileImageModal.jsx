import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiUpload } from 'react-icons/fi'
import { Dialog } from './Dialog'
import ImagePositionEditor from './ImagePositionEditor'
import './ProfileImageModal.css'

/**
 * Submodal de edición de una imagen del perfil (banner o avatar), portado
 * del sistema de FastChange: elegir o arrastrar un archivo, ajustar la
 * posición con drag y el zoom con el slider, y aplicar/cancelar.
 *
 * Al aplicar, el object URL del preview se transfiere al padre (que es
 * quien lo libera al cerrar el formulario); si se cancela, se libera acá.
 */
export default function ProfileImageModal({
  open,
  title,
  currentUrl,
  initialPosition,
  aspectRatio = 1,
  circular = false,
  canvasWidth,
  defaultPosition,
  onApply,
  onClose,
}) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [position, setPosition] = useState(initialPosition ?? defaultPosition ?? null)
  const [dragOver, setDragOver] = useState(false)
  const appliedRef = useRef(false)
  const inputRef = useRef(null)

  // Al abrir, siempre se parte de la imagen y la posición actuales del perfil.
  useEffect(() => {
    if (!open) return
    appliedRef.current = false
    setFile(null)
    setPreview(null)
    setPosition(initialPosition ?? defaultPosition ?? null)
  }, [open, initialPosition, defaultPosition])

  // Libera el object URL si no se aplicó (cambio de archivo, cierre o desmontaje).
  useEffect(() => {
    return () => {
      if (preview && !appliedRef.current) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pickFile = (chosen) => {
    if (!chosen || !chosen.type.startsWith('image/')) return
    setFile(chosen)
    setPreview(URL.createObjectURL(chosen))
    // Imagen nueva: la posición arranca en el centro del editor.
    setPosition(defaultPosition ?? null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer?.files?.[0] ?? null)
  }

  const handleApply = () => {
    appliedRef.current = true
    onApply({ file, preview, position })
    onClose()
  }

  const displayUrl = preview ?? currentUrl

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="profile-media-modal">
        <div
          className={`profile-media-drop${dragOver ? ' profile-media-drop--active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <button
            type="button"
            className="btn btn-glass btn-sm"
            onClick={() => inputRef.current?.click()}
          >
            <FiUpload />
            {t('profile.chooseImage')}
          </button>
          <span className="profile-media-drop-hint">{t('upload.dragHint')}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="visually-hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {displayUrl && (
          <ImagePositionEditor
            key={displayUrl}
            imageUrl={displayUrl}
            initialPosition={position}
            aspectRatio={aspectRatio}
            circular={circular}
            canvasWidth={canvasWidth}
            onPositionChange={setPosition}
          />
        )}

        <div className="profile-media-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!displayUrl}
          >
            {t('common.save')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
