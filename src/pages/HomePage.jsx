import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ImageCard } from '../components/ImageCard'
import { useFeed } from '../hooks/useFeed'

export function HomePage() {
  const { user } = useAuth()
  const { images, users, loading, error, removeImage, savedIds, toggleSave } = useFeed()

  const handleDelete = async (id) => {
    try {
      await removeImage(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar la imagen')
    }
  }

  const ownerNames = new Map((users ?? []).map((u) => [u.id, u.nickname]))

  return (
    <main className="container">
      <h1>Feed</h1>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <section>
            <h2>Imágenes</h2>
            {images.length === 0 ? (
              <p className="muted">
                No hay imágenes todavía.{' '}
                {user ? '¡Subí la primera desde el menú!' : 'Registrate para subir la primera.'}
              </p>
            ) : (
              <div className="grid">
                {images.map((img) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    ownerName={ownerNames.get(img.userId)}
                    saved={savedIds.has(img.id)}
                    onToggleSave={user ? toggleSave : undefined}
                    onDelete={user ? handleDelete : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>Usuarios</h2>
            {users.length === 0 ? (
              <p className="muted">No hay usuarios registrados.</p>
            ) : (
              <ul className="user-list">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link to={`/users/${u.username}`} className="user-chip">
                      <span className="avatar">{u.nickname[0]?.toUpperCase()}</span>
                      <span>
                        <strong>{u.nickname}</strong> <small>@{u.username}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
