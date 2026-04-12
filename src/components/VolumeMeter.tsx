'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Creature from './Creature'
import { useI18n } from '../i18n/context'
import { type Locale } from '../i18n/translations.tsx'
import { useHelp, useSettings } from '../routes/__root'

type ThemeMode = 'light' | 'dark' | 'auto'

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

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
]

const STORAGE_KEY_BASELINE = 'sono_baseline'
const STORAGE_KEY_THRESHOLD = 'sono_threshold'
const DEFAULT_THRESHOLD = 20 // dB above baseline before warning
const CALIBRATION_DURATION = 3000 // ms

function readStorage(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const val = window.localStorage.getItem(key)
  if (val === null) return fallback
  const n = parseFloat(val)
  return isNaN(n) ? fallback : n
}

function writeStorage(key: string, value: number) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, String(value))
  }
}

// Convert RMS amplitude (0-1) to approximate dB (0-100 scale)
function rmsToDb(rms: number): number {
  if (rms <= 0) return 0
  // Map -60dBFS..0dBFS → 0..100
  const dbfs = 20 * Math.log10(rms)
  return Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100))
}

function playAlertTone(audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.frequency.value = 880
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + 0.35)
}

type Phase = 'idle' | 'calibrating' | 'active'

// ---------------------------------------------------------------------------
// Settings overlay
// ---------------------------------------------------------------------------

interface SettingsOverlayProps {
  open: boolean
  onClose: () => void
  themeMode: ThemeMode
  onThemeMode: (mode: ThemeMode) => void
}

function SettingsOverlay({
  open,
  onClose,
  themeMode,
  onThemeMode,
}: SettingsOverlayProps) {
  const { t, locale, setLocale } = useI18n()
  const overlayRef = useRef<HTMLDivElement>(null)
  const gearButtonSelector = '[aria-label="' + t.settings + '"]'

  // Click-outside to close
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      // Ignore clicks on the gear button itself (it handles toggle)
      const gearBtn = document.querySelector(gearButtonSelector)
      if (gearBtn && gearBtn.contains(target)) return
      if (overlayRef.current && !overlayRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open, onClose, gearButtonSelector])

  return (
    <div
      className={`settings-overlay pointer-events-none fixed inset-x-0 top-[57px] z-50 origin-top sm:top-[65px] ${open ? 'settings-overlay-open' : ''}`}
    >
      {/* Full-width backdrop strip */}
      <div ref={overlayRef} className="settings-overlay-backdrop border-b border-[var(--line)] px-4 py-5">
        {/* Centered content — max-w-2xl matches the meter card */}
        <div className="mx-auto w-full max-w-2xl">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <p className="island-kicker m-0">{t.settings}</p>
          <button
            onClick={onClose}
            aria-label="Close settings"
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

        <div className="space-y-5">
          {/* Language */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--sea-ink)]">
              {t.language}
            </span>
            <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--chip-bg)] p-0.5">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    locale === code
                      ? 'bg-[var(--lagoon-deep)] text-white shadow-sm'
                      : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--sea-ink)]">
              {t.theme}
            </span>
            <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--chip-bg)] p-0.5">
              {(
                [
                  { mode: 'auto', label: t.themeAuto },
                  { mode: 'dark', label: t.themeDark },
                  { mode: 'light', label: t.themeLight },
                ] as { mode: ThemeMode; label: string }[]
              ).map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => onThemeMode(mode)}
                  aria-pressed={themeMode === mode}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    themeMode === mode
                      ? 'bg-[var(--lagoon-deep)] text-white shadow-sm'
                      : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Help overlay
// ---------------------------------------------------------------------------

interface HelpOverlayProps {
  open: boolean
  onClose: () => void
}

