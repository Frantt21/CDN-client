import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth/AuthContext'
import { FiEye, FiEyeOff } from 'react-icons/fi'

function PasswordField({ value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="password-field">
      {t('login.password')}
      <div className="password-input-wrap">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <FiEyeOff className="password-toggle-icon" /> : <FiEye className="password-toggle-icon" />}
        </button>
      </div>
    </label>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(credential, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container narrow">
      <h1>{t('login.title')}</h1>
      <div className="dialog-card">
        {error && <p className="error">{error}</p>}
        <form className="form" onSubmit={handleSubmit}>
          <label>
            {t('login.credential')}
            <input
              type="text"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <PasswordField
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
        <p className="muted">
          {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
        </p>
      </div>
    </main>
  )
}