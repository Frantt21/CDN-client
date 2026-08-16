import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ImageCard } from '../components/ImageCard'
import { useFeed } from '../hooks/useFeed'

export function UploadPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { images, savedIds, toggleSave } = useFeed()
  const recent = (images ?? []).slice(0, 8)
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError(t('upload.chooseFile'))
      return
    }
    setError(null)
    setBusy(true)
    try {
      await api.uploadImage({
        file,
        name: name.trim() || undefined,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('upload.submitError'))
    } finally {
      setBusy(false)
    }
  }

  const dropClasses = [
    'file-drop',
    dragging ? 'dragging' : '',
    file ? 'has-file' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className="container upload-page">
      <h1>{t('upload.title')}</h1>

      <form className="upload-layout" onSubmit={handleSubmit}>
        {/* Zona de archivo: sola, a la izquierda del layout */}
        <div className="upload-drop">
          {error && <p className="error">{error}</p>}
          <label
            className={dropClasses}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              hidden
            />
            <span>{file ? file.name : t('upload.dragHint')}</span>
          </label>
        </div>

        {/* El resto del espacio: los inputs */}
        <div className="upload-fields">
          <label>
            {t('upload.nameLabel')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('upload.namePlaceholder')}
            />
          </label>
          <label>
            {t('upload.categoryLabel')}
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('upload.categoryPlaceholder')}
              list="upload-categories"
              maxLength={64}
            />
            <datalist id="upload-categories">
              <option value={t('upload.catLandscape')} />
              <option value={t('upload.catPortrait')} />
              <option value={t('upload.catArt')} />
              <option value={t('upload.catNature')} />
              <option value={t('upload.catUrban')} />
              <option value={t('upload.catFood')} />
            </datalist>
          </label>
          <label>
            {t('upload.descriptionLabel')}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? t('upload.submitting') : t('upload.submit')}
          </button>
        </div>
      </form>

      <section className="carousel-section">
        <h2>{t('upload.recent')}</h2>
        {images === null ? (
          <div className="carousel" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="carousel-skeleton" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="carousel-empty">{t('upload.noImages')}</div>
        ) : (
          <div className="carousel">
            {recent.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                saved={savedIds.has(img.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}