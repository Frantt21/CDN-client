import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth/AuthContext'

function PasswordField({ value, onChange, autoComplete, minLength, label }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="password-field">
      {label ?? t('register.password')}
      <div className="password-input-wrap">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="password-toggle-icon">
              <path
                fill="currentColor"
                d="M12 4.5a7.5 7.5 0 00-7.5 7.5c0 6.5 6.8 11.8 13.2 13.2 1.1 0 2.2-.2 3.2-.5-2.6 1.3-5.6 2-8.8 2-3.2 0-6.2-.7-8.8-2 .9.3 2 .5 3.2.5 6.5-1.4 12.3-6.7 12.3-13.2a7.5 7.5 0 00-7.5-7.5zM12 10a2 2 0 110 4 2 2 0 010-4z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="password-toggle-icon">
              <path
                fill="currentColor"
                d="M3.75 3.75a9 9 0 0111.28 3.13l.65 3.18a.75.75 0 01-.56 1.04l-2.5-2.5a.75.75 0 010-1.06l2.5-2.5a.75.75 0 011.04-.06l3.18.65a9 9 0 013.13 11.28 9 9 0 01-3.13 11.28l-.65-3.18a.75.75 0 01.56-1.04l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 01-1.04.06l-3.18-.65a9 9 0 01-3.13-11.28 9 9 0 013.13-11.28l.65 3.18A9.17 9.17 0 013.75 3.75zM12 3a1 1 0 011 1v5a1 1 0 01-2 0V4a1 1 0 011-1z"
              />
            </svg>
          )}
        </button>
      </div>
    </label>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const { t } = useTranslation()
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
      setError(err instanceof ApiError ? err.message : t('register.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container narrow">
      <h1>{t('register.title')}</h1>
      <div className="dialog-card">
        {error && <p className="error">{error}</p>}
        <form className="form" onSubmit={handleSubmit}>
          <label>
            {t('register.nickname')}
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('register.nicknamePlaceholder')}
              required
            />
          </label>
          <label>
            {t('register.username')}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder={t('register.usernamePlaceholder')}
              pattern="[a-z0-9_]+"
              required
            />
          </label>
          <label>
            {t('register.email')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <PasswordField
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
          />
          <label>
            {t('register.description')}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t('register.submitting') : t('register.submit')}
          </button>
        </form>
        <p className="muted">
          {t('register.haveAccount')} <Link to="/login">{t('register.loginLink')}</Link>
        </p>
      </div>
    </main>
  )
}