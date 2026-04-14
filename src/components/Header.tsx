import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n/context'
import { useHelp } from '../routes/__root'
import type { Locale } from '../i18n/translations'

type ThemeMode = 'auto' | 'dark' | 'light'

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
]

function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
  document.documentElement.style.colorScheme = resolved
  window.localStorage.setItem('theme', mode)
}

// ---------------------------------------------------------------------------
// Reusable dropdown pill
// ---------------------------------------------------------------------------

interface DropdownPillProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function DropdownPill<T extends string>({ label, options, value, onChange }: DropdownPillProps<T>) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // Measure button position for fixed dropdown
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      if (dropRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  return (
    <div>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
          open
            ? 'border-[var(--lagoon)] bg-[var(--link-bg-hover)] text-[var(--sea-ink)]'
            : 'border-[var(--line)] text-[var(--sea-ink-soft)] hover:border-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
        }`}
      >
        {options.find((o) => o.value === value)?.label ?? label}
        <svg viewBox="0 0 10 6" width="8" height="8" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
          <polyline points="1 1 5 5 9 1" />
        </svg>
      </button>

      {open && rect && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: rect.bottom + 6,
            right: window.innerWidth - rect.right,
            zIndex: 9999,
          }}
          className="min-w-[80px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--header-bg)] shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-semibold transition hover:bg-[var(--link-bg-hover)] ${
                option.value === value
                  ? 'text-[var(--lagoon-deep)]'
                  : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
              }`}
            >
              {option.label}
              {option.value === value && (
                <svg viewBox="0 0 12 10" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 5 4.5 8.5 11 1" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export default function Header() {
  const { t, locale, setLocale } = useI18n()
  const { helpOpen, toggleHelp } = useHelp()
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const mode = getThemeMode()
    setThemeMode(mode)
    applyThemeMode(mode)
  }, [])

  useEffect(() => {
    if (themeMode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])

  function handleThemeMode(mode: ThemeMode) {
    setThemeMode(mode)
    applyThemeMode(mode)
  }

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'auto', label: t.themeAuto },
    { value: 'dark', label: t.themeDark },
    { value: 'light', label: t.themeLight },
  ]

  return (
    <header className="flex-shrink-0 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <div className="page-wrap flex items-center justify-between py-3 sm:py-4">
        <h1 className="m-0 text-xl font-bold tracking-tight">
          <span className="display-title text-[var(--sea-ink)]">Sono</span>
        </h1>

        <div className="flex items-center gap-2">
          {/* Locale picker */}
          <DropdownPill
            label={t.language}
            options={LOCALES.map(({ code, label }) => ({ value: code, label }))}
            value={locale}
            onChange={setLocale}
          />

          {/* Theme picker */}
          <DropdownPill
            label={t.theme}
            options={themeOptions}
            value={themeMode}
            onChange={handleThemeMode}
          />

          {/* Help trigger */}
          <button
            onClick={toggleHelp}
            aria-label={t.help}
            aria-pressed={helpOpen}
            className={`rounded-xl p-2 transition hover:bg-[var(--link-bg-hover)] ${
              helpOpen
                ? 'bg-[var(--link-bg-hover)] text-[var(--sea-ink)]'
                : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
