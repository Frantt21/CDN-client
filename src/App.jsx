import { useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import CardNav from './components/CardNav'
import { ProtectedRoute } from './components/ProtectedRoute'
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

function AppContent() {
  const { user } = useAuth()

  const profileTo = user ? `/users/${user.username}` : '/login'
  const savedTo = user ? `/users/${user.username}?tab=saved` : '/login'

  const navItems = useMemo(
    () => [
      {
        label: 'Inicio',
        bgColor: '#21161A',
        textColor: '#F2F4F3',
        links: [
          { label: 'Feed', ariaLabel: 'Ver el feed', to: '/' },
          { label: 'Perfil', ariaLabel: 'Ver tu perfil', to: profileTo },
          { label: 'Ajustes', ariaLabel: 'Abrir ajustes', to: '/settings' },
        ],
      },
      {
        label: 'Explorar',
        bgColor: '#21161A',
        textColor: '#F2F4F3',
        links: [
          { label: 'Buscar', ariaLabel: 'Buscar imágenes', to: '/explore' },
          { label: 'Guardados', ariaLabel: 'Ver tus imágenes guardadas', to: savedTo },
        ],
      },
      {
        label: 'Subir',
        bgColor: '#49111C',
        textColor: '#F2F4F3',
        links: [{ label: 'Subir imagen', ariaLabel: 'Subir una imagen', to: '/upload' }],
      },
    ],
    [profileTo, savedTo],
  )

  return (
    <>
      <CardNav
        items={navItems}
        brandText="CDN-backend"
        baseColor="#151013"
        menuColor="#F2F4F3"
        buttonBgColor="#49111C"
        buttonTextColor="#F2F4F3"
        ctaLabel="Subir"
        ctaTo="/upload"
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/feed" element={<Navigate to="/" replace />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/users/:username" element={<UserProfilePage />} />
        <Route path="/images/:id" element={<ImageDetailPage />} />
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
    </>
  )
}

export default App
