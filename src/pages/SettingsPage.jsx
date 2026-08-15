import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function SettingsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <main className="container narrow">
      <h1>Settings</h1>
      <p className="muted">
        Próximamente: preferencias de cuenta, tema y notificaciones.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-danger" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </main>
  )
}
