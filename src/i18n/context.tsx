import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { type Locale, type Translations, translations } from './translations.tsx'

const STORAGE_KEY = 'sono_locale'

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && stored in translations) return stored
  const lang = navigator.language.slice(0, 2).toLowerCase()
  if (lang in translations) return lang as Locale
  return 'en'
}

interface I18nContext {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

const Context = createContext<I18nContext>({
  locale: 'en',
  t: translations.en,
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  // Resolve on the client only to avoid SSR mismatch
  useEffect(() => {
    setLocaleState(detectLocale())
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  // Keep <html lang> in sync whenever locale changes
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <Context value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </Context>
  )
}

export function useI18n() {
  return useContext(Context)
}
