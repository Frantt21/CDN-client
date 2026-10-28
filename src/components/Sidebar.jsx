import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { UserAvatar } from './UserAvatar'
import {
  FiHome,
  FiSearch,
  FiUpload,
  FiSettings,
  FiMenu,
} from 'react-icons/fi'
import './Sidebar.css'

/** Sidebar flotante a la izquierda, siempre colapsado a íconos. */
export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        aria-label={t('nav.menuOpen')}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FiMenu />
      </button>

      {open && <div className="sidebar-backdrop" onClick={close} />}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-head">
          <Link to="/" className="sidebar-brand" onClick={close} title="CDN-backend">
            <span className="sidebar-brand-mark">C</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={close}
            title={t('nav.feed')}
          >
            <FiHome />
            <span className="sidebar-label">{t('nav.feed')}</span>
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={close}
            title={t('nav.explore')}
          >
            <FiSearch />
            <span className="sidebar-label">{t('nav.explore')}</span>
          </NavLink>
          {user && (
            <NavLink
              to="/upload"
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={close}
              title={t('nav.uploadImage')}
            >
              <FiUpload />
              <span className="sidebar-label">{t('nav.uploadImage')}</span>
            </NavLink>
          )}
          {user && (
            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={close}
              title={t('nav.settings')}
            >
              <FiSettings />
              <span className="sidebar-label">{t('nav.settings')}</span>
            </NavLink>
          )}
        </nav>

        {user ? (
          <Link to={`/users/${user.username}`} className="sidebar-user" onClick={close} title={user.nickname}>
            <UserAvatar user={user} />
            <span className="sidebar-user-info">
              <span className="sidebar-user-name">{user.nickname}</span>
              <span className="sidebar-user-username">@{user.username}</span>
            </span>
          </Link>
        ) : (
          <div className="sidebar-auth">
            <Link to="/login" className="btn btn-glass" onClick={close}>
              {t('login.title')}
            </Link>
            <Link to="/register" className="btn btn-primary" onClick={close}>
              {t('register.title')}
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
