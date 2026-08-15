import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        📸 CDN-backend
      </Link>
      <nav className="nav-links">
        <NavLink to="/">Inicio</NavLink>
        {user && <NavLink to="/upload">Subir</NavLink>}
      </nav>
      <div className="nav-user">
        {user ? (
          <>
            <NavLink to={`/users/${user.username}`}>{user.nickname}</NavLink>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Salir
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Ingresar</NavLink>
            <Link to="/register" className="btn btn-primary">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
