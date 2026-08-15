import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './css/header.css'

export function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    closeMenu()
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        CDN-backend
      </Link>

      <nav className="nav-links">
        <NavLink className="nav-link" to="/">
          Inicio
        </NavLink>
        <NavLink className="nav-link" to="/feed">
          Feed
        </NavLink>

        {user && (
          <NavLink className="nav-link nav-link-cta" to="/upload">
            Subir
          </NavLink>
        )}

        {!user && (
          <>
            <NavLink className="nav-link" to="/login">
              Ingresar
            </NavLink>
            <Link to="/register" className="btn btn-primary">
              Registrarse
            </Link>
          </>
        )}
      </nav>

      <div className="nav-actions">
        {user && (
          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="avatar-button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="avatar">{user.nickname[0]?.toUpperCase()}</span>
              {user.role === 'admin' && <span className="role-badge">admin</span>}
            </button>

            {menuOpen && (
              <div className="dropdown" role="menu">
                <div className="dropdown-header">
                  <strong>{user.nickname}</strong>
                  <span className="muted">@{user.username}</span>
                </div>
                <Link
                  to={`/users/${user.username}`}
                  className="dropdown-item"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  Perfil
                </Link>
                <Link to="/settings" className="dropdown-item" role="menuitem" onClick={closeMenu}>
                  Settings
                </Link>
                <button
                  type="button"
                  className="dropdown-item dropdown-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
