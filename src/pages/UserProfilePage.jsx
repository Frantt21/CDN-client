import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, avatarUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import Masonry from '../components/Masonry'
import { useFeed } from '../hooks/useFeed'
import { imageToMasonryItem } from '../utils/masonry'

function Avatar({ user }) {
  if (user.avatarUrl) {
    return (
      <span className="avatar avatar-lg avatar-img">
        <img src={avatarUrl(user.id)} alt="" />
      </span>
    )
  }
  return <span className="avatar avatar-lg">{user.nickname[0]?.toUpperCase()}</span>
}

export function UserProfilePage() {
  const { username = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user: currentUser, updateUser } = useAuth()
  const { images: feedImages, users, savedIds, toggleSave, removeImage } = useFeed()
  const [user, setUser] = useState(null)
  const [profileImages, setProfileImages] = useState([])
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  const isOwnProfile = currentUser?.userId === user?.id
  const tab = params.get('tab') === 'saved' ? 'saved' : 'feed'
  const setTab = (next) => setParams({ tab: next })

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
        if (active) setProfileImages(imgs)
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
    setAvatarFile(null)
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
      let next = updated
      if (avatarFile) {
        next = await api.updateAvatar(user.id, avatarFile)
      }
      setUser(next)
      updateUser({
        nickname: next.nickname,
        username: next.username,
        ...(next.avatarUrl ? { avatarUrl: next.avatarUrl } : {}),
      })
      setEditing(false)
      if (next.username !== username) navigate(`/users/${next.username}`)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await removeImage(id)
      setProfileImages((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar la imagen')
    }
  }

  const ownerNames = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.nickname])),
    [users],
  )

  const feedItems = useMemo(
    () =>
      profileImages.map((img) => ({
        ...imageToMasonryItem(img, user?.nickname),
        saved: savedIds.has(img.id),
        onToggleSave: currentUser ? toggleSave : undefined,
        canDelete: Boolean(
          currentUser && (currentUser.userId === img.userId || currentUser.role === 'admin'),
        ),
        onDelete: currentUser ? handleDelete : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profileImages, user, savedIds],
  )

  const savedItems = useMemo(
    () =>
      (feedImages ?? [])
        .filter((img) => savedIds.has(img.id))
        .map((img) => ({
          ...imageToMasonryItem(img, ownerNames.get(img.userId)),
          saved: true,
          onToggleSave: toggleSave,
          canDelete: Boolean(
            currentUser && (currentUser.userId === img.userId || currentUser.role === 'admin'),
          ),
          onDelete: currentUser ? handleDelete : undefined,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feedImages, savedIds, users],
  )

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

  return (
    <main className="container">
      <section className="profile">
        <Avatar user={user} />
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
          <label>
            Avatar
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
            {avatarFile && <span className="muted">{avatarFile.name}</span>}
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

      <div className="explore-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'feed'}
          className={`btn ${tab === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('feed')}
        >
          Feed
        </button>
        {isOwnProfile && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'saved'}
            className={`btn ${tab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('saved')}
          >
            Guardados
          </button>
        )}
      </div>

      {tab === 'saved' ? (
        <section>
          <h2>Guardados de {user.nickname}</h2>
          {savedItems.length === 0 ? (
            <p className="muted">
              Todavía no guardaste ninguna imagen. Usá el menú de tres puntos en el feed para
              guardarlas.
            </p>
          ) : (
            <Masonry
              items={savedItems}
              animateFrom="bottom"
              onItemClick={(item) => navigate(`/images/${item.id}`)}
            />
          )}
        </section>
      ) : (
        <section>
          <h2>Imágenes de {user.nickname}</h2>
          {feedItems.length === 0 ? (
            <p className="muted">No subió imágenes todavía.</p>
          ) : (
            <Masonry
              items={feedItems}
              animateFrom="bottom"
              onItemClick={(item) => navigate(`/images/${item.id}`)}
            />
          )}
        </section>
      )}
    </main>
  )
}
