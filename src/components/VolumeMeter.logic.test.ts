import { describe, expect, it } from 'vitest'
import { getTimeLeftOnStart } from './VolumeMeter'

describe('getTimeLeftOnStart', () => {
  it('returns null when no duration is set', () => {
    expect(getTimeLeftOnStart(null)).toBeNull()
  })

  it('returns seconds when duration is set', () => {
    expect(getTimeLeftOnStart(5)).toBe(300)
  })

  it('prefers explicit duration override', () => {
    expect(getTimeLeftOnStart(5, 10)).toBe(600)
    expect(getTimeLeftOnStart(5, null)).toBeNull()
  })
})
