import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function HomePage() {
  const { user } = useAuth()

  return (
    <main className="container landing">
      <section className="landing-hero">
        <h1>CDN-backend</h1>
        <p>
          Compartí imágenes con la comunidad: subí tus fotos, explorá el feed
          público y visitá los perfiles de otros usuarios.
        </p>
        <div className="landing-cta">
          <Link to="/feed" className="btn btn-primary">
            Explorar el feed
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-secondary">
              Crear cuenta
            </Link>
          )}
        </div>
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <h3>Subí imágenes</h3>
          <p>Arrastrá o seleccioná un archivo y publicalo al instante.</p>
        </div>
        <div className="feature-card">
          <h3>Galería pública</h3>
          <p>Explorá las imágenes subidas por toda la comunidad.</p>
        </div>
        <div className="feature-card">
          <h3>Tu perfil</h3>
          <p>Personalizá tu nickname, username y descripción.</p>
        </div>
      </section>
    </main>
  )
}
