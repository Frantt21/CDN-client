import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ImageCard } from '../components/ImageCard'

export function UserProfilePage() {
  const { username = '' } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, updateUser } = useAuth()
  const [user, setUser] = useState(null)
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [description, setDescription] = useState('')
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  const isOwnProfile = currentUser?.userId === user?.id

  useEffect(() => {
    let active = true
    setError(null)
    setUser(null)
    setEditing(false)

    void (async () => {
      try {
        const u = await api.getUserByUsername(username)
        if (!active) return
        setUser(u)
        const imgs = await api.getImages(u.id)
        if (active) setImages(imgs)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error al cargar el perfil')
      }
    })()

    return () => {
      active = false
    }
  }, [username])

  const startEditing = () => {
    if (!user) return
    setNickname(user.nickname)
    setEditUsername(user.username)
    setDescription(user.description ?? '')
    setSaveError(null)
    setEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaveError(null)
    setSaving(true)
    try {
      const updated = await api.updateProfile(user.id, {
        nickname: nickname.trim(),
        username: editUsername.trim().toLowerCase(),
        description: description.trim() || null,
      })
      setUser(updated)
      updateUser({ nickname: updated.nickname, username: updated.username })
      setEditing(false)
      if (updated.username !== username) navigate(`/users/${updated.username}`)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <main className="container">
        <p className="error">{error}</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="container">
        <p>Cargando…</p>
      </main>
    )
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteImage(id)
      setImages((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar la imagen')
    }
  }

  return (
    <main className="container">
      <section className="profile">
        <span className="avatar avatar-lg">{user.nickname[0]?.toUpperCase()}</span>
        <div>
          <h1>
            {user.nickname}
            {user.role === 'admin' && <span className="role-badge">admin</span>}
          </h1>
          <p className="muted">
            @{user.username} · desde {new Date(user.createdAt).toLocaleDateString('es-AR')}
          </p>
          {user.description && <p>{user.description}</p>}
          {isOwnProfile && !editing && (
            <button type="button" className="btn btn-secondary" onClick={startEditing}>
              Editar perfil
            </button>
          )}
        </div>
      </section>

      {isOwnProfile && editing && (
        <form className="form" onSubmit={handleSave} style={{ marginTop: '1rem' }}>
          <h2>Editar perfil</h2>
          {saveError && <p className="error">{saveError}</p>}
          <label>
            Nickname
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </label>
          <label>
            Username
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
              pattern="[a-z0-9_]+"
              required
            />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section>
        <h2>Imágenes de {user.nickname}</h2>
        {images.length === 0 ? (
          <p className="muted">No subió imágenes todavía.</p>
        ) : (
          <div className="grid">
            {images.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                ownerName={user.nickname}
                onDelete={isOwnProfile || currentUser?.role === 'admin' ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
