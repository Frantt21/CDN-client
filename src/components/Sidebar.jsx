import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { UserAvatar } from './UserAvatar'
import './Sidebar.css'

function Icon({ d, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d}
    </svg>
  )
}

const houseIcon = (
  <Icon
    d={
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </>
    }
  />
)
const exploreIcon = <Icon d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
const uploadIcon = <Icon d={<><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 20h16" /></>} />
const settingsIcon = <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" /></>} />
const menuIcon = <Icon d={<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>} />
const collapseIcon = <Icon d={<path d="m15 6-6 6 6 6" />} />
const expandIcon = <Icon d={<path d="m9 6 6 6-6 6" />} />

/** Sidebar flotante a la izquierda, colapsable a íconos. */
export default function Sidebar({ collapsed, onToggleCollapse }) {
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
        {menuIcon}
      </button>

      {open && <div className="sidebar-backdrop" onClick={close} />}

      <aside className={`sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-head">
          <Link to="/" className="sidebar-brand" onClick={close} title="CDN-backend">
            {collapsed ? <span className="sidebar-brand-mark">C</span> : 'CDN-backend'}
          </Link>
          <button
            type="button"
            className="sidebar-collapse-btn"
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            onClick={onToggleCollapse}
          >
            {collapsed ? expandIcon : collapseIcon}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={close}
            title={t('nav.feed')}
          >
            {houseIcon}
            <span className="sidebar-label">{t('nav.feed')}</span>
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={close}
            title={t('nav.explore')}
          >
            {exploreIcon}
            <span className="sidebar-label">{t('nav.explore')}</span>
          </NavLink>
          {user && (
            <NavLink
              to="/upload"
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={close}
              title={t('nav.uploadImage')}
            >
              {uploadIcon}
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
              {settingsIcon}
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
