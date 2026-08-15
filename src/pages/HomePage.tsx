import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ImageCard } from '../components/ImageCard'
import type { ImageDto, UserDto } from '../types'

export function HomePage() {
  const { user } = useAuth()
  const [images, setImages] = useState<ImageDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [imgs, usrs] = await Promise.all([api.getImages(), api.getUsers()])
      setImages(imgs)
      setUsers(usrs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (id: number) => {
    try {
      await api.deleteImage(id)
      setImages((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar la imagen')
    }
  }

  const ownerNames = new Map(users.map((u) => [u.id, u.nickname]))

  return (
    <main className="container">
      <section className="hero">
        <h1>CDN-backend</h1>
        <p>Galería pública de imágenes subidas por la comunidad.</p>
      </section>

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
