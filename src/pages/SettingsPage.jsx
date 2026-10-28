import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
    <main className="settings-page">
      <div style={{ padding: '1.5rem 1.5rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>{t('settings.title')}</h1>
        <p className="muted" style={{ margin: '0 0 1.5rem' }}>
          {t('settings.comingSoon')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="form-label" style={{ maxWidth: 280 }}>
            {t('settings.language')}
            <select
              value={i18n.language?.startsWith('en') ? 'en' : 'es'}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>

          <button
            type="button"
            className="btn btn-danger"
            style={{ width: 'fit-content' }}
            onClick={handleLogout}
          >
            {t('settings.logout')}
          </button>
        </div>
      </div>
    </main>
  )
}