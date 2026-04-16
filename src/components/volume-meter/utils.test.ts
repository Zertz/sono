import { describe, expect, it } from 'vitest'
import { formatMmSs, rmsToDb } from './utils'

describe('volume-meter utils', () => {
  it('formats mm:ss with zero padding', () => {
    expect(formatMmSs(0)).toBe('00:00')
    expect(formatMmSs(65)).toBe('01:05')
    expect(formatMmSs(600)).toBe('10:00')
  })

  it('maps RMS amplitude to a clamped 0-100 dB-like range', () => {
    expect(rmsToDb(0)).toBe(0)
    expect(rmsToDb(0.001)).toBe(0)
    expect(rmsToDb(1)).toBe(100)
  })
})
