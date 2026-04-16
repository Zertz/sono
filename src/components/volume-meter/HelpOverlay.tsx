'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/context'

interface HelpOverlayProps {
  open: boolean
  onClose: () => void
}

export default function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  const { t } = useI18n()
  const overlayRef = useRef<HTMLDivElement>(null)
  const helpButtonSelector = '[aria-label="' + t.help + '"]'

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const helpBtn = document.querySelector(helpButtonSelector)
      if (helpBtn && helpBtn.contains(target)) return
      if (overlayRef.current && !overlayRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open, onClose, helpButtonSelector])

  return (
    <div
      className={`settings-overlay pointer-events-none fixed inset-x-0 top-[57px] z-50 origin-top sm:top-[65px] ${open ? 'settings-overlay-open' : ''}`}
    >
      <div ref={overlayRef} className="settings-overlay-backdrop border-b border-[var(--line)] px-4 py-5">
        <div className="mx-auto w-full max-w-2xl">
          {/* Header row */}
          <div className="mb-4 flex items-center justify-between">
            <p className="island-kicker m-0">{t.help}</p>
            <button
              onClick={onClose}
              aria-label="Close help"
              className="rounded-lg p-1 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"
                />
              </svg>
            </button>
          </div>

          {/* iOS section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* Apple/phone icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[var(--sea-ink)]">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <h2 className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                {t.helpIosTitle}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Safari */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
                <p className="mb-3 m-0 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
                  {t.helpIosSafariTitle}
                </p>
                <ol className="m-0 space-y-2 pl-4">
                  {t.helpIosSafariSteps.map((step, i) => (
                    <li key={i} className="text-sm text-[var(--sea-ink)]">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Chrome / Firefox */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
                <p className="mb-3 m-0 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
                  {t.helpIosChromeTitle}
                </p>
                <ol className="m-0 space-y-2 pl-4">
                  {t.helpIosChromeSteps.map((step, i) => (
                    <li key={i} className="text-sm text-[var(--sea-ink)]">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* GitHub link */}
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <a
              href="https://github.com/Zertz/sono"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              {t.contributeOnGitHub}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
