export const STORAGE_KEY_BASELINE = 'sono_baseline'
export const STORAGE_KEY_THRESHOLD = 'sono_threshold'
export const DEFAULT_THRESHOLD = 50 // dB above baseline before warning
export const CALIBRATION_DURATION = 3000 // ms

// Duration presets: null = no limit, number = minutes
export const DURATION_PRESETS: (number | null)[] = [null, 5, 10, 15, 30]

export function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function readStorage(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const val = window.localStorage.getItem(key)
  if (val === null) return fallback
  const n = parseFloat(val)
  return isNaN(n) ? fallback : n
}

export function writeStorage(key: string, value: number) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, String(value))
  }
}

// Convert RMS amplitude (0-1) to approximate dB (0-100 scale)
export function rmsToDb(rms: number): number {
  if (rms <= 0) return 0
  // Map -60dBFS..0dBFS → 0..100
  const dbfs = 20 * Math.log10(rms)
  return Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100))
}

export function playAlertTone(audioCtx: AudioContext) {
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
