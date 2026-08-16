import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import SearchBar from './components/SearchBar'
import Sidebar from './components/Sidebar'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UploadPage } from './pages/UploadPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { ExplorePage } from './pages/ExplorePage'
import { ImageDetailPage } from './pages/ImageDetailPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

// Re-monta la página por username/id: el lazy-init de caché arranca con los
// datos de la ruta correspondiente (sin mostrar skeleton ni estado viejo).
function ProfileRoute() {
  const { username } = useParams()
  return <UserProfilePage key={username} />
}

function ImageDetailRoute() {
  const { id } = useParams()
  return <ImageDetailPage key={id} id={id} />
}

const COLLAPSE_KEY = 'cdn_sidebar_collapsed'

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  )

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleCollapse} />
      <div className={`app-shell${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="app-topbar">
          <SearchBar />
        </div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<Navigate to="/" replace />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/users/:username" element={<ProfileRoute />} />
          <Route path="/images/:id" element={<ImageDetailRoute />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </>
  )
}

export default App
