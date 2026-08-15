import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { setLanguage } from '../i18n'
import { useAuth } from '../auth/AuthContext'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <main className="container narrow">
      <h1>{t('settings.title')}</h1>
      <div className="dialog-card">
        <p className="muted">{t('settings.comingSoon')}</p>

        <label className="form-label">
          {t('settings.language')}
          <select
            value={i18n.language?.startsWith('en') ? 'en' : 'es'}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <div style={{ marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            {t('settings.logout')}
          </button>
        </div>

        <p>
          <Link to="/" className="btn btn-primary">
            {t('common.backToHome')}
          </Link>
        </p>
      </div>
    </main>
  )
}