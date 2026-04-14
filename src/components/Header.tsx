import { useI18n } from '../i18n/context'
import { useHelp } from '../routes/__root'
import { useSettings } from '../routes/__root'

export default function Header() {
  const { t } = useI18n()
  const { settingsOpen, toggleSettings } = useSettings()
  const { helpOpen, toggleHelp } = useHelp()

  return (
    <header className="flex-shrink-0 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <div className="page-wrap flex items-center justify-between py-3 sm:py-4">
        <h1 className="m-0 text-xl font-bold tracking-tight">
          <span className="display-title text-[var(--sea-ink)]">Sono</span>
        </h1>

        <div className="flex items-center gap-1">
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
            <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>

          {/* Settings trigger */}
          <button
            onClick={toggleSettings}
            aria-label={t.settings}
            aria-pressed={settingsOpen}
            className={`rounded-xl p-2 transition hover:bg-[var(--link-bg-hover)] ${
              settingsOpen
                ? 'bg-[var(--link-bg-hover)] text-[var(--sea-ink)]'
                : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
