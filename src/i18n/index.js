import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es'
import en from './locales/en'

const STORAGE_KEY = 'cdn_lang'

function detectLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')
    ? 'es'
    : 'en'
}

export function setLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang)
  i18n.changeLanguage(lang)
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

export default i18n