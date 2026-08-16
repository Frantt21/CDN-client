import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, avatarUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Dialog } from '../components/Dialog'
import Masonry from '../components/Masonry'
import { ProfileSkeleton } from '../components/Skeletons'
import { UserAvatar } from '../components/UserAvatar'
import { useFeed } from '../hooks/useFeed'
import { ensureConnected, onRealtime } from '../realtime/client'
import { imageToMasonryItem } from '../utils/masonry'
import { readCached, writeCached } from '../utils/cache'

const PROFILE_TTL_MS = 5 * 60 * 1000
const profileCacheKey = (username) => `cdn_profile_${username}`
const profileImagesCacheKey = (id) => `cdn_profile_images_${id}`
const USERNAME_REGEX = /^[a-z0-9_]+$/

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

export function UserProfilePage() {
  const { username = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { user: currentUser, updateUser } = useAuth()
  const { images: feedImages, users, savedIds, toggleSave, removeImage } = useFeed()

  // Lazy-init desde la caché: al volver a un perfil ya visitado se muestra al
  // instante y el fetch fresco se hace en segundo plano (stale-while-revalidate).
  // La ruta usa key={username}, así este estado arranca cacheado por perfil.
  const [user, setUser] = useState(() => readCached(profileCacheKey(username), PROFILE_TTL_MS))
  const [profileImages, setProfileImages] = useState(() => {
    const cachedUser = readCached(profileCacheKey(username), PROFILE_TTL_MS)
    if (!cachedUser) return []
    return readCached(profileImagesCacheKey(cachedUser.id), PROFILE_TTL_MS) ?? []
  })
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle | checking | available | taken | invalid
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef(null)

  const isOwnProfile = currentUser?.userId === user?.id
  const tab = params.get('tab') === 'saved' ? 'saved' : 'feed'
  const setTab = (next) => setParams({ tab: next })

  useEffect(() => {
    let active = true
    setError(null)
    setEditing(false)

    void (async () => {
      try {
        const u = await api.getUserByUsername(username)
        if (!active) return
        setUser(u)
        writeCached(profileCacheKey(username), u)
        try {
          const imgs = await api.getImages(u.id)
          if (!active) return
          setProfileImages(imgs)
          writeCached(profileImagesCacheKey(u.id), imgs)
        } catch {
          // sin imágenes frescas: se mantiene lo cacheado
        }
      } catch (err) {
        // Si ya mostramos algo cacheado, no romper con un error de refresco.
        if (active && !readCached(profileCacheKey(username), PROFILE_TTL_MS)) {
          setError(err instanceof Error ? err.message : t('profile.loadError'))
        }
      }
    })()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, t])

  // Tiempo real: si el perfil que estoy viendo cambia o le borran una imagen,
  // se actualiza sin recargar la página.
  useEffect(() => {
    void ensureConnected()
    const offUser = onRealtime('user:updated', (updated) => {
      if (updated?.username === username) {
        setUser(updated)
        writeCached(profileCacheKey(username), updated)
      }
    })
    const offDeleted = onRealtime('image:deleted', (id) => {
      setProfileImages((prev) => {
        const next = prev.filter((img) => img.id !== id)
        return next.length === prev.length ? prev : next
      })
    })
    return () => {
      offUser()
      offDeleted()
    }
  }, [username])

  // Libera el object URL del preview al cambiar de archivo, cerrar el diálogo o desmontar.
  useEffect(() => {
    if (avatarPreview && !editing) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview, editing])

  // Disponibilidad del username en vivo (debounce) antes de guardar.
  useEffect(() => {
    const value = editUsername.trim().toLowerCase()
    if (!value || value === user?.username) {
      setUsernameStatus('idle')
      return
    }
    if (!USERNAME_REGEX.test(value)) {
      setUsernameStatus('invalid')
      return
    }
    let active = true
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const { available } = await api.checkUsername(value, currentUser?.userId)
        if (active) setUsernameStatus(available ? 'available' : 'taken')
      } catch {
        if (active) setUsernameStatus('idle')
      }
    }, 350)
    return () => {
      active = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editUsername, user?.username, currentUser?.userId])

  const startEditing = () => {
    if (!user) return
    setNickname(user.nickname)
    setEditUsername(user.username)
    setDescription(user.description ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setUsernameStatus('idle')
    setSaveError(null)
    setEditing(true)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    setAvatarPreview(file ? URL.createObjectURL(file) : null)
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
      // Guarda el perfil actualizado bajo su clave (nueva si cambió el username)
      // para que el remount muestre contenido al instante.
      writeCached(profileCacheKey(next.username), next)
      if (next.username !== username) navigate(`/users/${next.username}`)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await removeImage(id)
      setProfileImages((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : t('profile.deleteError'))
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
    return <ProfileSkeleton />
  }

  const usernameBlocked =
    usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'

  return (
    <main className="container">
      <section className="profile">
        <UserAvatar user={user} className="avatar-lg" />
        <div>
          <h1>
            {user.nickname}
            {user.role === 'admin' && <span className="role-badge">{t('profile.admin')}</span>}
          </h1>
          <p className="muted">
            @{user.username} · {t('profile.since', { date: new Date(user.createdAt).toLocaleDateString() })}
          </p>
          {user.description && <p>{user.description}</p>}
          <div className="profile-stats">
            <span className="stat">
              <ImageIcon />
              {t('profile.imagesCount', { count: profileImages.length })}
            </span>
          </div>
          {isOwnProfile && (
            <button type="button" className="btn btn-secondary" onClick={startEditing}>
              {t('profile.editProfile')}
            </button>
          )}
        </div>
      </section>

      <Dialog open={editing} onClose={() => setEditing(false)} title={t('profile.editProfile')}>
        <form className="form" onSubmit={handleSave}>
          {saveError && <p className="error">{saveError}</p>}

          <div className="avatar-picker">
            <button
              type="button"
              className="avatar-picker-btn"
              aria-label={t('profile.changeAvatar')}
              title={t('profile.changeAvatar')}
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" />
              ) : user.avatarUrl ? (
                <img src={avatarUrl(user.id)} alt="" />
              ) : (
                <span className="avatar-picker-initial">{user.nickname?.[0]?.toUpperCase()}</span>
              )}
              <span className="avatar-picker-overlay" aria-hidden="true">
                <PencilIcon />
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="visually-hidden"
              onChange={handleAvatarChange}
            />
            {avatarFile && <span className="muted">{avatarFile.name}</span>}
          </div>

          <label>
            {t('profile.nickname')}
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </label>
          <label>
            {t('profile.username')}
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
              pattern="[a-z0-9_]+"
              aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
              aria-describedby="username-status"
              required
            />
            <span
              id="username-status"
              className={`username-status ${usernameStatus}`}
              role="status"
            >
              {usernameStatus === 'checking' && t('profile.usernameChecking')}
              {usernameStatus === 'available' && t('profile.usernameAvailable')}
              {usernameStatus === 'taken' && t('profile.usernameTaken')}
              {usernameStatus === 'invalid' && t('profile.usernameInvalid')}
            </span>
          </label>
          <label>
            {t('profile.description')}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || usernameBlocked}>
              {saving ? t('profile.saving') : t('common.save')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Dialog>

      <div className="explore-tabs profile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'feed'}
          className={`btn ${tab === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('feed')}
        >
          {t('profile.feedTab')}
        </button>
        {isOwnProfile && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'saved'}
            className={`btn ${tab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('saved')}
          >
            {t('profile.savedTab')}
          </button>
        )}
      </div>

      {/*
        Ambos tableros se mantienen montados y solo se ocultan con CSS
        para que las cards NO se re-monten al alternar feed/saved.
      */}
      <section hidden={isOwnProfile && tab !== 'feed'} aria-hidden={isOwnProfile && tab !== 'feed'}>
        <h2>{t('profile.imagesOf', { nickname: user.nickname })}</h2>
        {feedItems.length === 0 ? (
          <p className="muted">{t('profile.noImagesYet')}</p>
        ) : (
          <Masonry
            items={feedItems}
            animateFrom="bottom"
            onItemClick={(item) => navigate(`/images/${item.id}`)}
          />
        )}
      </section>

      {isOwnProfile && (
        <section hidden={tab !== 'saved'} aria-hidden={tab !== 'saved'}>
          <h2>{t('profile.savedOf', { nickname: user.nickname })}</h2>
          {savedItems.length === 0 ? (
            <p className="muted">
              {t('profile.noSavedYet')} {t('profile.savedHint')}
            </p>
          ) : (
            <Masonry
              items={savedItems}
              animateFrom="bottom"
              onItemClick={(item) => navigate(`/images/${item.id}`)}
            />
          )}
        </section>
      )}
    </main>
  )
}
