import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './SearchBar.css'

const searchIcon = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

/** Barra de búsqueda global del body: al buscar redirige a /explore?q=… */
export default function SearchBar({ className = '' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')

  // Refleja el query de /explore?q= cuando se está en esa ruta.
  useEffect(() => {
    if (location.pathname === '/explore') {
      setQuery(params.get('q') ?? '')
    }
  }, [location.pathname, params])

  const submit = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore')
  }

  return (
    <form className={`search-bar${className ? ` ${className}` : ''}`} role="search" onSubmit={submit}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.searchAria')}
      />
      <button type="submit" className="search-bar-btn" aria-label={t('nav.searchAria')}>
        {searchIcon}
      </button>
    </form>
  )
}
