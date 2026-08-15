import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ImageCard } from '../components/ImageCard'
import { useFeed } from '../hooks/useFeed'

export function UploadPage() {
  const navigate = useNavigate()
  const { images } = useFeed()
  const recent = (images ?? []).slice(0, 8)
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
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
      setError('Elegí un archivo de imagen.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await api.uploadImage({
        file,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
      })
      navigate('/feed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
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
      <h1>Subir imagen</h1>
      {error && <p className="error">{error}</p>}
      <form className="upload-card" onSubmit={handleSubmit}>
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
          <span>
            {file ? file.name : 'Hacé clic o arrastrá una imagen acá'}
          </span>
        </label>

        <label>
          Nombre (opcional)
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Se usa el nombre del archivo si lo dejás vacío"
          />
        </label>
        <label>
          Descripción (opcional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Subiendo…' : 'Subir'}
        </button>
      </form>

      <section className="carousel-section">
        <h2>Recientes</h2>
        {images === null ? (
          <div className="carousel" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="carousel-skeleton" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="carousel-empty">Todavía no hay imágenes.</div>
        ) : (
          <div className="carousel">
            {recent.map((img) => (
              <ImageCard key={img.id} image={img} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
