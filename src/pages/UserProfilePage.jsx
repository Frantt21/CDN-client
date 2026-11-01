import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, avatarUrl, bannerUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Dialog } from '../components/Dialog'
import { ImageEditDialog } from '../components/ImageEditDialog'
import ProfileImageModal from '../components/ProfileImageModal'
import Masonry from '../components/Masonry'
import { MasonrySkeleton, ProfileSkeleton } from '../components/Skeletons'
import { UserAvatar } from '../components/UserAvatar'
import { useFeed } from '../hooks/useFeed'
import { ensureConnected, onRealtime } from '../realtime/client'
import { extractDominantColor } from '../utils/colors'
import { getImageStyle } from '../utils/imagePosition'
import { imageToMasonryItem } from '../utils/masonry'
import { readCached, writeCached } from '../utils/cache'
import {
  HiPencil,
  HiDotsVertical,
  HiLink,
  HiCheck,
} from 'react-icons/hi'

const PROFILE_TTL_MS = 5 * 60 * 1000
const profileCacheKey = (username) => `cdn_profile_${username}`
const profileImagesCacheKey = (id) => `cdn_profile_images_${id}`
const USERNAME_REGEX = /^[a-z0-9_]+$/
// Posición inicial de una imagen nueva (centrada; el banner arranca con el
// zoom mínimo del modo background, igual que antes).
const DEFAULT_AVATAR_POSITION = JSON.stringify({ x: 50, y: 50, zoom: 1 })
const DEFAULT_BANNER_POSITION = JSON.stringify({ x: 50, y: 50, zoom: 1.05 })

