import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Masonry from '../components/Masonry'
import { MasonrySkeleton } from '../components/Skeletons'
import { UserAvatar } from '../components/UserAvatar'
import { useFeed } from '../hooks/useFeed'
import { imageToMasonryItem } from '../utils/masonry'

export function ExplorePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { images, users, loading, savedIds, toggleSave, removeImage } = useFeed()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')

  const tab = params.get('tab') === 'users' ? 'users' : 'images'
  const setTab = (next) => {
    if (next === 'users') setParams({ tab: 'users' })
    else setParams({})
  }

  const ownerNames = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.nickname])),
    [users],
  )

  const q = query.trim().toLowerCase()
  const allImages = useMemo(() => images ?? [], [images])

  const searchResults = useMemo(() => {
    if (!q) return []
    return allImages.filter(
      (img) =>
        img.name.toLowerCase().includes(q) ||
        (img.description ?? '').toLowerCase().includes(q) ||
        (ownerNames.get(img.userId) ?? '').toLowerCase().includes(q),
    )
  }, [allImages, q, ownerNames])

  const recommended = useMemo(() => allImages.slice(0, 12), [allImages])

  const handleDelete = async (id) => {
    try {
      await removeImage(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : t('feed.deleteError'))
    }
  }

  const items = useMemo(
    () =>
      (q ? searchResults : recommended).map((img) => ({
        ...imageToMasonryItem(img, ownerNames.get(img.userId)),
        saved: savedIds.has(img.id),
        onToggleSave: user ? toggleSave : undefined,
        canDelete: Boolean(user && (user.userId === img.userId || user.role === 'admin')),
        onDelete: user ? handleDelete : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchResults, recommended, savedIds],
  )

  return (
    <main className="container">
      <h1>{t('explore.title')}</h1>

      <div className="explore-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'images'}
          className={`btn ${tab === 'images' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('images')}
        >
          {t('explore.tabImages')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'users'}
          className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('users')}
        >
          {t('explore.tabUsers')}
        </button>
      </div>

      {tab === 'users' ? (
        <section>
          <h2>{t('explore.usersTitle')}</h2>
          {loading ? (
            <div className="user-list" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton-line" style={{ width: 180, borderRadius: 999 }} />
              ))}
            </div>
          ) : (users ?? []).length === 0 ? (
            <p className="muted">{t('explore.noUsers')}</p>
          ) : (
            <ul className="user-list">
              {(users ?? []).map((u) => (
                <li key={u.id}>
                  <Link to={`/users/${u.username}`} className="user-chip">
                    <UserAvatar user={u} />
                    <span>
                      <strong>{u.nickname}</strong> <small>@{u.username}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section>
          <label className="explore-search">
            {t('explore.searchLabel')}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('explore.searchPlaceholder')}
            />
          </label>

          {loading ? (
            <MasonrySkeleton count={12} />
          ) : q ? (
            searchResults.length === 0 ? (
              <p className="muted">{t('explore.noResults', { query })}</p>
            ) : (
              <>
                <h2>{t('explore.results')}</h2>
                <Masonry
                  items={items}
                  animateFrom="bottom"
                  onItemClick={(item) => navigate(`/images/${item.id}`)}
                />
              </>
            )
          ) : (
            <>
              <h2>{t('explore.recommendations')}</h2>
              {recommended.length === 0 ? (
                <p className="muted">{t('explore.noImages')}</p>
              ) : (
                <Masonry
                  items={items}
                  animateFrom="bottom"
                  onItemClick={(item) => navigate(`/images/${item.id}`)}
                />
              )}
            </>
          )}
        </section>
      )}
    </main>
  )
}
