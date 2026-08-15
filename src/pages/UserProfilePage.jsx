import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, avatarUrl } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Dialog } from '../components/Dialog'
import Masonry from '../components/Masonry'
import { ProfileSkeleton } from '../components/Skeletons'
import { useFeed } from '../hooks/useFeed'
import { imageToMasonryItem } from '../utils/masonry'
import { readCached, writeCached } from '../utils/cache'

const PROFILE_TTL_MS = 5 * 60 * 1000
const profileCacheKey = (username) => `cdn_profile_${username}`
const profileImagesCacheKey = (id) => `cdn_profile_images_${id}`

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
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { user: currentUser, updateUser } = useAuth()
  const { images: feedImages, users, savedIds, toggleSave, removeImage } = useFeed()
  const [user, setUser] = useState(null)
  const [loadedUsername, setLoadedUsername] = useState(null)
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
    setEditing(false)
    setLoadedUsername(null)
    setProfileImages([])
    setUser(null)

    const cachedUser = readCached(profileCacheKey(username), PROFILE_TTL_MS)
    if (cachedUser) {
      setUser(cachedUser)
      setLoadedUsername(username)
      const cachedImages = readCached(
        profileImagesCacheKey(cachedUser.id),
        PROFILE_TTL_MS,
      )
      if (cachedImages) setProfileImages(cachedImages)
    }

    void (async () => {
      try {
        const u = await api.getUserByUsername(username)
        if (!active) return
        setUser(u)
        setLoadedUsername(username)
        writeCached(profileCacheKey(username), u)
        try {
          const imgs = await api.getImages(u.id)
          if (!active) return
          setProfileImages(imgs)
          writeCached(profileImagesCacheKey(u.id), imgs)
        } catch {
          // sin imágenes en caché se mantiene vacío el feed del perfil
        }
      } catch (err) {
        if (active && !cachedUser) {
          setError(err instanceof Error ? err.message : t('profile.loadError'))
        }
      }
    })()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, t])

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

  if (!user || loadedUsername !== username) {
    return <ProfileSkeleton />
  }

  return (
    <main className="container">
      <section className="profile">
        <Avatar user={user} />
        <div>
          <h1>
            {user.nickname}
            {user.role === 'admin' && <span className="role-badge">{t('profile.admin')}</span>}
          </h1>
          <p className="muted">
            @{user.username} · {t('profile.since', { date: new Date(user.createdAt).toLocaleDateString() })}
          </p>
          {user.description && <p>{user.description}</p>}
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
              required
            />
          </label>
          <label>
            {t('profile.description')}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <label>
            {t('profile.avatar')}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
            {avatarFile && <span className="muted">{avatarFile.name}</span>}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
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

      {tab === 'saved' ? (
        <section>
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
      ) : (
        <section>
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
      )}
    </main>
  )
}