export function UserProfilePage() {
  const { username = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { user: currentUser, updateUser } = useAuth()
  const { images: feedImages, users, savedIds, toggleSave, removeImage, updateImage } = useFeed()

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
  // True mientras el feed del perfil no tiene datos (ni caché ni fetch resuelto):
  // muestra skeleton en vez del mensaje "no subió imágenes" que parpadea.
  const [feedLoading, setFeedLoading] = useState(() => {
    const cachedUser = readCached(profileCacheKey(username), PROFILE_TTL_MS)
    return !(cachedUser && readCached(profileImagesCacheKey(cachedUser.id), PROFILE_TTL_MS))
  })

  const [editing, setEditing] = useState(false)
  const [editingImage, setEditingImage] = useState(null)
  const [nickname, setNickname] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [description, setDescription] = useState('')
  // Imagen que se está editando en el submodal: null | 'banner' | 'avatar'
  const [mediaEditor, setMediaEditor] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [avatarPosition, setAvatarPosition] = useState(() => readCached(profileCacheKey(username), PROFILE_TTL_MS)?.avatarPosition ?? null)
  const [bannerPosition, setBannerPosition] = useState(() => readCached(profileCacheKey(username), PROFILE_TTL_MS)?.bannerPosition ?? null)
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle | checking | available | taken | invalid
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  // Color del anillo del avatar: dominante de la imagen (paleta generadora).
  const [avatarRingColor, setAvatarRingColor] = useState(null)
  const profileRef = useRef(null)
  // Ratio del contenedor real del banner (la sección): el editor usa el mismo
  // ratio para que el preview coincida exactamente con el render (como FastChange,
  // que fija el ratio del contenedor y se lo pasa al editor).
  const [bannerAspect, setBannerAspect] = useState(3.2)

  useEffect(() => {
    const measure = () => {
      const el = profileRef.current
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        setBannerAspect(el.offsetWidth / el.offsetHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

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
          setFeedLoading(false)
          writeCached(profileImagesCacheKey(u.id), imgs)
        } catch {
          // sin imágenes frescas: se mantiene lo cacheado
          if (active) setFeedLoading(false)
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

  // Extrae el color dominante del avatar para el anillo (con caché por URL).
  useEffect(() => {
    let active = true
    if (user?.avatarUrl && user?.id) {
      extractDominantColor(avatarUrl(user.id)).then((color) => {
        if (active && color) setAvatarRingColor(color)
      })
    } else {
      setAvatarRingColor(null)
    }
    return () => {
      active = false
    }
  }, [user?.id, user?.avatarUrl])

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

  // Libera los object URLs de los previews al cambiar de archivo, cerrar el diálogo o desmontar.
  useEffect(() => {
    if (!editing && (avatarPreview || bannerPreview)) {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (bannerPreview) URL.revokeObjectURL(bannerPreview)
      setAvatarPreview(null)
      setBannerPreview(null)
    }
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    }
  }, [avatarPreview, bannerPreview, editing])

  // Cierra el dropdown de opciones al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onDown = (e) => {
      if (!e.target.closest('[data-menu]')) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [menuOpen])

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
    // Re-medir el ratio del banner al abrir el diálogo (el editor lo usa).
    const el = profileRef.current
    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
      setBannerAspect(el.offsetWidth / el.offsetHeight)
    }
    setNickname(user.nickname)
    setEditUsername(user.username)
    setDescription(user.description ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setBannerFile(null)
    setBannerPreview(null)
    setAvatarPosition(user.avatarPosition ?? null)
    setBannerPosition(user.bannerPosition ?? null)
    setUsernameStatus('idle')
    setSaveError(null)
    setMediaEditor(null)
    setEditing(true)
  }

  /** Aplica lo elegido en el submodal de imagen (archivo, preview y posición).
   *  Si no se eligió un archivo nuevo, solo se guarda la posición. */
  const handleMediaApply = (type, { file, preview, position }) => {
    if (type === 'banner') {
      if (file) {
        setBannerFile(file)
        setBannerPreview(preview)
      }
      setBannerPosition(position)
    } else {
      if (file) {
        setAvatarFile(file)
        setAvatarPreview(preview)
      }
      setAvatarPosition(position)
    }
  }

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/users/${user.username}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setMenuOpen(false)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
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
      if (avatarFile || avatarPosition !== (user.avatarPosition ?? null)) {
        next = await api.updateAvatar(user.id, avatarFile, avatarPosition)
      }
      if (bannerFile || bannerPosition !== (user.bannerPosition ?? null)) {
        next = await api.updateBanner(user.id, bannerFile, bannerPosition)
      }
      setUser(next)
      updateUser({
        nickname: next.nickname,
        username: next.username,
        ...(next.avatarUrl ? { avatarUrl: next.avatarUrl } : {}),
        ...(next.bannerUrl ? { bannerUrl: next.bannerUrl } : {}),
        ...(next.avatarPosition ? { avatarPosition: next.avatarPosition } : {}),
        ...(next.bannerPosition ? { bannerPosition: next.bannerPosition } : {}),
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

  const handleEdit = (id) => {
    setEditingImage(profileImages.find((img) => img.id === id) ?? null)
  }

  // Al editar desde el perfil, actualiza también las imágenes del perfil.
  const handleEditSaved = async (id, data) => {
    const updated = await updateImage(id, data)
    setProfileImages((prev) => prev.map((img) => (img.id === id ? updated : img)))
    return updated
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
        onEdit:
          currentUser && (currentUser.userId === img.userId || currentUser.role === 'admin')
            ? handleEdit
            : undefined,
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
          onEdit:
            currentUser && (currentUser.userId === img.userId || currentUser.role === 'admin')
              ? handleEdit
              : undefined,
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
        {/* El ref va en el banner (no en la sección) para medir SOLO su ratio */}
        <div ref={profileRef} className="profile-main">
          {user.bannerUrl && (
            <div className="profile-banner">
              <img
                src={bannerUrl(user.id)}
                alt=""
                style={getImageStyle(user.bannerPosition)}
              />
            </div>
          )}
          <UserAvatar user={user} className="avatar-lg" ringColor={avatarRingColor} />
          <div className="profile-info">
          <h1>
            {user.nickname}
            {user.role === 'admin' && <span className="role-badge">{t('profile.admin')}</span>}
          </h1>
          <p className="muted">
            @{user.username} · {t('profile.since', { date: new Date(user.createdAt).toLocaleDateString() })} ·{' '}
            {t('profile.imagesCount', { count: profileImages.length })}
          </p>
          {user.description && <p className="profile-description">{user.description}</p>}
          <div className="profile-actions">
            {isOwnProfile && (
              <button type="button" className="btn btn-glass" onClick={startEditing}>
                {t('profile.editProfile')}
              </button>
            )}
            <div className="masonry-menu" data-menu>                <button
                type="button"
                className="btn btn-glass profile-dots-btn"
                aria-label={t('profile.moreOptions')}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <HiDotsVertical />
              </button>
              {menuOpen && (
                <div className="masonry-dropdown">
                  <button type="button" onClick={handleCopyUrl}>
                    {copied ? <HiCheck /> : <HiLink />}
                    {copied ? t('profile.urlCopied') : t('profile.copyUrl')}
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Cards al lado del banner (fuera de él) */}
        <div className="profile-stats">
          <div className="profile-stat-card">
            <span className="profile-stat-value">{profileImages.length}</span>
            <span className="profile-stat-label">{t('profile.imagesLabel')}</span>
          </div>
          {isOwnProfile && (
            <Link to="/saved" className="profile-stat-card profile-stat-link">
              <span className="profile-stat-value">{savedIds.size}</span>
              <span className="profile-stat-label">{t('profile.savedLabel')}</span>
            </Link>
          )}
        </div>
      </section>

      <Dialog
        open={editing}
        onClose={() => {
          setMediaEditor(null)
          setEditing(false)
        }}
        title={t('profile.editProfile')}
        wide
      >
        <form className="media-editor-grid" onSubmit={handleSave}>
          {/* Columna izquierda: banner y avatar (editores de posición) */}
          <div className="media-editor-col">
            {saveError && <p className="error">{saveError}</p>}

            {/* Preview del perfil (estilo FastChange): el avatar va encima del
                banner y cada imagen se edita en su submodal con zoom y drag. */}
            <div className="profile-edit-preview">
              <div
                className="profile-edit-preview-banner"
                style={{ aspectRatio: String(bannerAspect) }}
              >
                {bannerPreview || user.bannerUrl ? (
                  <img
                    className="profile-edit-preview-banner-img"
                    src={bannerPreview ?? bannerUrl(user.id)}
                    alt=""
                    style={getImageStyle(bannerPosition)}
                  />
                ) : (
                  <button
                    type="button"
                    className="profile-edit-banner-empty"
                    onClick={() => setMediaEditor('banner')}
                  >
                    {t('profile.banner')}
                  </button>
                )}

                <span className="profile-edit-preview-overlay" aria-hidden="true" />

                <button
                  type="button"
                  className="profile-edit-camera profile-edit-camera--banner"
                  aria-label={t('profile.changeBanner')}
                  title={t('profile.changeBanner')}
                  onClick={() => setMediaEditor('banner')}
                >
                  <HiPencil />
                </button>

                <div className="profile-edit-preview-avatar">
                  {avatarPreview || user.avatarUrl ? (
                    <img
                      className="profile-edit-preview-avatar-img"
                      src={avatarPreview ?? avatarUrl(user.id)}
                      alt=""
                      style={getImageStyle(avatarPosition)}
                    />
                  ) : (
                    <span className="avatar-picker-initial profile-edit-avatar-initial">
                      {user.nickname?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <button
                    type="button"
                    className="profile-edit-camera profile-edit-camera--avatar"
                    aria-label={t('profile.changeAvatar')}
                    title={t('profile.changeAvatar')}
                    onClick={() => setMediaEditor('avatar')}
                  >
                    <HiPencil />
                  </button>
                </div>

                <div className="profile-edit-preview-info">
                  <span className="profile-edit-preview-name">
                    {nickname || user.nickname}
                  </span>
                  <span className="profile-edit-preview-username">
                    @{editUsername || user.username}
                  </span>
                  {description && <p className="profile-edit-preview-bio">{description}</p>}
                </div>
              </div>
            </div>

            {bannerFile && <span className="muted">{bannerFile.name}</span>}
            {avatarFile && <span className="muted">{avatarFile.name}</span>}
          </div>

          {/* Columna derecha: los inputs */}
          <div className="media-editor-fields">
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
                rows={4}
              />
            </label>
            <div className="media-editor-actions">
              <button type="submit" className="btn btn-primary" disabled={saving || usernameBlocked}>
                {saving ? t('profile.saving') : t('common.save')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Submodales de edición de imagen (banner / avatar), como en FastChange */}
      {mediaEditor === 'banner' && (
        <ProfileImageModal
          open
          title={t('profile.changeBanner')}
          currentUrl={bannerPreview ?? (user.bannerUrl ? bannerUrl(user.id) : null)}
          initialPosition={bannerPosition}
          aspectRatio={bannerAspect}
          defaultPosition={DEFAULT_BANNER_POSITION}
          onApply={(payload) => handleMediaApply('banner', payload)}
          onClose={() => setMediaEditor(null)}
        />
      )}
      {mediaEditor === 'avatar' && (
        <ProfileImageModal
          open
          title={t('profile.changeAvatar')}
          currentUrl={avatarPreview ?? (user.avatarUrl ? avatarUrl(user.id) : null)}
          initialPosition={avatarPosition}
          aspectRatio={1}
          circular
          canvasWidth={220}
          defaultPosition={DEFAULT_AVATAR_POSITION}
          onApply={(payload) => handleMediaApply('avatar', payload)}
          onClose={() => setMediaEditor(null)}
        />
      )}

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
        {feedLoading ? (
          <MasonrySkeleton count={8} />
        ) : feedItems.length === 0 ? (
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
      <ImageEditDialog
        image={editingImage}
        onClose={() => setEditingImage(null)}
        onSaved={handleEditSaved}
      />
    </main>
  )
}
