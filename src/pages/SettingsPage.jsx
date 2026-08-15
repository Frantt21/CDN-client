import { Link } from 'react-router-dom'

export function SettingsPage() {
  return (
    <main className="container narrow">
      <h1>Settings</h1>
      <p className="muted">
        Próximamente: preferencias de cuenta, tema y notificaciones.
      </p>
      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </main>
  )
}
