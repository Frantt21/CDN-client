import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ImageCard } from '../components/ImageCard'
import { useFeed } from '../hooks/useFeed'

export function ExplorePage() {
  const { user } = useAuth()
  const { images, users, loading, savedIds, toggleSave } = useFeed()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')

  const tab = params.get('tab') === 'saved' ? 'saved' : 'search'
  const setTab = (next) => {
    if (next === 'saved') setParams({ tab: 'saved' })
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

  const recommended = useMemo(
    () => allImages.slice(0, 6),
    [allImages],
  )

  const savedImages = useMemo(
    () => allImages.filter((img) => savedIds.has(img.id)),
    [allImages, savedIds],
  )

  const renderCard = (img) => (
    <ImageCard
      key={img.id}
      image={img}
      ownerName={ownerNames.get(img.userId)}
      saved={savedIds.has(img.id)}
      onToggleSave={user ? toggleSave : undefined}
    />
  )

  return (
    <main className="container">
      <h1>Explorar</h1>

      <div className="explore-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'search'}
          className={`btn ${tab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('search')}
        >
          Buscar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'saved'}
          className={`btn ${tab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('saved')}
        >
          Guardados
        </button>
      </div>

      {tab === 'saved' ? (
        <section>
          <h2>Guardados</h2>
          {!user ? (
            <p className="muted">Iniciá sesión para ver tus imágenes guardadas.</p>
          ) : loading ? (
            <p>Cargando…</p>
          ) : savedImages.length === 0 ? (
            <p className="muted">
              Todavía no guardaste ninguna imagen. Usá el ícono de marcador en el feed para
              guardarlas.
            </p>
          ) : (
            <div className="grid">{savedImages.map(renderCard)}</div>
          )}
        </section>
      ) : (
        <section>
          <label className="explore-search">
            Buscar imágenes por nombre, descripción o autor
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: playa, fotografía…"
            />
          </label>

          {loading ? (
            <p>Cargando…</p>
          ) : q ? (
            searchResults.length === 0 ? (
              <p className="muted">No se encontraron resultados para “{query}”.</p>
            ) : (
              <>
                <h2>Resultados</h2>
                <div className="grid">{searchResults.map(renderCard)}</div>
              </>
            )
          ) : (
            <>
              <h2>Recomendaciones</h2>
              {recommended.length === 0 ? (
                <p className="muted">No hay imágenes todavía.</p>
              ) : (
                <div className="grid">{recommended.map(renderCard)}</div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  )
}
