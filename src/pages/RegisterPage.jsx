import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth/AuthContext'

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
          <label>
            {t('register.password')}
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