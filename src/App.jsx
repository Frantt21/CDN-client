import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const profileTo = user ? `/users/${user.username}` : '/login'
  const savedTo = user ? `/users/${user.username}?tab=saved` : '/login'

  const navItems = useMemo(
    () => [
      {
        label: t('nav.home'),
        bgColor: '#21161A',
        textColor: '#F2F4F3',
        links: [
          { label: t('nav.feed'), ariaLabel: t('nav.feed'), to: '/' },
          { label: t('nav.profile'), ariaLabel: t('nav.profile'), to: profileTo },
          { label: t('nav.settings'), ariaLabel: t('nav.settings'), to: '/settings' },
        ],
      },
      {
        label: t('nav.explore'),
        bgColor: '#21161A',
        textColor: '#F2F4F3',
        links: [
          { label: t('nav.search'), ariaLabel: t('nav.search'), to: '/explore' },
          { label: t('nav.saved'), ariaLabel: t('nav.saved'), to: savedTo },
        ],
      },
      {
        label: t('nav.upload'),
        bgColor: '#49111C',
        textColor: '#F2F4F3',
        links: [
          { label: t('nav.uploadImage'), ariaLabel: t('nav.uploadImage'), to: '/upload' },
        ],
      },
    ],
    [profileTo, savedTo, t],
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
