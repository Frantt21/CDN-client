import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { setLanguage } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { FiSliders, FiLock, FiGlobe, FiChevronDown, FiCheck, FiLogOut } from 'react-icons/fi'
import './SettingsPage.css'

const LANGUAGES = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
]

const CATEGORIES = [
  {
    id: 'system',
    icon: FiSliders,
    titleKey: 'settings.categorySystem',
    descKey: 'settings.categorySystemDesc',
  },
  {
    id: 'account',
    icon: FiLock,
    titleKey: 'settings.categoryAccount',
    descKey: 'settings.categoryAccountDesc',
  },
]

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('system')
  const [selectOpen, setSelectOpen] = useState(false)
  const selectRef = useRef(null)

  // Cerrar el selector de idioma al hacer clic fuera o con Escape
  useEffect(() => {
    if (!selectOpen) return undefined
    const handleClick = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) setSelectOpen(false)
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [selectOpen])

  const locale = i18n.language?.startsWith('en') ? 'en' : 'es'
  const currentLang = LANGUAGES.find((l) => l.value === locale) || LANGUAGES[0]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <main className="settings-page">
      <div className="settings-card settings-card--split">
        {/* ── Panel izquierdo: navegación de categorías ── */}
        <nav className="settings-nav">
          {CATEGORIES.map(({ id, icon: Icon, titleKey, descKey }) => (
            <button
              key={id}
              type="button"
              className={`settings-nav-btn${activeCategory === id ? ' settings-nav-btn--active' : ''}`}
              onClick={() => {
                setSelectOpen(false)
                setActiveCategory(id)
              }}
            >
              <span className="settings-nav-icon">
                <Icon />
              </span>
              <div className="settings-nav-info">
                <span className="settings-nav-title">{t(titleKey)}</span>
                <span className="settings-nav-desc">{t(descKey)}</span>
              </div>
            </button>
          ))}
        </nav>

        {/* ── Panel derecho: contenido de la categoría activa ── */}
        <div className="settings-panel">
          {activeCategory === 'system' && (
            <>
              <div className="settings-row">
                <div className="settings-row-header">
                  <span className="settings-section-icon">
                    <FiSliders />
                  </span>
                  <div>
                    <h2 className="settings-section-title">{t('settings.appearance')}</h2>
                    <p className="settings-section-desc">{t('settings.appearanceDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-header">
                  <span className="settings-section-icon">
                    <FiGlobe />
                  </span>
                  <div>
                    <h2 className="settings-section-title">{t('settings.language')}</h2>
                    <p className="settings-section-desc">{t('settings.languageDesc')}</p>
                  </div>
                </div>

                <div className="settings-select-wrapper" ref={selectRef}>
                  <button
                    type="button"
                    className="settings-select-trigger"
                    onClick={() => setSelectOpen((s) => !s)}
                    aria-haspopup="listbox"
                    aria-expanded={selectOpen}
                  >
                    <span className="settings-flag">{currentLang.flag}</span>
                    <span className="settings-select-label">{currentLang.label}</span>
                    <FiChevronDown
                      className={`settings-select-arrow${selectOpen ? ' settings-select-arrow--open' : ''}`}
                    />
                  </button>

                  {selectOpen && (
                    <div className="settings-select-dropdown" role="listbox">
                      {LANGUAGES.map(({ value, label, flag }) => (
                        <button
                          key={value}
                          type="button"
                          role="option"
                          aria-selected={value === locale}
                          className={`settings-select-option${value === locale ? ' settings-select-option--active' : ''}`}
                          onClick={() => {
                            setLanguage(value)
                            setSelectOpen(false)
                          }}
                        >
                          <span className="settings-flag">{flag}</span>
                          <span>{label}</span>
                          {value === locale && <FiCheck className="settings-select-check" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeCategory === 'account' && (
            <div className="settings-row">
              <div className="settings-row-header">
                <span className="settings-section-icon">
                  <FiLogOut />
                </span>
                <div>
                  <h2 className="settings-section-title">{t('settings.logout')}</h2>
                  <p className="settings-section-desc">{t('settings.logoutDesc')}</p>
                </div>
              </div>
              <button type="button" className="settings-danger-btn" onClick={handleLogout}>
                <FiLogOut style={{ marginRight: 6 }} />
                {t('settings.logoutBtn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
