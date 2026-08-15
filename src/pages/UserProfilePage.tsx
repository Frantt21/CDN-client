import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import { ImageCard } from '../components/ImageCard'
import type { ImageDto, UserDto } from '../types'

export function UserProfilePage() {
  const { username = '' } = useParams()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<UserDto | null>(null)
  const [images, setImages] = useState<ImageDto[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setError(null)
    setUser(null)

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

  const handleDelete = async (id: number) => {
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
          <h1>{user.nickname}</h1>
          <p className="muted">
            @{user.username} · desde {new Date(user.createdAt).toLocaleDateString('es-AR')}
          </p>
          {user.description && <p>{user.description}</p>}
        </div>
      </section>

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
                onDelete={currentUser?.userId === user.id ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