function HelpOverlay({ open, onClose }: HelpOverlayProps) {
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
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function VolumeMeter() {
  const { t } = useI18n()
  const { settingsOpen, closeSettings } = useSettings()
  const { helpOpen, closeHelp } = useHelp()

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

  const [phase, setPhase] = useState<Phase>('idle')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [volume, setVolume] = useState(0) // 0-100 dB scale — used for bar + warning
  const [displayVolume, setDisplayVolume] = useState(0) // EMA-smoothed, throttled — used for the label
  const [baseline, setBaseline] = useState(30)
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [isWarning, setIsWarning] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Read persisted values on the client after hydration
  useEffect(() => {
    setBaseline(readStorage(STORAGE_KEY_BASELINE, 30))
    setThreshold(readStorage(STORAGE_KEY_THRESHOLD, DEFAULT_THRESHOLD))
  }, [])

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const alertCooldownRef = useRef(false)
  const calibSamplesRef = useRef<number[]>([])
  // EMA state for the display label (separate from the bar/warning raw value)
  const emaVolumeRef = useRef(0)
  const displayLastUpdateRef = useRef(0)
  // Direct DOM ref for the bar mask — bypasses React render cycle for smooth 60fps updates
  const barMaskRef = useRef<HTMLDivElement>(null)
  const calibTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Absolute dB threshold = baseline + threshold offset
  const absoluteThreshold = baseline + threshold

  // Keep a ref so the tick closure always reads the latest threshold without needing deps
  const absoluteThresholdRef = useRef(absoluteThreshold)
  useEffect(() => { absoluteThresholdRef.current = absoluteThreshold }, [absoluteThreshold])

  // Bar fills to 100% exactly when volume hits the threshold (used only for initial/idle render)
  const barPercent = absoluteThreshold > 0
    ? Math.min(100, (volume / absoluteThreshold) * 100)
    : 0

  const stopAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null
  }, [])

  const startAudio = useCallback(async (): Promise<boolean> => {
    try {
      // AudioContext must be created synchronously within the user gesture handler
      // on iOS Safari — creating it after an await loses the gesture context and
      // leaves the context permanently suspended.
      const ctx = new AudioContext()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      await ctx.resume()

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)

      streamRef.current = stream
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      return true
    } catch {
      setPermissionDenied(true)
      return false
    }
  }, [])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const ctx = audioCtxRef.current
    if (!analyser || !ctx) return

    // iOS suspends the AudioContext when the page is backgrounded or the
    // screen locks. Resume it and skip this frame — data would be stale zeros.
    if (ctx.state === 'suspended') {
      ctx.resume()
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const buf = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    const rms = Math.sqrt(sum / buf.length)
    const db = rmsToDb(rms)

    // Update the bar mask directly in the DOM — no React re-render needed,
    // avoids dropped frames from React batching on iOS Safari
    if (barMaskRef.current && absoluteThresholdRef.current > 0) {
      const pct = Math.min(100, (db / absoluteThresholdRef.current) * 100)
      barMaskRef.current.style.width = `${100 - pct}%`
    }

    // Raw value still drives the warning logic via React state
    setVolume(db)

    // EMA-smoothed value drives the display label (α=0.08 — rises fast, falls slowly)
    const EMA_ALPHA = 0.08
    emaVolumeRef.current = EMA_ALPHA * db + (1 - EMA_ALPHA) * emaVolumeRef.current
    const now = performance.now()
    if (now - displayLastUpdateRef.current >= 200) {
      displayLastUpdateRef.current = now
      setDisplayVolume(emaVolumeRef.current)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Calibration loop
  const calibTick = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const buf = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    const rms = Math.sqrt(sum / buf.length)
    const db = rmsToDb(rms)
    calibSamplesRef.current.push(db)
    setVolume(db)
    rafRef.current = requestAnimationFrame(calibTick)
  }, [])

  const handleCalibrate = useCallback(async () => {
    if (phase === 'calibrating') return
    stopAudio()
    calibSamplesRef.current = []
    setCalibrationProgress(0)
    setPhase('calibrating')
    setPermissionDenied(false)

    const ok = await startAudio()
    if (!ok) {
      setPhase('idle')
      return
    }

    // animate progress
    const start = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start
      setCalibrationProgress(Math.min(100, (elapsed / CALIBRATION_DURATION) * 100))
    }, 50)

    rafRef.current = requestAnimationFrame(calibTick)

    calibTimerRef.current = setTimeout(() => {
      clearInterval(progressInterval)
      setCalibrationProgress(100)

      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      const samples = calibSamplesRef.current
      const avg =
        samples.length > 0
          ? samples.reduce((a, b) => a + b, 0) / samples.length
          : 30
      // Add a small buffer (+5 dB) so normal breathing doesn't trigger
      const newBaseline = Math.min(85, Math.round(avg + 5))
      setBaseline(newBaseline)
      writeStorage(STORAGE_KEY_BASELINE, newBaseline)

      // Restart in active mode
      setPhase('active')
      rafRef.current = requestAnimationFrame(tick)
    }, CALIBRATION_DURATION)
  }, [phase, stopAudio, startAudio, calibTick, tick])

  const handleStart = useCallback(async () => {
    if (phase !== 'idle') return
    setPermissionDenied(false)
    const ok = await startAudio()
    if (!ok) return
    setPhase('active')
    rafRef.current = requestAnimationFrame(tick)
  }, [phase, startAudio, tick])

  const handleStop = useCallback(() => {
    stopAudio()
    setPhase('idle')
    setVolume(0)
    setDisplayVolume(0)
    emaVolumeRef.current = 0
    if (barMaskRef.current) barMaskRef.current.style.width = '100%'
    setIsWarning(false)
  }, [stopAudio])

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value)
      setThreshold(val)
      writeStorage(STORAGE_KEY_THRESHOLD, val)
    },
    [],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (calibTimerRef.current) clearTimeout(calibTimerRef.current)
      if (warningHoldTimerRef.current) clearTimeout(warningHoldTimerRef.current)
      stopAudio()
    }
  }, [stopAudio])

  // Resume AudioContext when the user returns to the page (iOS backgrounding)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const warningHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Warning: derived from the same volume state that drives the bar
  useEffect(() => {
    if (phase !== 'active') {
      if (warningHoldTimerRef.current) clearTimeout(warningHoldTimerRef.current)
      setIsWarning(false)
      return
    }
    const exceeds = volume >= absoluteThreshold
    if (exceeds) {
      if (warningHoldTimerRef.current) clearTimeout(warningHoldTimerRef.current)
      warningHoldTimerRef.current = null
      setIsWarning(true)
      if (!alertCooldownRef.current && audioCtxRef.current) {
        alertCooldownRef.current = true
        playAlertTone(audioCtxRef.current)
        setTimeout(() => {
          alertCooldownRef.current = false
        }, 2000)
      }
    } else if (isWarning && !warningHoldTimerRef.current) {
      warningHoldTimerRef.current = setTimeout(() => {
        warningHoldTimerRef.current = null
        setIsWarning(false)
      }, 1000)
    }
  }, [volume, absoluteThreshold, phase, isWarning])

  return (
    <>
      {/* Background creature — reacts to volume */}
      <Creature barPercent={barPercent} active={phase === 'active'} />

      {/* Help overlay */}
      <HelpOverlay open={helpOpen} onClose={closeHelp} />

      {/* Settings overlay — rendered outside the meter card so it floats freely */}
      <SettingsOverlay
        open={settingsOpen}
        onClose={closeSettings}
        themeMode={themeMode}
        onThemeMode={handleThemeMode}
      />

      <div className="flex w-full max-w-2xl flex-col gap-6">
        {/* Meter card */}
        <div className="island-shell rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="island-kicker mb-1">{t.volumeLevel}</p>
              <p className="m-0 text-3xl font-bold tabular-nums text-[var(--sea-ink)]">
                {phase === 'active' || phase === 'calibrating'
                  ? `${Math.round(displayVolume)}`
                  : '--'}
                <span className="ml-1 text-base font-normal text-[var(--sea-ink-soft)]">
                  {t.dbUnit}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {phase !== 'active' && phase !== 'calibrating' && (
                <button
                  onClick={handleStart}
                  className="rounded-full bg-[var(--lagoon-deep)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {t.start}
                </button>
              )}
              {(phase === 'active' || phase === 'calibrating') && (
                <button
                  onClick={handleStop}
                  className="rounded-full border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.1)] px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-[rgba(220,38,38,0.18)]"
                >
                  {t.stop}
                </button>
              )}
            </div>
          </div>

          {/* The meter bar */}
          <div className="relative mt-6">
            <div
              className={`volume-meter-track relative h-10 overflow-hidden rounded-full border border-[var(--line)] ${isWarning ? 'volume-meter-warning' : ''}`}
            >
              {/* Full-width gradient: threshold anchors at 100% */}
              <div
                className="absolute left-0 top-0 h-full w-full"
                style={{
                  background:
                    'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #f97316 75%, #ef4444 100%)',
                }}
              />

              {/* Dark mask slides in from the right — width driven directly via ref during playback */}
              <div
                ref={barMaskRef}
                className="absolute right-0 top-0 h-full bg-black/60 transition-all"
                style={{
                  width: `${100 - barPercent}%`,
                  transitionDuration: '60ms',
                }}
              />
            </div>
          </div>

          {/* Calibration progress */}
          {phase === 'calibrating' && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-[var(--sea-ink-soft)]">
                {t.calibratingMessage}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[var(--lagoon)] transition-all"
                  style={{
                    width: `${calibrationProgress}%`,
                    transitionDuration: '80ms',
                  }}
                />
              </div>
            </div>
          )}

          {permissionDenied && (
            <p className="mt-4 text-sm text-red-500">{t.micDenied}</p>
          )}

          {/* Idle prompt */}
          {phase === 'idle' && !permissionDenied && (
            <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
              {t.idlePrompt(<strong>{t.start}</strong>)}
            </p>
          )}

          {/* Expand/collapse footer — threshold + recalibrate */}
          <div className="mt-5 border-t border-[var(--line)]">
            <button
              onClick={() => setAdjustOpen((o) => !o)}
              className="flex w-full items-center justify-between pt-3 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
            >
              <span className="flex items-center gap-1.5">
                {/* sliders icon */}
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                  <circle cx="5" cy="4" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                {t.adjust}
              </span>
              <svg
                viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: adjustOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
              >
                <polyline points="4 6 8 10 12 6" />
              </svg>
            </button>

            {/* Collapsible body */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: adjustOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 250ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div className="space-y-4 pb-1 pt-4">
                  {/* Threshold slider */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="card-threshold-slider" className="text-sm font-semibold text-[var(--sea-ink)]">
                        {t.alertThreshold}
                      </label>
                      <span className="text-sm tabular-nums text-[var(--sea-ink-soft)]">
                        {t.thresholdValue(threshold)}
                      </span>
                    </div>
                    <input
                      id="card-threshold-slider"
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={threshold}
                      onChange={handleThresholdChange}
                      className="volume-slider w-full"
                    />
                    <div className="mt-1 flex justify-between text-xs text-[var(--sea-ink-soft)]">
                      <span>{t.moreSensitive}</span>
                      <span>{t.lessSensitive}</span>
                    </div>
                  </div>

                  {/* Recalibrate */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">{t.baselineTitle}</p>
                      <p className="m-0 text-xs text-[var(--sea-ink-soft)]">{t.baselineSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold tabular-nums text-[var(--sea-ink)]">
                        {Math.round(baseline)} {t.dbUnit}
                      </span>
                      <button
                        onClick={handleCalibrate}
                        className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                      >
                        {t.recalibrate}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
