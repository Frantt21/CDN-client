import { useEffect, useRef, useState } from 'react'
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
  FiSidebar,
  FiCheck,
  FiLogIn,
  FiUserPlus,
} from 'react-icons/fi'
import './Sidebar.css'

const SIDEBAR_MODE_KEY = 'cdn_sidebar_mode'
const MODES = ['expanded', 'collapsed', 'hover']

function getInitialMode() {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_MODE_KEY)
    if (MODES.includes(stored)) return stored
  } catch {
    /* ignore */
  }
  return 'collapsed'
}

/** Sidebar flotante a la izquierda, con modos expandido / colapsado / hover. */
export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [mode, setMode] = useState(getInitialMode)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [open, setOpen] = useState(false) // slide-in en móvil
  const menuRef = useRef(null)
  const asideRef = useRef(null)

  // En modo 'hover' el sidebar está colapsado salvo que el ratón esté encima
  // o el foco del teclado esté dentro (accesibilidad).
  const collapsed = mode === 'collapsed' || (mode === 'hover' && !hovering && !focused)

  // Persistir preferencia del modo
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_MODE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  // Al entrar en modo 'hover': si el cursor ya está sobre el sidebar (p. ej. tras
  // pulsar el botón del footer, que está DENTRO del sidebar) expandir de inmediato.
  useEffect(() => {
    if (mode !== 'hover') {
      setHovering(false)
      setFocused(false)
      return
    }
    const el = asideRef.current
    if (!el) return
    setHovering(el.matches(':hover'))
    setFocused(el.contains(document.activeElement) && document.activeElement !== document.body)
  }, [mode])

  // Cerrar el menú de modos al hacer clic fuera o con Escape
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  // Escape cierra el slide-in de móvil
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  // Abre el menú de modos junto al botón (position: fixed, fuera del scroll del sidebar)
  const openSidebarMenu = (e) => {
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    const MENU_W = 168
    const MENU_H = 124
    let x = r.right + 8
    let y = r.bottom - MENU_H
    x = Math.max(8, Math.min(x, window.innerWidth - MENU_W - 8))
    y = Math.max(8, Math.min(y, window.innerHeight - MENU_H - 8))
    setMenuPos({ x, y })
    setMenuOpen((s) => !s)
  }

  const modeLabelFor = (m) =>
    m === 'expanded'
      ? t('nav.sidebarExpanded')
      : m === 'collapsed'
        ? t('nav.sidebarCollapsed')
        : t('nav.sidebarHover')

  // Al salir con el ratón también se quita el foco expandido: el modo hover solo
  // se mantiene expandido mientras el ratón está encima.
  const onMouseEnter = mode === 'hover' ? () => setHovering(true) : undefined
  const onMouseLeave =
    mode === 'hover'
      ? () => {
          setHovering(false)
          setFocused(false)
          setMenuOpen(false)
        }
      : undefined
  const onFocus = mode === 'hover' ? () => setFocused(true) : undefined
  const onBlur = mode === 'hover' ? () => setFocused(false) : undefined

  const linkClass = ({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`
  const modeLabel = modeLabelFor(mode)

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

      <aside
        ref={asideRef}
        className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${open ? ' open' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <div className="sidebar-brand">
          <Link to="/" className="minicard_profile" onClick={close} style={{ textDecoration: 'none' }}>
            <img className="sidebar-brand-logo" src="/favicon.svg" alt="CDN-backend" />
            <div className="user_nick" title="CDN-backend">
              <p>CDN-backend</p>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={linkClass} onClick={close} title={t('nav.feed')}>
            <span className="sidebar-icon">
              <FiHome />
            </span>
            <span>{t('nav.feed')}</span>
          </NavLink>

          <NavLink to="/explore" className={linkClass} onClick={close} title={t('nav.explore')}>
            <span className="sidebar-icon">
              <FiSearch />
            </span>
            <span>{t('nav.explore')}</span>
          </NavLink>

          {user && (
            <NavLink to="/upload" className={linkClass} onClick={close} title={t('nav.uploadImage')}>
              <span className="sidebar-icon">
                <FiUpload />
              </span>
              <span>{t('nav.uploadImage')}</span>
            </NavLink>
          )}

          {user && (
            <NavLink to="/settings" className={linkClass} onClick={close} title={t('nav.settings')}>
              <span className="sidebar-icon">
                <FiSettings />
              </span>
              <span>{t('nav.settings')}</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <Link
              to={`/users/${user.username}`}
              className="sidebar-link sidebar-profile"
              onClick={close}
              title={user.nickname}
            >
              <span className="sidebar-icon sidebar-profile-avatar">
                <UserAvatar user={user} />
              </span>
              <span className="user_nick">
                <p>{user.nickname}</p>
              </span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="sidebar-link" onClick={close} title={t('login.title')}>
                <span className="sidebar-icon">
                  <FiLogIn />
                </span>
                <span>{t('login.title')}</span>
              </Link>
              <Link to="/register" className="sidebar-link" onClick={close} title={t('register.title')}>
                <span className="sidebar-icon">
                  <FiUserPlus />
                </span>
                <span>{t('register.title')}</span>
              </Link>
            </>
          )}

          <div className="sidebar-mode-wrap">
            <button
              type="button"
              className="sidebar-link"
              onClick={openSidebarMenu}
              aria-label={`${modeLabel} — ${t('nav.sidebarCycle')}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={modeLabel}
            >
              <span className="sidebar-icon">
                <FiSidebar />
              </span>
              <span className="sidebar-footer-label">{modeLabel}</span>
            </button>

            {menuOpen && (
              <div
                className="sidebar-mode-menu"
                style={{ left: menuPos.x, top: menuPos.y }}
                ref={menuRef}
                role="menu"
              >
                {MODES.map((m) => {
                  const isActive = m === mode
                  return (
                    <button
                      key={m}
                      type="button"
                      role="menuitem"
                      className="sidebar-mode-menu-item"
                      onClick={() => {
                        setMode(m)
                        setMenuOpen(false)
                        setHovering(false)
                        setFocused(false)
                      }}
                    >
                      <span className="sidebar-icon">
                        <FiSidebar />
                      </span>
                      <span>{modeLabelFor(m)}</span>
                      {isActive && <FiCheck className="sidebar-mode-menu-check" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
