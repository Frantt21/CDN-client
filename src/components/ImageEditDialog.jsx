import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from './Dialog'

/**
 * Diálogo de edición de una imagen (nombre, categoría, descripción).
 * `image`: imagen a editar (null = cerrado). `onSaved(id, data)` debe
 * devolver una promesa y lanzar si falla (el error se muestra acá).
 */
export function ImageEditDialog({ image, onClose, onSaved }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (image) {
      setName(image.name ?? '')
      setCategory(image.category ?? '')
      setDescription(image.description ?? '')
      setError(null)
      setSaving(false)
    }
  }, [image])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!image) return
    setError(null)
    setSaving(true)
    try {
      await onSaved(image.id, {
        name: name.trim(),
        category: category.trim() || null,
        description: description.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editImage.saveError'))
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(image)} onClose={onClose} title={t('editImage.title')}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}
        <label>
          {t('upload.nameLabel')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('upload.namePlaceholder')}
            required
          />
        </label>
        <label>
          {t('upload.categoryLabel')}
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t('upload.categoryPlaceholder')}
            list="edit-categories"
            maxLength={64}
          />
          <datalist id="edit-categories">
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
            rows={3}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('profile.saving') : t('common.save')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
