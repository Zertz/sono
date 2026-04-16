'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Creature from './Creature'
import SegmentedControl from './SegmentedControl'
import HelpOverlay from './volume-meter/HelpOverlay'
import TimerRing from './volume-meter/TimerRing'
import {
  CALIBRATION_DURATION,
  DEFAULT_THRESHOLD,
  DURATION_PRESETS,
  STORAGE_KEY_BASELINE,
  STORAGE_KEY_THRESHOLD,
  formatMmSs,
  playAlertTone,
  readStorage,
  rmsToDb,
  writeStorage,
} from './volume-meter/utils'
import { useI18n } from '../i18n/context'
import { useHelp } from '../routes/__root'

type Phase = 'idle' | 'calibrating' | 'active'

export default function VolumeMeter() {
  const { t } = useI18n()
  const { helpOpen, closeHelp } = useHelp()

  const [phase, setPhase] = useState<Phase>('idle')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [volume, setVolume] = useState(0) // 0-100 dB scale — used for bar + warning
  const [displayVolume, setDisplayVolume] = useState(0) // EMA-smoothed, throttled — used for the label
  const [baseline, setBaseline] = useState(20)
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [isWarning, setIsWarning] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [duration, setDuration] = useState<number | null>(null) // null = no limit, else minutes
  const [timeLeft, setTimeLeft] = useState<number | null>(null) // seconds remaining
  const [sessionEnded, setSessionEnded] = useState(false)

  // Read persisted values on the client after hydration
  useEffect(() => {
    setBaseline(readStorage(STORAGE_KEY_BASELINE, 20))
    setThreshold(readStorage(STORAGE_KEY_THRESHOLD, DEFAULT_THRESHOLD))
  }, [])

  // Check whether microphone permission has already been granted
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    let permStatus: PermissionStatus | null = null
    let mounted = true
    const handleChange = () => {
      if (permStatus && mounted) setMicPermissionGranted(permStatus.state === 'granted')
    }
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((status) => {
        if (!mounted) return
        permStatus = status
        setMicPermissionGranted(status.state === 'granted')
        status.addEventListener('change', handleChange)
      })
      .catch(() => {
        // Permissions API not supported or query failed — leave state as false
      })
    return () => {
      mounted = false
      permStatus?.removeEventListener('change', handleChange)
    }
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
  // Ref for the timer ring wrapper — measured by TimerRing's ResizeObserver
  const ringWrapperRef = useRef<HTMLDivElement>(null)

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
    setSessionEnded(false)
    const ok = await startAudio()
    if (!ok) return
    setPhase('active')
    rafRef.current = requestAnimationFrame(tick)
  }, [phase, startAudio, tick])

  const handleDurationSelect = useCallback(async (preset: number | null) => {
    setDuration(preset)
    if (preset === null) {
      // "No limit" — clear any running countdown but keep the meter going
      setTimeLeft(null)
      return
    }
    if (phase === 'active') {
      // Meter already running — just start the countdown
      setTimeLeft(preset * 60)
    } else if (phase === 'idle') {
      // Meter not running — start everything
      setPermissionDenied(false)
      setSessionEnded(false)
      const ok = await startAudio()
      if (!ok) return
      setPhase('active')
      setTimeLeft(preset * 60)
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [phase, startAudio, tick])

  const handleStop = useCallback(() => {
    stopAudio()
    setPhase('idle')
    setVolume(0)
    setDisplayVolume(0)
    setDuration(null)
    setTimeLeft(null)
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

  // Countdown timer — ticks every second while active with a duration set
  useEffect(() => {
    if (phase !== 'active' || timeLeft === null) return
    if (timeLeft <= 0) {
      handleStop()
      setSessionEnded(true)
      const t = setTimeout(() => setSessionEnded(false), 4000)
      return () => clearTimeout(t)
    }
    const interval = setInterval(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearInterval(interval)
  }, [phase, timeLeft, handleStop])

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

      <div className="flex w-full max-w-2xl flex-col gap-2">
        {/* Meter card — p-[6px] gap always reserved for the timer ring (no layout shift) */}
        <div ref={ringWrapperRef} className="relative p-[6px]">
          {/* Timer ring — SVG drawn around the card, inset to the wrapper boundary */}
          <TimerRing timeLeft={timeLeft} totalSeconds={duration !== null ? duration * 60 : null} containerRef={ringWrapperRef} />
          <div className="island-shell rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="island-kicker mb-1">{t.volumeLevel}</p>
              <p className="m-0 text-3xl font-bold tabular-nums text-[var(--sea-ink)]" style={{ visibility: phase === 'active' || phase === 'calibrating' ? 'visible' : 'hidden' }}>
                {Math.round(displayVolume)}
                <span className="ml-1 text-base font-normal text-[var(--sea-ink-soft)]">
                  {t.dbUnit}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {phase !== 'active' && phase !== 'calibrating' && (
                <button
                  onClick={() => handleStart()}
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

          {/* Timer controls / idle tip area */}
          <div className="mt-4 min-h-[2rem]">
            {phase === 'idle' ? (
              <p className="text-center text-sm text-[var(--sea-ink-soft)]">
                <span>{t.idlePromptLine1}</span>
                {!micPermissionGranted && (
                  <>
                    <br />
                    <span>{t.idlePromptLine2}</span>
                  </>
                )}
              </p>
            ) : (
              <div
                className="flex items-center justify-between gap-3"
                style={{ visibility: phase === 'active' ? 'visible' : 'hidden' }}
              >
                {timeLeft !== null ? (
                  /* Running timer: countdown + stop button */
                  <>
                    <span className="text-sm tabular-nums text-[var(--sea-ink-soft)]">
                      {formatMmSs(timeLeft)}
                    </span>
                    <button
                      onClick={() => { setTimeLeft(null); setDuration(null) }}
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:border-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                    >
                      {t.stopTimer}
                    </button>
                  </>
                ) : (
                  /* No active countdown: duration label + preset picker */
                  <SegmentedControl
                    label={t.duration}
                    options={DURATION_PRESETS.map((preset) => ({
                      value: preset,
                      label: preset === null ? t.durationNone : t.durationMinutes(preset),
                    }))}
                    value={duration}
                    onChange={handleDurationSelect}
                  />
                )}
              </div>
            )}
          </div>

          {permissionDenied && (
            <p className="mt-4 text-sm text-red-500">{t.micDenied}</p>
          )}

          {/* Session ended message */}
          {sessionEnded && (
            <p className="mt-4 text-sm font-semibold text-[var(--lagoon-deep)]">
              {t.sessionEnded}
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

                  {/* Recalibrate / calibration progress */}
                  {phase === 'calibrating' ? (
                    <div>
                      <p className="mb-2 text-xs text-[var(--sea-ink-soft)]">
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
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">{t.baselineTitle}</p>
                        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">{t.baselineSubtitle}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-[var(--sea-ink)]">
                          {Math.round(baseline)} {t.dbUnit}
                        </span>
                        <button
                          onClick={handleCalibrate}
                          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] whitespace-nowrap"
                        >
                          {t.recalibrate}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end timer ring wrapper */}
        </div>

      </div>
    </>
  )
}
