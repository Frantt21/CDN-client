import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register({
        nickname,
        username,
        email,
        password,
        description: description.trim() || undefined,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrarse')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container narrow">
      <h1>Registrarse</h1>
      {error && <p className="error">{error}</p>}
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Nickname
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Cómo te mostrás ante los demás"
            required
          />
        </label>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="Solo letras, números y guiones bajos"
            pattern="[a-z0-9_]+"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Contraseña (mínimo 8 caracteres)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Descripción (opcional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>
      <p className="muted">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </main>
  )
}
