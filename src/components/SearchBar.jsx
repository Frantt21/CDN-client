import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import './SearchBar.css'

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
        <FiSearch />
      </button>
    </form>
  )
}
